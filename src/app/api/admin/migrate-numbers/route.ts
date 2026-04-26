import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Invoice from '@/lib/models/Invoice'
import Quote from '@/lib/models/Quote'
import Contract from '@/lib/models/Contract'
import { verifyAuth } from '@/lib/auth'

// Converts e.g. "INV-2026-0003" → "INV-26-0003"
function shortenYear(num: string): string {
  return num.replace(/^([A-Z]+-)\d{2}(\d{2}-)/, '$1$2')
}

export async function POST(request: NextRequest) {
  const authPayload = await verifyAuth(request)
  if (!authPayload || !['ADMIN', 'SUPER_ADMIN'].includes(authPayload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  let invoicesMigrated = 0
  let quotesMigrated = 0
  let contractsMigrated = 0

  // Invoices: INV-20XX-XXXX → INV-XX-XXXX
  const invoices = await Invoice.find({ invoiceNumber: /^INV-\d{4}-\d{4}$/ }).lean()
  for (const doc of invoices) {
    const newNumber = shortenYear(doc.invoiceNumber)
    if (newNumber !== doc.invoiceNumber) {
      await Invoice.updateOne({ _id: doc._id }, { $set: { invoiceNumber: newNumber } })
      invoicesMigrated++
    }
  }

  // Quotes: QT-20XX-XXXX → QT-XX-XXXX
  const quotes = await Quote.find({ quoteNumber: /^QT-\d{4}-\d{4}$/ }).lean()
  for (const doc of quotes) {
    const newNumber = shortenYear(doc.quoteNumber)
    if (newNumber !== doc.quoteNumber) {
      await Quote.updateOne({ _id: doc._id }, { $set: { quoteNumber: newNumber } })
      quotesMigrated++
    }
  }

  // Contracts: CNT-20XX-XXXX → CNT-XX-XXXX
  const contracts = await Contract.find({ contractNumber: /^CNT-\d{4}-\d{4}$/ }).lean()
  for (const doc of contracts) {
    const newNumber = shortenYear(doc.contractNumber)
    if (newNumber !== doc.contractNumber) {
      await Contract.updateOne({ _id: doc._id }, { $set: { contractNumber: newNumber } })
      contractsMigrated++
    }
  }

  return NextResponse.json({
    message: 'Migration complete',
    invoicesMigrated,
    quotesMigrated,
    contractsMigrated,
  })
}
