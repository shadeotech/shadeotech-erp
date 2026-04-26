import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
    }
    stripeInstance = new Stripe(key, {
      apiVersion: '2026-02-25.clover',
    })
  }
  return stripeInstance
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop]
  },
})
