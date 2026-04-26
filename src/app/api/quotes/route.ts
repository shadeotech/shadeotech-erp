import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Customer from '@/lib/models/Customer'
import Quote from '@/lib/models/Quote'
import { verifyAuth } from '@/lib/auth'
import type { User as UserType } from '@/types/database'
import { sendEmail } from '@/lib/email'

async function getAuthUser(request: NextRequest): Promise<{ user: UserType | null; userId: string } | null> {
  const authPayload = await verifyAuth(request)
  if (!authPayload) return null
  await connectDB()
  const raw = await User.findById(authPayload.userId).select('-password').lean()
  if (!raw) return null
  let permissionsObj: Record<string, string> = {}
  if (raw.permissions) {
    if (raw.permissions instanceof Map) {
      ;(raw.permissions as Map<string, string>).forEach((value: string, key: string) => {
        permissionsObj[key] = value
      })
    } else if (typeof raw.permissions === 'object' && !Array.isArray(raw.permissions)) {
      permissionsObj = raw.permissions as Record<string, string>
    }
  }
  const user: UserType = {
    _id: raw._id.toString(),
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    role: raw.role,
    isActive: raw.isActive,
    permissions: permissionsObj as Record<string, 'no' | 'read' | 'edit' | 'full'>,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
  return { user, userId: authPayload.userId }
}

function toApiQuote(doc: any) {
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    quoteNumber: doc.quoteNumber,
    customerId: doc.customerId,
    customerName: doc.customerName,
    sideMark: doc.sideMark,
    status: doc.status,
    items: doc.items || [],
    subtotal: doc.subtotal,
    taxRate: doc.taxRate,
    taxAmount: doc.taxAmount,
    totalAmount: doc.totalAmount,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : undefined,
    notes: doc.notes,
    priceAdjustPercent: doc.priceAdjustPercent || 0,
    priceAdjustFlat: doc.priceAdjustFlat || 0,
    contractType: doc.contractType,
    isFranchisee: doc.isFranchisee,
    visuals: doc.visuals,
    history: (doc.history || []).map((h: any) => ({
      status: h.status,
      timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
      note: h.note,
    })),
    addOns: doc.addOns || [],
    referenceNumber: doc.referenceNumber,
    saleAgent: doc.saleAgent,
    discountType: doc.discountType,
    discountValue: doc.discountValue,
    adminNote: doc.adminNote,
    installationAmount: doc.installationAmount || 0,
    shipToStreet: doc.shipToStreet,
    shipToCity: doc.shipToCity,
    shipToState: doc.shipToState,
    shipToPostcode: doc.shipToPostcode,
    shipToCountry: doc.shipToCountry,
    dealerId: doc.dealerId,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search')

    const filter: Record<string, unknown> = {}

    // Role-based filtering
    const escapedEmail = auth.user.email?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || ''
    if (auth.user.role === 'CUSTOMER') {
      // Quotes may be stored with either the User._id or the CRM Customer._id as customerId.
      // Match both so customers see quotes created from the admin CRM view.
      const customerRecord = escapedEmail
        ? await Customer.findOne({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } }).lean()
        : null
      const matchIds = [auth.userId]
      if (customerRecord) matchIds.push((customerRecord as any)._id.toString())
      filter.customerId = { $in: matchIds }
      // Customers only see quotes that have been sent to them (not drafts or internal statuses)
      filter.status = { $in: ['SENT', 'WON', 'LOST'] }
    } else if (auth.user.role === 'DEALER') {
      const customerRecord = escapedEmail
        ? await Customer.findOne({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } }).lean()
        : null
      const matchIds = [auth.userId]
      if (customerRecord) matchIds.push((customerRecord as any)._id.toString())
      filter.customerId = { $in: matchIds }
    }

    // Query param filters — only for admin/staff; never override role-based security filters
    if (auth.user.role !== 'CUSTOMER' && auth.user.role !== 'DEALER') {
      if (status && status !== 'all') {
        filter.status = status
      }
      if (customerId) {
        filter.customerId = customerId
      }
    }

    if (search) {
      filter.$or = [
        { quoteNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { sideMark: { $regex: search, $options: 'i' } },
      ]
    }

    const quotes = await Quote.find(filter).sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      quotes: quotes.map(toApiQuote),
    })
  } catch (error) {
    console.error('Quotes GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = auth.user.role === 'ADMIN' || auth.user.role === 'STAFF'
    const isDealer = auth.user.role === 'DEALER'
    if (!isAdmin && !isDealer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const {
      quoteNumber,
      customerId: rawCustomerId,
      customerName,
      sideMark,
      status: rawStatus = 'DRAFT',
      items = [],
      subtotal = 0,
      taxRate = 8.25,
      taxAmount = 0,
      totalAmount = 0,
      expiryDate,
      notes,
      priceAdjustPercent = 0,
      priceAdjustFlat = 0,
      contractType,
      isFranchisee = false,
      visuals,
      addOns = [],
      referenceNumber,
      saleAgent,
      discountType,
      discountValue,
      adminNote,
      installationAmount = 0,
      shipToStreet,
      shipToCity,
      shipToState,
      shipToPostcode,
      shipToCountry,
    } = body

    // Dealers always use their own userId as customerId and dealerId
    const customerId = isDealer ? auth.userId : rawCustomerId
    const dealerId = isDealer ? auth.userId : undefined

    // Dealers skip customer lookup — the quote is "on behalf of" themselves
    let resolvedCustomerName = customerName
    let resolvedSideMark = sideMark
    let status: string = isDealer ? 'SENT' : rawStatus

    if (!isDealer && customerId) {
      if (typeof customerId !== 'string' || customerId.startsWith('temp_') || !mongoose.Types.ObjectId.isValid(customerId)) {
        return NextResponse.json(
          { error: 'Please select a customer from the list. Quotes cannot be created for unregistered customers.' },
          { status: 400 }
        )
      }
      const customerUser = await User.findById(customerId).lean()
      if (customerUser) {
        if (customerUser.role !== 'CUSTOMER') {
          return NextResponse.json({ error: 'Quotes can only be created for customer users, not dealers' }, { status: 400 })
        }
        if (!resolvedCustomerName) {
          resolvedCustomerName = [customerUser.firstName, customerUser.lastName].filter(Boolean).join(' ') || 'Customer'
        }
        if (status === 'DRAFT') status = 'SENT'
      } else {
        const crmCustomer = await Customer.findById(customerId).lean()
        if (!crmCustomer) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }
        resolvedCustomerName = [crmCustomer.firstName, crmCustomer.lastName].filter(Boolean).join(' ') || crmCustomer.companyName || crmCustomer.sideMark || 'Customer'
        resolvedSideMark = resolvedSideMark || crmCustomer.sideMark
        if (status === 'DRAFT' && crmCustomer.email) {
          const escapedEmail = crmCustomer.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const portalUser = await User.findOne({
            email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') },
            role: 'CUSTOMER',
          }).select('_id').lean()
          if (portalUser) status = 'SENT'
        }
      }
    }

    if (isDealer && !resolvedCustomerName) {
      const dealerUser = await User.findById(auth.userId).select('firstName lastName').lean()
      if (dealerUser) {
        resolvedCustomerName = [dealerUser.firstName, dealerUser.lastName].filter(Boolean).join(' ') || 'Dealer'
      }
    }

    const quote = await Quote.create({
      quoteNumber,
      customerId,
      customerName: resolvedCustomerName,
      sideMark: resolvedSideMark,
      status,
      items,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      notes,
      priceAdjustPercent,
      priceAdjustFlat,
      contractType: isDealer ? undefined : contractType,
      isFranchisee: isDealer ? false : isFranchisee,
      visuals,
      addOns: Array.isArray(addOns) ? addOns : [],
      createdById: auth.userId,
      dealerId,
      referenceNumber,
      saleAgent: isDealer ? undefined : saleAgent,
      discountType: isDealer ? undefined : discountType,
      discountValue: isDealer ? undefined : discountValue,
      adminNote: isDealer ? undefined : adminNote,
      installationAmount,
      shipToStreet,
      shipToCity,
      shipToState,
      shipToPostcode,
      shipToCountry,
    })

    // Send quote email to customer (non-blocking — skip for dealer-placed orders)
    if (!isDealer && status === 'SENT' && customerId) {
      try {
        let customerEmail: string | undefined
        const userDoc = await User.findById(customerId).select('email').lean()
        if (userDoc?.email) {
          customerEmail = userDoc.email
        } else {
          const crmDoc = await Customer.findById(customerId).select('email').lean()
          if (crmDoc?.email) customerEmail = crmDoc.email
        }

        if (customerEmail) {
          const itemRows = (items as any[])
            .map(
              (item: any) =>
                `<tr>
                  <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${item.productName || 'Product'}</td>
                  <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity ?? 1}</td>
                  <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$${(item.totalPrice ?? 0).toFixed(2)}</td>
                </tr>`
            )
            .join('')

          const formattedTotal = `$${(totalAmount as number).toFixed(2)}`
          const expiryStr = expiryDate ? new Date(expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'

          await sendEmail({
            to: customerEmail,
            subject: `Your Quote ${quoteNumber} from Shadeotech`,
            html: `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:#1e3a5f;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;">Shadeotech</h1>
    <p style="color:#93c5fd;margin:8px 0 0;">Your Quote is Ready</p>
  </div>
  <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
    <p>Hi ${resolvedCustomerName},</p>
    <p>Thank you for your interest in Shadeotech. Please find your quote details below.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr style="background:#e5e7eb;">
        <th style="padding:8px 12px;text-align:left;">Quote #</th>
        <td style="padding:8px 12px;">${quoteNumber}</td>
        <th style="padding:8px 12px;text-align:left;">Expires</th>
        <td style="padding:8px 12px;">${expiryStr}</td>
      </tr>
    </table>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead>
        <tr style="background:#e5e7eb;">
          <th style="padding:8px 12px;text-align:left;">Product</th>
          <th style="padding:8px 12px;text-align:center;">Qty</th>
          <th style="padding:8px 12px;text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div style="text-align:right;margin-top:8px;">
      <p style="margin:4px 0;color:#6b7280;">Subtotal: $${(subtotal as number).toFixed(2)}</p>
      ${taxAmount ? `<p style="margin:4px 0;color:#6b7280;">Tax (${taxRate}%): $${(taxAmount as number).toFixed(2)}</p>` : ''}
      <p style="font-size:18px;font-weight:bold;color:#1e3a5f;margin:8px 0;">Total: ${formattedTotal}</p>
    </div>
    ${notes ? `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin-top:16px;"><strong>Notes:</strong><p style="margin:4px 0;">${notes}</p></div>` : ''}
    <p style="margin-top:24px;">To accept this quote or ask any questions, please log in to your customer portal or reply to this email.</p>
    <p style="color:#6b7280;font-size:12px;margin-top:24px;">Shadeotech &bull; billing@shadeotech.com</p>
  </div>
</body>
</html>`,
          })
        }
      } catch (emailErr) {
        console.error('[quotes] Failed to send quote email:', emailErr)
      }
    }

    return NextResponse.json({ quote: toApiQuote(quote) }, { status: 201 })
  } catch (error: any) {
    console.error('Quotes POST error:', error)
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Quote number already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
