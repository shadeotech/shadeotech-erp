import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Quote from '@/lib/models/Quote'
import Invoice from '@/lib/models/Invoice'
import { verifyAuth } from '@/lib/auth'
import { createProductionOrderFromQuote } from '@/lib/quoteToProductionOrder'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!['ADMIN', 'SUPER_ADMIN', 'STAFF', 'MANAGER'].includes(authPayload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const quote = await Quote.findById(params.id)
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Mark quote as WON if it isn't already
    if (quote.status !== 'WON') {
      quote.status = 'WON'
      await quote.save()
    }

    // Find the linked invoice (if any)
    const invoice = await Invoice.findOne({ quoteId: params.id }).lean()

    const order = await createProductionOrderFromQuote(quote.toObject(), invoice || undefined)
    if (!order) {
      return NextResponse.json({ error: 'Failed to create production order' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      orderId: (order as any)._id?.toString(),
      orderNumber: (order as any).orderNumber,
      alreadyExisted: false,
    })
  } catch (error: any) {
    console.error('[send-to-production]', error)
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
