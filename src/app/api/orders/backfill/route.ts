import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Invoice from '@/lib/models/Invoice'
import Quote from '@/lib/models/Quote'
import ProductionOrder from '@/lib/models/ProductionOrder'
import { verifyAuth } from '@/lib/auth'
import { createProductionOrderFromQuote } from '@/lib/quoteToProductionOrder'

export async function POST(request: NextRequest) {
  const authPayload = await verifyAuth(request)
  if (!authPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const adminUser = await User.findById(authPayload.userId).select('role').lean()
  if (!adminUser || (adminUser as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden – admin only' }, { status: 403 })
  }

  let created = 0
  let skipped = 0
  const errors: { invoiceId: string; message: string }[] = []

  try {
    const paidInvoices = await Invoice.find({
      quoteId: { $exists: true, $ne: null },
      paidAmount: { $gt: 0 },
    }).lean()

    for (const inv of paidInvoices) {
      const invoiceId = (inv as any)._id?.toString() || 'unknown'
      try {
        const quoteId = (inv as any).quoteId
        const existing = await ProductionOrder.findOne({ quoteId }).select('_id').lean()
        if (existing) {
          skipped++
          continue
        }
        const quote = await Quote.findById(quoteId)
        if (!quote) {
          skipped++
          continue
        }
        if (quote.status !== 'WON') {
          quote.status = 'WON'
          await quote.save()
        }
        const order = await createProductionOrderFromQuote(quote.toObject(), inv)
        if (order) created++
        else skipped++
      } catch (err: any) {
        errors.push({ invoiceId, message: err?.message || 'Unknown error' })
      }
    }

    return NextResponse.json({ created, skipped, errors }, { status: 200 })
  } catch (err: any) {
    console.error('[orders/backfill] failed:', err)
    return NextResponse.json(
      { error: err?.message || 'Backfill failed' },
      { status: 500 },
    )
  }
}
