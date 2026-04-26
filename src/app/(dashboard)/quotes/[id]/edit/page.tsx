'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder'
import { useQuotesStore, type Quote } from '@/stores/quotesStore'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'

export default function EditQuotePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { token } = useAuthStore()
  const { quotes, fetchQuotes } = useQuotesStore()
  const [loading, setLoading] = useState(true)
  const quote = quotes.find((q) => q.id === params.id) ?? null

  useEffect(() => {
    if (quote) {
      setLoading(false)
      return
    }
    if (!token) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchQuotes(token).then(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [params.id, token, fetchQuotes, quote])

  const handleComplete = (quoteId: string) => {
    router.push(`/quotes/${quoteId}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Edit Estimate</h2>
          <p className="text-sm text-muted-foreground">Loading estimate…</p>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Edit Estimate</h2>
          <p className="text-sm text-muted-foreground">Estimate not found.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/quotes')}
          className="text-sm text-primary hover:underline"
        >
          Back to estimates
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Edit Estimate</h2>
        <p className="text-sm text-muted-foreground">
          Update estimate {quote.quoteNumber} for {quote.customerName}
        </p>
      </div>
      <QuoteBuilder
        customerId={quote.customerId}
        initialQuote={quote}
        quoteId={quote.id}
        onComplete={handleComplete}
      />
    </div>
  )
}
