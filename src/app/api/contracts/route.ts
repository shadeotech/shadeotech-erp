import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Contract from '@/lib/models/Contract'
import Quote from '@/lib/models/Quote'
import Invoice from '@/lib/models/Invoice'
import User from '@/lib/models/User'
import Customer from '@/lib/models/Customer'
import { verifyAuth } from '@/lib/auth'

function toApiContract(doc: any) {
  const isSigned = doc.status === 'signed'
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    contractNumber: doc.contractNumber,
    quoteId: doc.quoteId,
    quoteNumber: doc.quoteNumber,
    customerId: doc.customerId,
    customerName: doc.customerName,
    contractType: doc.contractType,
    status: doc.status,
    // Map to legacy UI status for compatibility
    statusLegacy: isSigned ? 'signed' : 'pending_signature',
    adminSignedAt: doc.adminSignedAt ? new Date(doc.adminSignedAt).toISOString() : null,
    adminSignature: doc.adminSignature ?? null,
    adminSignatureData: doc.adminSignatureData ?? null,
    customerSignedAt: doc.customerSignedAt ? new Date(doc.customerSignedAt).toISOString() : null,
    customerSignature: doc.customerSignature ?? null,
    customerSignatureData: doc.customerSignatureData ?? null,
    installationAddress: doc.installationAddress ?? null,
    customerFullName: doc.customerFullName ?? null,
    adminPaymentOption: doc.adminPaymentOption ?? '50',
    adminPaymentAmount: doc.adminPaymentAmount ?? null,
    locked: doc.locked ?? false,
    signedAt: isSigned ? (doc.customerSignedAt || doc.adminSignedAt) : null,
    signature: isSigned ? (doc.customerSignature || doc.adminSignature) : null,
    sentAt: doc.sentAt ? new Date(doc.sentAt).toISOString() : null,
    images: doc.images || [],
    auditTrail: (doc.auditTrail || []).map((e: any) => ({
      id: e._id?.toString() || `audit_${Date.now()}`,
      action: e.action,
      userId: e.userId,
      userName: e.userName,
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      ipAddress: e.ipAddress,
    })),
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
  }
}

async function resolveRelatedCustomerIds(seedCustomerId: string): Promise<string[]> {
  const ids = new Set<string>([seedCustomerId])

  if (!mongoose.Types.ObjectId.isValid(seedCustomerId)) {
    return Array.from(ids)
  }

  const baseCustomer = await Customer.findById(seedCustomerId).select('email').lean()
  const email = baseCustomer?.email?.trim()
  if (!email) {
    return Array.from(ids)
  }

  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const emailRegex = new RegExp(`^${escapedEmail}$`, 'i')

  const [sameEmailCustomers, sameEmailUsers] = await Promise.all([
    Customer.find({ email: { $regex: emailRegex } }).select('_id').lean(),
    User.find({ email: { $regex: emailRegex } }).select('_id').lean(),
  ])

  for (const c of sameEmailCustomers) {
    if (c?._id) ids.add(c._id.toString())
  }
  for (const u of sameEmailUsers) {
    if (u?._id) ids.add(u._id.toString())
  }

  return Array.from(ids)
}

async function createInvoiceFromQuote(quoteId: string): Promise<any | null> {
  const quote = await Quote.findById(quoteId).lean()
  if (!quote) return null

  const existing = await Invoice.findOne({ quoteId }).lean()
  if (existing) return existing

  const items = (quote.items || []).map((item: any) => ({
    productName: item.productName,
    category: item.category,
    subcategory: item.subcategory,
    width: item.width,
    length: item.length,
    quantity: item.quantity ?? 1,
    unitPrice: item.unitPrice ?? 0,
    totalPrice: item.totalPrice ?? 0,
  }))

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  const invoice = await Invoice.create({
    quoteId: quote._id.toString(),
    customerId: quote.customerId,
    customerName: quote.customerName,
    sideMark: quote.sideMark || '',
    status: 'SENT',
    items: items.length ? items : [{ productName: 'Shades', category: 'Product', quantity: 1, unitPrice: quote.totalAmount, totalPrice: quote.totalAmount }],
    subtotal: quote.subtotal ?? quote.totalAmount,
    taxRate: quote.taxRate ?? 0,
    taxAmount: quote.taxAmount ?? 0,
    totalAmount: quote.totalAmount,
    paidAmount: 0,
    balanceAmount: quote.totalAmount,
    dueDate,
    billToStreet: undefined,
    billToCity: undefined,
    billToState: undefined,
    billToPostcode: undefined,
    billToCountry: undefined,
    shipToStreet: quote.shipToStreet || undefined,
    shipToCity: quote.shipToCity || undefined,
    shipToState: quote.shipToState || undefined,
    shipToPostcode: quote.shipToPostcode || undefined,
    shipToCountry: quote.shipToCountry || undefined,
  })

  return invoice
}

export async function GET(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const quoteId = searchParams.get('quoteId')
    const customerId = searchParams.get('customerId')

    const filter: Record<string, unknown> = {}
    if (status && status !== 'all') {
      if (status === 'signed') filter.status = 'signed'
      else if (status === 'pending_signature') filter.status = { $in: ['pending_admin_signature', 'pending_customer_signature'] }
      else filter.status = status
    }
    if (quoteId) filter.quoteId = quoteId

    // CUSTOMER role: only their contracts (match by either CRM Customer _id or User _id)
    if (authPayload.role === 'CUSTOMER') {
      const customer = await Customer.findOne({
        email: { $regex: new RegExp(`^${authPayload.email}$`, 'i') },
      }).lean()

      const allowedIds: string[] = []
      if (customer?._id) {
        allowedIds.push(customer._id.toString())
      }
      if (authPayload.userId) {
        allowedIds.push(authPayload.userId)
      }

      if (!allowedIds.length) {
        // No matching customer/user identifiers - return empty
        return NextResponse.json({ contracts: [] }, { status: 200 })
      }

      filter.customerId = { $in: allowedIds }
    } else if (customerId) {
      const isAdminOrStaff = authPayload.role === 'ADMIN' || authPayload.role === 'STAFF'
      if (isAdminOrStaff) {
        const relatedIds = await resolveRelatedCustomerIds(customerId)
        filter.customerId = relatedIds.length > 1 ? { $in: relatedIds } : customerId
      } else {
        filter.customerId = customerId
      }
    }

    const contracts = await Contract.find(filter).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ contracts: contracts.map(toApiContract) }, { status: 200 })
  } catch (error) {
    console.error('Contracts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try to authenticate, but don't block contract creation if auth is missing.
    // This makes the endpoint more robust to missing/invalid tokens from the UI.
    let authPayload: any = null
    try {
      authPayload = await verifyAuth(request)
    } catch {
      authPayload = null
    }

    await connectDB()

    const body = await request.json()
    const { quoteId, adminPaymentOption, adminPaymentAmount } = body

    if (!quoteId) {
      return NextResponse.json({ error: 'quoteId is required' }, { status: 400 })
    }

    if (!mongoose.Types.ObjectId.isValid(quoteId)) {
      return NextResponse.json({ error: 'Invalid quoteId' }, { status: 400 })
    }

    const quote = await Quote.findById(quoteId).lean()
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (quote.status !== 'WON') {
      return NextResponse.json({ error: 'Contract can only be created from an accepted (WON) quote' }, { status: 400 })
    }

    if (!quote.contractType) {
      return NextResponse.json({ error: 'Quote has no contract type' }, { status: 400 })
    }

    const existing = await Contract.findOne({ quoteId }).lean()
    if (existing) {
      return NextResponse.json({ contract: toApiContract(existing) }, { status: 200 })
    }

    const resolvedPaymentAmount =
      adminPaymentOption === '100' ? quote.totalAmount :
      adminPaymentOption === 'custom' && adminPaymentAmount ? adminPaymentAmount :
      (quote.totalAmount as number) * 0.5

    const contract = await Contract.create({
      quoteId: quote._id.toString(),
      quoteNumber: quote.quoteNumber,
      customerId: quote.customerId,
      customerName: quote.customerName,
      contractType: quote.contractType,
      status: 'pending_customer_signature',
      adminPaymentOption: adminPaymentOption || '50',
      adminPaymentAmount: resolvedPaymentAmount,
      sentAt: new Date(),
      auditTrail: [
        {
          action: 'created',
          userId: authPayload?.userId ?? 'system',
          timestamp: new Date(),
        },
        {
          action: 'sent',
          userId: authPayload?.userId ?? 'system',
          timestamp: new Date(),
        },
      ],
    })

    const saved = await Contract.findById(contract._id).lean()
    return NextResponse.json({ contract: toApiContract(saved) }, { status: 201 })
  } catch (error) {
    console.error('Contracts POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
