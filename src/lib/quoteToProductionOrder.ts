import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import ProductionOrder from '@/lib/models/ProductionOrder'
import FabricGallery from '@/lib/models/FabricGallery'
import type { Quote as QuoteType } from '@/lib/models/Quote'

type AnyQuote = QuoteType | (QuoteType & { _id?: any }) | any

function getQuoteId(quote: AnyQuote): string | null {
  if (!quote) return null
  if (quote._id && typeof quote._id.toString === 'function') {
    return quote._id.toString()
  }
  if (typeof quote.id === 'string') return quote.id
  return null
}

export async function createProductionOrderFromQuote(quote: AnyQuote, invoice?: any) {
  await connectDB()

  const quoteId = getQuoteId(quote)
  if (!quoteId) {
    return null
  }

  // Idempotency: if an order already exists for this quote, return it.
  // Never revert an order that has already been progressed past approval.
  const existing = await ProductionOrder.findOne({ quoteId }).lean()
  if (existing) {
    return existing
  }

  // Batch-resolve fabric names from FabricGallery so the pending-approval table
  // shows human-readable names instead of raw ObjectId strings.
  // Filter to valid ObjectIds only — legacy quotes may have plain strings like "5"
  const rawFabricIds = Array.from(
    new Set((quote.items || []).map((it: any) => it.fabricId).filter(Boolean)),
  )
  const fabricIds = rawFabricIds.filter((id: any) => mongoose.Types.ObjectId.isValid(id))
  const fabricDocs = fabricIds.length
    ? await FabricGallery.find({ _id: { $in: fabricIds } }).select('color subcategory collection').lean()
    : []
  const fabricMap: Record<string, any> = Object.fromEntries(
    fabricDocs.map((d: any) => [d._id.toString(), d]),
  )

  const items = (quote.items || []).map((item: any, index: number) => {
    const qty = item.quantity ?? 1
    const widthNum = item.width ?? 0
    const lengthNum = item.length ?? 0
    const fg = item.fabricId ? fabricMap[item.fabricId] : null

    return {
      lineNumber: index + 1,
      qty,
      area: item.roomType || '',
      mount: item.mountType || '',
      width: String(widthNum),
      length: String(lengthNum),
      product: (() => {
        const cat = (item.category || '').toLowerCase()
        if (cat.startsWith('exterior')) return 'Exterior'
        if (cat.includes('duo')) return 'Duo'
        if (cat.includes('roller')) return 'Roller'
        if (cat.includes('tri')) return 'Tri'
        if (cat.includes('uni')) return 'Uni'
        if (cat.includes('roman')) return 'Roman'
        return item.productName ? item.productName.split(' - ')[0].trim() : ''
      })(),
      collection: fg?.collection || item.collectionId || undefined,
      fabric: fg
        ? [fg.subcategory, fg.color].filter(Boolean).join(' – ')
        : (item.fabricId || ''),
      cassetteTypeColor: [item.cassetteType, item.cassetteColor].filter(Boolean).join(', ') || '',
      bottomRail: item.bottomRailType || '',
      sideChain: item.controlChain || '',
      operation: ['Motorized', 'Battery Powered', 'AC 12V/24V', 'AC 110 V', 'Wand Motor', 'AC 110V Motor', 'Battery powered motor', 'MOTORIZED'].includes(item.controlType || '')
          ? 'MOTORIZED'
          : 'MANUAL',
      sequence: item.sequence || undefined,
      roomType: item.roomType || undefined,
      controlType: item.controlType || undefined,
      chainCord: item.controlChain || undefined,
      controlColor: item.controlChainColor || undefined,
      controlSide: item.controlChainSide || undefined,
      cassetteColor: item.cassetteColor || undefined,
      cassetteWrapped: item.fabricWrap === 'same' || item.fabricWrap === 'other',
      bottomRailType: item.bottomRailType || undefined,
      bottomRailColor: item.bottomRailColor || undefined,
      options: undefined,
    }
  })

  const totalShades = items.reduce((sum: number, it: any) => sum + (it.qty || 1), 0)
  const products = Array.from(
    new Set(items.map((it: any) => it.product).filter(Boolean)),
  )

  const imageUrls = Array.from(
    new Set(
      [
        quote.visuals?.fabricImage,
        quote.visuals?.cassetteImage,
        quote.visuals?.componentImage,
        ...(quote.items || []).flatMap((it: any) => [
          it.fabricImage,
          it.cassetteImage,
          it.componentImage,
          it.sequenceImage,
          it.fabricWrapImage,
        ]),
      ].filter((u): u is string => typeof u === 'string' && u.length > 0),
    ),
  )

  // Generate order number by finding the highest existing number and incrementing.
  // countDocuments() is unsafe — deletions break the sequence and cause unique-key
  // collisions that are swallowed silently, preventing orders from being created.
  let orderNumber: string
  {
    const last = await ProductionOrder.findOne({}, { orderNumber: 1 })
      .sort({ createdAt: -1 })
      .lean()
    let next = 1
    if (last && (last as any).orderNumber) {
      const m = String((last as any).orderNumber).match(/(\d+)$/)
      if (m) next = parseInt(m[1], 10) + 1
    }
    // Scan forward in case the latest-created record isn't the highest number
    while (await ProductionOrder.findOne({ orderNumber: `ORD-${String(next).padStart(3, '0')}` }).select('_id').lean()) {
      next++
    }
    orderNumber = `ORD-${String(next).padStart(3, '0')}`
  }

  const orderDoc = await ProductionOrder.create({
    orderNumber,
    quoteId,
    invoiceId:
      invoice && invoice._id && typeof invoice._id.toString === 'function'
        ? invoice._id.toString()
        : undefined,
    customerId: quote.customerId,
    customerName: quote.customerName,
    sideMark: quote.sideMark || undefined,
    orderDate: new Date(),
    status: 'PENDING_APPROVAL',
    items,
    totalShades,
    products,
    notes: quote.notes || undefined,
    images: imageUrls.length > 0 ? imageUrls : undefined,
  })

  return orderDoc.toObject()
}

