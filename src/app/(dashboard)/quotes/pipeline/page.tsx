import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QuotePipeline } from '@/components/quotes/QuotePipeline'
import { List } from 'lucide-react'

export default function QuotePipelinePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Deals</h2>
          <p className="text-sm text-muted-foreground">
            Track quotes from sent to confirmed
          </p>
        </div>
        <Link href="/quotes">
          <Button variant="outline" size="sm">
            <List className="mr-2 h-4 w-4" />
            List View
          </Button>
        </Link>
      </div>

      {/* Pipeline with built-in toolbar */}
      <QuotePipeline />
    </div>
  )
}

