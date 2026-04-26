import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { connectDB } from '@/lib/mongodb'
import Invoice from '@/lib/models/Invoice'
import Payment from '@/lib/models/Payment'
import Quote from '@/lib/models/Quote'
import { verifyAuth } from '@/lib/auth'
import { createProductionOrderFromQuote } from '@/lib/quoteToProductionOrder'

/**
 * Called by the client after Stripe confirmPayment succeeds.
 * Verifies the PaymentIntent with Stripe, then updates the invoice and creates a Payment record.
 * Idempotent: if a Payment with this stripePaymentIntentId already exists, no-op.
 * This ensures invoice status updates even when the webhook is not received (e.g. local dev).
 */
export async function POST(request: NextRequest) {
  const authPayload = await verifyAuth(request)
  if (!authPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { paymentIntentId } = body
    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      return NextResponse.json({ error: 'paymentIntentId is required' }, { status: 400 })
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment has not succeeded yet' },
        { status: 400 }
      )
    }

    await connectDB()

    const existing = await Payment.findOne({ stripePaymentIntentId: paymentIntentId }).lean()
    if (existing) {
      // Payment exists (e.g. webhook fired first), but ensure ProductionOrder was also created
      const { invoiceId: existingInvoiceId } = paymentIntent.metadata ?? {}
      if (existingInvoiceId) {
        try {
          const inv = await Invoice.findOne({
            $or: [{ _id: existingInvoiceId }, { invoiceNumber: existingInvoiceId }],
          }).lean()
          if (inv && (inv as any).quoteId) {
            const quote = await Quote.findById((inv as any).quoteId)
            if (quote) {
              if (quote.status !== 'WON') { quote.status = 'WON'; await quote.save() }
              await createProductionOrderFromQuote(quote.toObject(), inv)
            }
          }
        } catch (err) {
          console.error('[payments/confirm-stripe] Backfill production order on existing payment:', err)
        }
      }
      return NextResponse.json({ ok: true, alreadyRecorded: true }, { status: 200 })
    }

    const { invoiceId, customerName } = paymentIntent.metadata ?? {}
    const amountPaid = (paymentIntent.amount_received ?? 0) / 100

    let invoice: any = null
    if (invoiceId) {
      invoice = await Invoice.findOne({
        $or: [{ _id: invoiceId }, { invoiceNumber: invoiceId }],
      })

      if (invoice) {
        invoice.paidAmount = (invoice.paidAmount ?? 0) + amountPaid
        invoice.balanceAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount)
        invoice.status =
          invoice.balanceAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID'
        await invoice.save()
      }
    }

    await Payment.create({
      invoiceId: invoiceId || undefined,
      invoiceNumber: invoice?.invoiceNumber,
      customerId: invoice?.customerId,
      customerName: customerName || invoice?.customerName || 'Unknown',
      amount: amountPaid,
      paymentMethod: 'CREDIT_CARD',
      paymentStatus: 'COMPLETED',
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: paymentIntent.latest_charge ?? undefined,
      transactionDate: new Date(),
    })

    // Mark linked quote as WON and create a production order (idempotent)
    if (invoice?.quoteId) {
      try {
        const quote = await Quote.findById(invoice.quoteId)
        if (quote) {
          if (quote.status !== 'WON') {
            quote.status = 'WON'
            await quote.save()
          }
          await createProductionOrderFromQuote(quote.toObject(), invoice)
        }
      } catch (err) {
        console.error('[payments/confirm-stripe] Failed to create production order:', err)
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err: any) {
    console.error('[payments/confirm-stripe]', err)
    return NextResponse.json(
      { error: err.message ?? 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
