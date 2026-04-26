'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder'

function NewOrderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customerId') || undefined

  const handleComplete = (quoteId: string) => {
    router.push('/dealer/orders')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Place New Order</h2>
        <p className="text-sm text-muted-foreground">
          Build your order details below
        </p>
      </div>

      <QuoteBuilder customerId={customerId} dealerMode={true} onComplete={handleComplete} />
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Place New Order</h2>
          <p className="text-sm text-muted-foreground">
            Build your order details below
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <NewOrderContent />
    </Suspense>
  )
}
