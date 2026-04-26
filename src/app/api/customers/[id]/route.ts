import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import { verifyAuth } from '@/lib/auth';
import { validatePhone } from '@/lib/phoneValidation';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    await connectDB();

    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const c = customer as any;

    // Resolve referrer name if this customer was referred
    let referredByName: string | null = null
    let referredById: string | null = null
    if (c.referredById) {
      referredById = c.referredById.toString()
      const referrer = await Customer.findById(referredById).select('firstName lastName companyName').lean() as any
      if (referrer) {
        referredByName = [referrer.firstName, referrer.lastName].filter(Boolean).join(' ') || referrer.companyName || null
      }
    }

    return NextResponse.json({
      _id: c._id.toString(),
      id: c._id.toString(),
      name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.companyName || c.sideMark || 'Unknown',
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      mobile: c.mobile,
      fax: c.fax,
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
      leadSourceDetail: c.leadSourceDetail,
      referredById,
      referredByName,
      companyName: c.companyName,
      taxExempt: c.taxExempt,
      files: (c.files || []).map((f: any) => ({
        _id: f._id?.toString(),
        name: f.name,
        url: f.url,
        publicId: f.publicId,
        category: f.category,
        uploadedAt: f.uploadedAt,
        uploadedBy: f.uploadedBy,
      })),
      ownerName: c.ownerName,
      storeNumber: c.storeNumber,
      shippingAddress: c.shippingAddress,
      contacts: (c.contacts || []).map((ct: any) => ({
        _id: ct._id?.toString(),
        name: ct.name,
        relationship: ct.relationship,
        phone: ct.phone,
        mobile: ct.mobile,
        email: ct.email,
        notes: ct.notes,
      })),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const SIDE_MARK_TYPE_CODES: Record<string, string> = { FRANCHISEE: 'A', RESIDENTIAL: 'R', COMMERCIAL: 'C', PARTNER: 'P' };
const DB_LEAD_SOURCE_CODES: Record<string, string> = { META: 'MT', GOOGLE: 'GL', REFERRAL: 'RF', PARTNER_REFERRAL: 'PR', DOOR_HANGER: 'DH', DOOR_TO_DOOR: 'DD', LINKEDIN: 'LK', VEHICLE: 'VH', WALK_IN: 'WI', OTHER_PAID: 'OP', OTHER_ORGANIC: 'OO' };

function generateRandomFiveDigits() { return Math.floor(10000 + Math.random() * 90000).toString(); }

async function generateSideMark(customerType: string, leadSource?: string): Promise<string> {
  const t = SIDE_MARK_TYPE_CODES[customerType] || 'R';
  const s = leadSource ? (DB_LEAD_SOURCE_CODES[leadSource] || 'XX') : 'XX';
  const sideMark = `SH${t}-${s}${generateRandomFiveDigits()}`;
  const existing = await Customer.findOne({ sideMark }).lean();
  if (existing) return generateSideMark(customerType, leadSource);
  return sideMark;
}

const UI_TO_DB_LEAD_SOURCE: Record<string, string> = {
  'Meta Ads': 'META',
  'Google Ads': 'GOOGLE',
  'Website Form': 'OTHER_ORGANIC',
  Calendar: 'WALK_IN',
  Referral: 'REFERRAL',
  Manual: 'WALK_IN',
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    await connectDB();

    const customer = await Customer.findById(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const body = await request.json();
    if (body.phone !== undefined && body.phone !== null) {
      const phoneErr = validatePhone(String(body.phone).trim());
      if (phoneErr) {
        return NextResponse.json({ error: phoneErr }, { status: 400 });
      }
    }
    if (body.mobile !== undefined && body.mobile !== null) {
      const mobileErr = validatePhone(String(body.mobile).trim());
      if (mobileErr) {
        return NextResponse.json({ error: mobileErr }, { status: 400 });
      }
    }

    const {
      name,
      type,
      email,
      phone,
      mobile,
      fax,
      address,
      street,
      town,
      city,
      country,
      postcode,
      sideMark,
      source,
      status,
      taxExempt,
      ownerName,
      storeNumber,
      shippingAddress,
      contacts,
    } = body;

    if (name !== undefined) {
      const nameParts = String(name).trim().split(/\s+/);
      customer.firstName = nameParts[0] || '';
      customer.lastName = nameParts.slice(1).join(' ') || '';
    }
    const typeChanged = type !== undefined && type !== customer.customerType;
    if (typeChanged) {
      customer.customerType = type;
      // Regenerate sidemark to reflect new type code
      customer.sideMark = await generateSideMark(type, customer.leadSource);
    } else if (type !== undefined) {
      customer.customerType = type;
    }
    if (status !== undefined) customer.status = status;
    if (email !== undefined) customer.email = email?.trim() || undefined;
    if (phone !== undefined) customer.phone = phone?.trim() || undefined;
    if (mobile !== undefined) customer.mobile = mobile?.trim() || undefined;
    if (fax !== undefined) customer.fax = fax?.trim() || undefined;
    if (address !== undefined) customer.address = address?.trim() || undefined;
    if (street !== undefined) customer.street = street?.trim() || undefined;
    if (town !== undefined) customer.town = town?.trim() || undefined;
    if (city !== undefined) customer.city = city?.trim() || undefined;
    if (country !== undefined) customer.country = country?.trim() || undefined;
    if (postcode !== undefined) customer.postcode = postcode?.trim() || undefined;
    if (sideMark !== undefined && !typeChanged) {
      customer.sideMark = sideMark?.trim() ?? customer.sideMark;
    }
    if (source !== undefined) {
      customer.leadSource = (UI_TO_DB_LEAD_SOURCE[source] || source) as any;
    }
    if (taxExempt !== undefined) {
      customer.taxExempt = taxExempt === true;
    }
    if (ownerName !== undefined) customer.ownerName = ownerName?.trim() || undefined;
    if (storeNumber !== undefined) customer.storeNumber = storeNumber?.trim() || undefined;
    if (shippingAddress !== undefined) customer.shippingAddress = shippingAddress?.trim() || undefined;
    if (contacts !== undefined) (customer as any).contacts = contacts;

    await customer.save();

    const updated = customer.toObject() as any;
    return NextResponse.json({
      success: true,
      customer: {
        _id: updated._id.toString(),
        id: updated._id.toString(),
        name: [updated.firstName, updated.lastName].filter(Boolean).join(' ') || updated.sideMark,
        ...updated,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
