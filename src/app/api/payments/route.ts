import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Payment from '@/lib/models/Payment'
import Invoice from '@/lib/models/Invoice'
import Customer from '@/lib/models/Customer'
import Quote from '@/lib/models/Quote'
import { verifyAuth } from '@/lib/auth'
import { createProductionOrderFromQuote } from '@/lib/quoteToProductionOrder'

const METHOD_UI_TO_DB: Record<string, string> = {
  'Credit Card': 'CREDIT_CARD',
  ACH: 'ACH',
  Check: 'CHECK',
  Zelle: 'ZELLE',
  Financing: 'FINANCING',
  Cash: 'CASH',
}

const METHOD_DB_TO_UI: Record<string, string> = {
  CREDIT_CARD: 'Credit Card',
  ACH: 'ACH',
  CHECK: 'Check',
  ZELLE: 'Zelle',
  FINANCING: 'Financing',
  CASH: 'Cash',
  OTHER: 'Other',
}

function toApiPayment(doc: any, invoice?: any) {
  const amount = doc.amount ?? 0
  const invoiceTotal = invoice?.totalAmount ?? 0
  const isPartial = invoiceTotal > 0 && amount > 0 && amount < invoiceTotal
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    paymentNumber: doc.paymentNumber,
    invoiceId: doc.invoiceId,
    invoiceNumber: doc.invoiceNumber,
    customerId: doc.customerId,
    customerName: doc.customerName,
    sideMark: doc.sideMark ?? '',
    amount,
    date: doc.transactionDate ? new Date(doc.transactionDate).toISOString().split('T')[0] : undefined,
    method: METHOD_DB_TO_UI[doc.paymentMethod] || doc.paymentMethod,
    invoiceTotal: invoiceTotal || undefined,
    isPartial: !!isPartial,
  }
}

export async function GET(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')
    const period = searchParams.get('period')

    const filter: Record<string, unknown> = {}
    if (invoiceId) filter.invoiceId = invoiceId

    if (period) {
      const now = new Date()
      let start: Date
      if (period === 'day') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (period === 'week') {
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        start = new Date(now.getFullYear(), now.getMonth(), diff)
      } else if (period === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1)
      } else if (period === 'fiscal_year') {
        start = new Date(now.getFullYear(), 0, 1)
      } else {
        start = new Date(0)
      }
      filter.transactionDate = { $gte: start, $lte: now }
    }

    // CUSTOMER role: only their payments (match by User _id or CRM Customer _id)
    if (authPayload.role === 'CUSTOMER') {
      const customer = await Customer.findOne({ email: { $regex: new RegExp(`^${authPayload.email}$`, 'i') } }).lean()
      const allowedIds: string[] = []
      if (authPayload.userId) allowedIds.push(authPayload.userId)
      if (customer?._id) allowedIds.push(customer._id.toString())
      if (allowedIds.length === 0) {
        return NextResponse.json({ payments: [], stats: { paidCount: 0, partiallyPaidCount: 0 } }, { status: 200 })
      }
      filter.customerId = { $in: allowedIds }
    }

    const payments = await Payment.find(filter)
      .sort({ transactionDate: -1, createdAt: -1 })
      .lean()

    const invoiceIds = Array.from(new Set(payments.map((p: any) => p.invoiceId).filter(Boolean)))
    const invoiceObjectIds = invoiceIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id))
    const invoices = invoiceObjectIds.length > 0
      ? await Invoice.find({ _id: { $in: invoiceObjectIds } }).lean()
      : []
    const invoiceMap = Object.fromEntries(invoices.map((inv: any) => [inv._id.toString(), inv]))

    const paymentsWithMeta = payments.map((p: any) =>
      toApiPayment(p, p.invoiceId ? invoiceMap[p.invoiceId] : undefined)
    )

    let paidCount = 0
    let partiallyPaidCount = 0
    const invoiceFilter: Record<string, unknown> = {}
    if (authPayload.role === 'CUSTOMER') {
      const customer = await Customer.findOne({ email: { $regex: new RegExp(`^${authPayload.email}$`, 'i') } }).lean()
      const allowedIds: string[] = []
      if (authPayload.userId) allowedIds.push(authPayload.userId)
      if (customer?._id) allowedIds.push(customer._id.toString())
      if (allowedIds.length > 0) invoiceFilter.customerId = { $in: allowedIds }
    }
    const allInvoices = await Invoice.find(invoiceFilter).lean()
    for (const inv of allInvoices) {
      const total = inv.totalAmount ?? 0
      const paid = inv.paidAmount ?? 0
      if (total <= 0) continue
      if (paid >= total) paidCount++
      else if (paid > 0) partiallyPaidCount++
    }

    return NextResponse.json({
      payments: paymentsWithMeta,
      stats: { paidCount, partiallyPaidCount },
    }, { status: 200 })
  } catch (error) {
    console.error('Payments GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { invoiceId, amount, method, date, notes } = body

    if (!invoiceId || amount == null || amount <= 0) {
      return NextResponse.json(
        { error: 'invoiceId and positive amount are required' },
        { status: 400 }
      )
    }

    const invoice = await Invoice.findById(invoiceId).lean()
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const paymentMethod = METHOD_UI_TO_DB[method] || method || 'OTHER'

    const doc = await Payment.create({
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      sideMark: invoice.sideMark,
      amount: Number(amount),
      paymentMethod,
      paymentStatus: 'COMPLETED',
      transactionDate: date ? new Date(date) : new Date(),
      notes: notes?.trim() || undefined,
      recordedById: authPayload.userId,
    })

    // Update invoice paid amount and balance
    const newPaidAmount = (invoice.paidAmount ?? 0) + Number(amount)
    const newBalance = Math.max(0, (invoice.totalAmount ?? 0) - newPaidAmount)
    let newStatus = invoice.status
    if (newPaidAmount >= (invoice.totalAmount ?? 0)) newStatus = 'PAID'
    else if (newPaidAmount > 0) newStatus = 'PARTIALLY_PAID'

    await Invoice.findByIdAndUpdate(invoiceId, {
      paidAmount: newPaidAmount,
      balanceAmount: newBalance,
      status: newStatus,
    })

    // If any payment has been recorded against a quote-linked invoice,
    // ensure the related quote is marked as WON and converted into a production order.
    if (newPaidAmount > 0 && invoice.quoteId) {
      try {
        const [fullInvoice, quote] = await Promise.all([
          Invoice.findById(invoiceId).lean(),
          Quote.findById(invoice.quoteId),
        ])

        if (quote) {
          if (quote.status !== 'WON') {
            quote.status = 'WON'
            await quote.save()
          }

          await createProductionOrderFromQuote(quote.toObject(), fullInvoice)
        }
      } catch (err) {
        console.error('[payments] Failed to create production order for quote', invoice.quoteId, ':', err)
      }
    }

    return NextResponse.json({ payment: toApiPayment(doc) }, { status: 201 })
  } catch (error) {
    console.error('Payments POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
