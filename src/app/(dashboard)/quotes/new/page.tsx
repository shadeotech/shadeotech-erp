'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder'

function NewQuoteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customerId') || undefined
  const fromQuickQuote = searchParams.get('fromQuickQuote') || undefined

  const handleComplete = (quoteId: string) => {
    router.push(`/quotes/${quoteId}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Create New Estimate</h2>
        <p className="text-sm text-muted-foreground">
          Build an estimate for your customer
        </p>
      </div>

      <QuoteBuilder customerId={customerId} fromQuickQuoteId={fromQuickQuote} onComplete={handleComplete} />
    </div>
  )
}

export default function NewQuotePage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Create New Estimate</h2>
          <p className="text-sm text-muted-foreground">
            Build an estimate for your customer
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <NewQuoteContent />
    </Suspense>
  )
}

