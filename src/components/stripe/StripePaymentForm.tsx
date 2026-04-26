'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

// Load Stripe outside of component to avoid re-loading on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ── Inner form (needs to be inside <Elements>) ────────────────────────────────
function CheckoutForm({
  amount,
  token,
  onSuccess,
  onCancel,
}: {
  amount: number
  token: string | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setErrorMessage(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?payment=success`,
      },
      redirect: 'if_required', // Only redirect if required (e.g., 3DS)
    })

    if (error) {
      setErrorMessage(error.message ?? 'Payment failed. Please try again.')
      setIsProcessing(false)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setSucceeded(true)
      setIsProcessing(false)
      // Record payment, update invoice, and create production order
      if (paymentIntent.id && token) {
        try {
          const res = await fetch('/api/payments/confirm-stripe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
          })
          if (!res.ok) {
            console.error('[StripePaymentForm] confirm-stripe failed:', res.status)
          }
        } catch (err) {
          console.error('[StripePaymentForm] confirm-stripe network error:', err)
        }
      }
      setTimeout(() => onSuccess(), 1500)
    }
  }

  if (succeeded) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <p className="text-base font-semibold text-slate-800 dark:text-slate-100">Payment Successful!</p>
        <p className="text-sm text-muted-foreground">
          ${amount.toFixed(2)} has been processed.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2.5 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing}>
          {isProcessing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  )
}

// ── Public component ──────────────────────────────────────────────────────────
interface StripePaymentFormProps {
  amount: number          // dollars (e.g. 1250.00)
  invoiceId?: string      // invoice ID or number for metadata
  invoiceNumber?: string  // display only
  customerName?: string
  onSuccess: () => void
  onCancel: () => void
}

export function StripePaymentForm({
  amount,
  invoiceId,
  invoiceNumber,
  customerName,
  onSuccess,
  onCancel,
}: StripePaymentFormProps) {
  const { token } = useAuthStore()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!amount || amount <= 0) return

    const createIntent = async () => {
      try {
        const res = await fetch('/api/stripe/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount,
            invoiceId,
            customerName,
            description: invoiceNumber
              ? `Payment for Invoice ${invoiceNumber}`
              : 'Invoice payment',
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          setLoadError(data.error ?? 'Failed to initialize payment')
          return
        }
        setClientSecret(data.clientSecret)
      } catch {
        setLoadError('Network error. Please try again.')
      }
    }

    createIntent()
  }, [amount, invoiceId, invoiceNumber, customerName, token])

  if (loadError) {
    return (
      <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-3 text-sm text-red-700 dark:text-red-400">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{loadError}</span>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-10 gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Initializing secure payment…</span>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#3b82f6',
            borderRadius: '6px',
          },
        },
      }}
    >
      <CheckoutForm amount={amount} token={token} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  )
}
