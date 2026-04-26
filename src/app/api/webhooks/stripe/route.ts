import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { connectDB } from '@/lib/mongodb'
import Invoice from '@/lib/models/Invoice'
import Payment from '@/lib/models/Payment'
import Quote from '@/lib/models/Quote'
import { createProductionOrderFromQuote } from '@/lib/quoteToProductionOrder'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  // If no webhook secret is configured, skip signature verification (dev mode)
  let event
  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err: any) {
      console.error('[stripe/webhook] Signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  } else {
    // Dev mode: parse without verification
    try {
      event = JSON.parse(body)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any
    const { invoiceId, customerName } = paymentIntent.metadata ?? {}
    const amountPaid = paymentIntent.amount_received / 100 // cents → dollars

    try {
      await connectDB()

      const existingPayment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id }).lean()
      if (existingPayment) {
        return NextResponse.json({ received: true })
      }

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

      // Record the payment in MongoDB (include customerId for CUSTOMER portal filtering)
      const payment = new Payment({
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
      await payment.save()

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
        } catch (orderErr) {
          console.error('[stripe/webhook] Failed to create production order:', orderErr)
        }
      }
    } catch (err) {
      console.error('[stripe/webhook] DB error:', err)
      // Return 200 anyway — Stripe will retry if we return non-2xx
    }
  }

  return NextResponse.json({ received: true })
}
