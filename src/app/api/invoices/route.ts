import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Invoice from '@/lib/models/Invoice'
import Customer from '@/lib/models/Customer'
import User from '@/lib/models/User'
import Quote from '@/lib/models/Quote'
import { verifyAuth } from '@/lib/auth'

function toApiInvoice(doc: any) {
  const status = doc.status
  const paidAmount = doc.paidAmount ?? 0
  const totalAmount = doc.totalAmount ?? 0
  const balanceAmount = doc.balanceAmount ?? totalAmount - paidAmount

  // Map DB status to UI status
  let uiStatus: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Draft' = 'Unpaid'
  if (status === 'DRAFT') uiStatus = 'Draft'
  else if (status === 'PAID' || (totalAmount > 0 && paidAmount >= totalAmount)) uiStatus = 'Paid'
  else if (status === 'OVERDUE') uiStatus = 'Overdue'
  else if (paidAmount > 0) uiStatus = 'Partially Paid'
  else if (balanceAmount > 0 && doc.dueDate && new Date(doc.dueDate) < new Date()) uiStatus = 'Overdue'

  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    invoiceNumber: doc.invoiceNumber,
    quoteId: doc.quoteId,
    orderId: doc.orderId,
    orderNumber: doc.orderNumber,
    customerId: doc.customerId,
    customerName: doc.customerName,
    dealerId: doc.dealerId,
    dealerName: doc.dealerName,
    sideMark: doc.sideMark,
    invoicePhase: doc.invoicePhase ?? undefined,
    sentAt: doc.sentAt ? new Date(doc.sentAt).toISOString() : undefined,
    status: uiStatus,
    statusDb: doc.status,
    items: doc.items || [],
    subtotal: doc.subtotal ?? 0,
    taxRate: doc.taxRate ?? 0,
    taxAmount: doc.taxAmount ?? 0,
    totalAmount,
    paidAmount,
    dueAmount: balanceAmount,
    dueDate: doc.dueDate ? new Date(doc.dueDate).toISOString().split('T')[0] : undefined,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : undefined,
    notes: doc.notes,
    billToStreet: doc.billToStreet,
    billToCity: doc.billToCity,
    billToState: doc.billToState,
    billToPostcode: doc.billToPostcode,
    billToCountry: doc.billToCountry,
    shipToStreet: doc.shipToStreet,
    shipToCity: doc.shipToCity,
    shipToState: doc.shipToState,
    shipToPostcode: doc.shipToPostcode,
    shipToCountry: doc.shipToCountry,
  }
}

async function resolveRelatedCustomerIds(seedCustomerId: string): Promise<string[]> {
  const ids = new Set<string>([seedCustomerId])

  if (!seedCustomerId) return Array.from(ids)
  if (!/^[a-f\d]{24}$/i.test(seedCustomerId)) return Array.from(ids)

  const baseCustomer = await Customer.findById(seedCustomerId).select('email').lean()
  const email = baseCustomer?.email?.trim()
  if (!email) return Array.from(ids)

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

export async function GET(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const filterCustomerId = searchParams.get('customerId')

    const filter: Record<string, unknown> = {}

    // Admin/Staff: allow filtering by customerId
    if (filterCustomerId && (authPayload.role === 'ADMIN' || authPayload.role === 'STAFF')) {
      const relatedIds = await resolveRelatedCustomerIds(filterCustomerId)
      filter.customerId = relatedIds.length > 1 ? { $in: relatedIds } : filterCustomerId
    }
    if (status && status !== 'all') {
      const statusMap: Record<string, string> = {
        Unpaid: 'SENT',
        'Partially Paid': 'PARTIALLY_PAID',
        Paid: 'PAID',
        Overdue: 'OVERDUE',
      }
      if (statusMap[status]) filter.status = statusMap[status]
    }

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { sideMark: { $regex: search, $options: 'i' } },
      ]
    }

    // CUSTOMER role: only their invoices (match by User _id or CRM Customer _id — quotes/contracts use either)
    if (authPayload.role === 'CUSTOMER') {
      const customer = await Customer.findOne({ email: { $regex: new RegExp(`^${authPayload.email}$`, 'i') } }).lean()
      const allowedIds: string[] = []
      if (authPayload.userId) allowedIds.push(authPayload.userId)
      if (customer?._id) allowedIds.push(customer._id.toString())
      if (allowedIds.length === 0) {
        return NextResponse.json({ invoices: [] }, { status: 200 })
      }
      filter.customerId = { $in: allowedIds }
    }

    // DEALER role: only invoices sent to them (dealerId = their userId, must have been sent)
    if (authPayload.role === 'DEALER') {
      filter.dealerId = authPayload.userId
      filter.sentAt = { $exists: true, $ne: null }
    }

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).lean()

    return NextResponse.json({ invoices: invoices.map(toApiInvoice) }, { status: 200 })
  } catch (error) {
    console.error('Invoices GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Only admins / staff can create invoices
    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF', 'MANAGER'].includes(authPayload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const {
      customerId,
      customerName,
      sideMark,
      items = [],
      taxRate = 0,
      dueDate,
      notes,
      status = 'SENT',
      billToStreet,
      billToCity,
      billToState,
      billToPostcode,
      billToCountry,
      shipToStreet,
      shipToCity,
      shipToState,
      shipToPostcode,
      shipToCountry,
      // Optional: when creating an invoice that originates from a quote,
      // the caller can pass quoteId so downstream flows (payments/order conversion)
      // can link back to the originating quote.
      quoteId,
    } = body

    if (!customerName) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 })
    }
    if (quoteId) {
      const existingQuoteInvoice = await Invoice.findOne({ quoteId }).lean()
      if (existingQuoteInvoice) {
        return NextResponse.json(
          { error: 'An invoice already exists for this quote', invoiceId: existingQuoteInvoice._id.toString() },
          { status: 409 }
        )
      }
    }

    // Compute totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.totalPrice ?? 0), 0)
    const taxAmount = parseFloat(((subtotal * taxRate) / 100).toFixed(2))
    const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2))

    let resolvedBillToStreet = billToStreet
    let resolvedBillToCity = billToCity
    let resolvedBillToState = billToState
    let resolvedBillToPostcode = billToPostcode
    let resolvedBillToCountry = billToCountry
    let resolvedShipToStreet = shipToStreet
    let resolvedShipToCity = shipToCity
    let resolvedShipToState = shipToState
    let resolvedShipToPostcode = shipToPostcode
    let resolvedShipToCountry = shipToCountry

    if ((!resolvedBillToStreet || !resolvedBillToCity || !resolvedBillToCountry) && customerId) {
      const customer = await Customer.findById(customerId).lean()
      if (customer) {
        resolvedBillToStreet = resolvedBillToStreet || customer.street || customer.address || ''
        resolvedBillToCity = resolvedBillToCity || customer.city || ''
        resolvedBillToState = resolvedBillToState || customer.town || ''
        resolvedBillToPostcode = resolvedBillToPostcode || customer.postcode || ''
        resolvedBillToCountry = resolvedBillToCountry || customer.country || ''
      }
    }

    if ((!resolvedShipToStreet || !resolvedShipToCity || !resolvedShipToCountry) && quoteId) {
      const quote = await Quote.findById(quoteId).lean()
      if (quote) {
        resolvedShipToStreet = resolvedShipToStreet || quote.shipToStreet || ''
        resolvedShipToCity = resolvedShipToCity || quote.shipToCity || ''
        resolvedShipToState = resolvedShipToState || quote.shipToState || ''
        resolvedShipToPostcode = resolvedShipToPostcode || quote.shipToPostcode || ''
        resolvedShipToCountry = resolvedShipToCountry || quote.shipToCountry || ''
      }
    }

    const invoice = new Invoice({
      customerId: customerId || undefined,
      customerName,
      sideMark: sideMark || undefined,
      quoteId: quoteId || undefined,
      items: items.map((item: any) => ({
        productName: item.productName,
        category: item.category || undefined,
        subcategory: item.subcategory || undefined,
        description: item.description || undefined,
        width: item.width || undefined,
        length: item.length || undefined,
        quantity: item.quantity ?? 1,
        unitPrice: item.unitPrice ?? 0,
        totalPrice: item.totalPrice ?? 0,
      })),
      subtotal,
      taxRate: taxRate ?? 0,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes: notes || undefined,
      status,
      billToStreet: resolvedBillToStreet || undefined,
      billToCity: resolvedBillToCity || undefined,
      billToState: resolvedBillToState || undefined,
      billToPostcode: resolvedBillToPostcode || undefined,
      billToCountry: resolvedBillToCountry || undefined,
      shipToStreet: resolvedShipToStreet || undefined,
      shipToCity: resolvedShipToCity || undefined,
      shipToState: resolvedShipToState || undefined,
      shipToPostcode: resolvedShipToPostcode || undefined,
      shipToCountry: resolvedShipToCountry || undefined,
    })

    await invoice.save()

    return NextResponse.json({ invoice: toApiInvoice(invoice) }, { status: 201 })
  } catch (error) {
    console.error('Invoices POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
