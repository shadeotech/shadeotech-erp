import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { amount, invoiceId, description, customerName } = body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const amountInCents = Math.round(amount * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      description: description ?? `Payment for ${invoiceId ?? 'invoice'}`,
      metadata: {
        invoiceId: invoiceId ?? '',
        customerName: customerName ?? '',
        userId: auth.userId,
      },
      payment_method_types: ['card'],
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err: any) {
    console.error('[stripe/create-intent]', err)
    return NextResponse.json({ error: err.message ?? 'Failed to create payment intent' }, { status: 500 })
  }
}
