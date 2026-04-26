import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import User from '@/lib/models/User';
import { verifyAuth } from '@/lib/auth';
import { validatePhone } from '@/lib/phoneValidation';

export async function GET(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const [customers, signupUsers] = await Promise.all([
      Customer.find({}).sort({ createdAt: -1 }).lean(),
      User.find({ role: { $in: ['CUSTOMER', 'DEALER'] } }).select('-password').lean(),
    ]);

    const normalized = customers.map((c: any) => ({
      _id: c._id.toString(),
      id: c._id.toString(),
      name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.companyName || c.sideMark || 'Unknown',
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      mobile: c.mobile,
      address: c.address,
      street: c.street,
      town: c.town,
      city: c.city,
      country: c.country,
      postcode: c.postcode,
      sideMark: c.sideMark,
      customerType: c.customerType,
      status: c.status,
      leadSource: c.leadSource,
      companyName: c.companyName,
      taxExempt: c.taxExempt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    // Include signed-up users who don't already have a Customer record (matched by email)
    const customerEmails = new Set(
      customers.map((c: any) => c.email?.toLowerCase()).filter(Boolean)
    );
    const signupEntries = (signupUsers as any[])
      .filter((u) => !u.email || !customerEmails.has(u.email.toLowerCase()))
      .map((u) => ({
        _id: u._id.toString(),
        id: u._id.toString(),
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Unknown',
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone || '',
        mobile: u.mobile || '',
        address: u.street || '',
        street: u.street || '',
        town: u.town || '',
        city: u.city || '',
        country: u.country || '',
        postcode: u.postcode || '',
        sideMark: '',
        customerType: u.role === 'DEALER' ? 'PARTNER' : 'RESIDENTIAL',
        status: 'LEAD',
        leadSource: 'OTHER_ORGANIC',
        companyName: '',
        taxExempt: false,
        isSignupUser: true,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));

    // Final dedup by email (Customer records take precedence over signup User entries)
    const seenEmails = new Set<string>();
    const seenIds = new Set<string>();
    const all = [...normalized, ...signupEntries].filter((entry) => {
      const emailKey = entry.email?.toLowerCase();
      const idKey = entry.id;
      if (seenIds.has(idKey)) return false;
      if (emailKey && seenEmails.has(emailKey)) return false;
      seenIds.add(idKey);
      if (emailKey) seenEmails.add(emailKey);
      return true;
    });

    return NextResponse.json({ customers: all }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const UI_TO_DB_LEAD_SOURCE: Record<string, string> = {
  'Meta Ads': 'META',
  'Google Ads': 'GOOGLE',
  'Website Form': 'OTHER_ORGANIC',
  Calendar: 'WALK_IN',
  Referral: 'REFERRAL',
  Manual: 'WALK_IN',
  'Quick Quote': 'WALK_IN',
};

// Side Mark format: SHT-LL#####
// T = type: A=At Shades Franchisee, R=Residential, C=Commercial, P=Partner
// LL = source: MT, GL, RF, PR, DH, DD, LK, VH, WI, OP, OO
const SIDE_MARK_TYPE_CODES: Record<string, string> = {
  FRANCHISEE: 'A',
  RESIDENTIAL: 'R',
  COMMERCIAL: 'C',
  PARTNER: 'P',
};

const DB_LEAD_SOURCE_CODES: Record<string, string> = {
  META: 'MT',
  GOOGLE: 'GL',
  REFERRAL: 'RF',
  PARTNER_REFERRAL: 'PR',
  DOOR_HANGER: 'DH',
  DOOR_TO_DOOR: 'DD',
  LINKEDIN: 'LK',
  VEHICLE: 'VH',
  WALK_IN: 'WI',
  OTHER_PAID: 'OP',
  OTHER_ORGANIC: 'OO',
};

function generateRandomFiveDigits(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

async function generateSideMark(customerType: string, leadSource?: string): Promise<string> {
  const typeCode = SIDE_MARK_TYPE_CODES[customerType] || 'R';
  const sourceCode = leadSource ? (DB_LEAD_SOURCE_CODES[leadSource] || 'XX') : 'XX';
  const randomNum = generateRandomFiveDigits();
  const sideMark = `SH${typeCode}-${sourceCode}${randomNum}`;

  // Ensure uniqueness (retry on collision, very rare)
  const existing = await Customer.findOne({ sideMark }).lean();
  if (existing) {
    return generateSideMark(customerType, leadSource);
  }
  return sideMark;
}

export async function POST(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      name, type, email, phone, mobile, fax, address,
      street, town, city, country, postcode, sideMark, source,
      companyName, ownerName, storeNumber, shippingAddress,
      partnerType, companyType, numberOfWindows, productsOfInterest,
      taxExempt,
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    if (phone !== undefined && phone !== null) {
      const phoneErr = validatePhone(String(phone).trim());
      if (phoneErr) {
        return NextResponse.json({ error: phoneErr }, { status: 400 });
      }
    }
    if (mobile !== undefined && mobile !== null) {
      const mobileErr = validatePhone(String(mobile).trim());
      if (mobileErr) {
        return NextResponse.json({ error: mobileErr }, { status: 400 });
      }
    }

    // Check for duplicate customer by email or phone
    if (email?.trim()) {
      const existingByEmail = await Customer.findOne({ email: email.trim().toLowerCase() }).lean();
      if (existingByEmail) {
        return NextResponse.json({ error: 'A customer with this email already exists.' }, { status: 409 });
      }
    }
    if (phone?.trim()) {
      const existingByPhone = await Customer.findOne({ phone: phone.trim() }).lean();
      if (existingByPhone) {
        return NextResponse.json({ error: 'A customer with this phone number already exists.' }, { status: 409 });
      }
    }

    const nameParts = String(name).trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Auto-generate side mark if not provided (format: SHT-LL#####)
    // Support both raw DB keys (META, GOOGLE) and UI labels (Meta Ads, Google Ads)
    const DB_LEAD_SOURCES = Object.keys(DB_LEAD_SOURCE_CODES);
    const dbLeadSource = source
      ? (DB_LEAD_SOURCES.includes(source) ? source : (UI_TO_DB_LEAD_SOURCE[source] || 'OTHER_ORGANIC'))
      : undefined;
    const generatedSideMark = sideMark?.trim() || await generateSideMark(type, dbLeadSource);

    const customer = new Customer({
      sideMark: generatedSideMark,
      customerType: type,
      status: 'LEAD',
      firstName,
      lastName,
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      mobile: mobile?.trim() || undefined,
      fax: fax?.trim() || undefined,
      address: address?.trim() || undefined,
      street: street?.trim() || undefined,
      town: town?.trim() || undefined,
      city: city?.trim() || undefined,
      country: country?.trim() || undefined,
      postcode: postcode?.trim() || undefined,
      leadSource: dbLeadSource,
      companyName: companyName?.trim() || undefined,
      ownerName: ownerName?.trim() || undefined,
      storeNumber: storeNumber?.trim() || undefined,
      shippingAddress: shippingAddress?.trim() || undefined,
      partnerType: partnerType || undefined,
      companyType: companyType || undefined,
      numberOfWindows: numberOfWindows || undefined,
      productsOfInterest: productsOfInterest || undefined,
      taxExempt: taxExempt === true,
    });

    await customer.save();

    const created = customer.toObject();
    return NextResponse.json(
      {
        success: true,
        customer: {
          _id: created._id.toString(),
          id: created._id.toString(),
          name: [firstName, lastName].filter(Boolean).join(' ') || created.sideMark,
          firstName,
          lastName,
          email: created.email,
          phone: created.phone,
          address: created.address,
          sideMark: created.sideMark,
          customerType: created.customerType,
          status: created.status,
          leadSource: created.leadSource,
          taxExempt: created.taxExempt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
