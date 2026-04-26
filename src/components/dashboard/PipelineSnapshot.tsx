'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PipelineStage {
  name: string
  count: number
  value: number
  color: string
}

// Mock pipeline data
const pipelineStages: PipelineStage[] = [
  { name: 'Sent', count: 12, value: 45000, color: 'bg-stone-500' },
  { name: 'Negotiating', count: 8, value: 32000, color: 'bg-amber-500' },
  { name: 'Postponed', count: 5, value: 18000, color: 'bg-neutral-400' },
  { name: 'Confirmed', count: 15, value: 85000, color: 'bg-emerald-500' },
  { name: 'Archived', count: 3, value: 12000, color: 'bg-gray-400' },
]

export function PipelineSnapshot() {
  const totalQuotes = pipelineStages.reduce((sum, stage) => sum + stage.count, 0)
  const totalValue = pipelineStages.reduce((sum, stage) => sum + stage.value, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Deals Pipeline</CardTitle>
        <Link href="/quotes/pipeline">
          <Button variant="ghost" size="sm" className="gap-1">
            View All
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{totalQuotes} quotes</span>
          <span className="font-medium">${totalValue.toLocaleString()}</span>
        </div>

        <div className="space-y-4">
          {pipelineStages.map((stage) => {
            const percentage = (stage.count / totalQuotes) * 100
            return (
              <div key={stage.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                    <span>{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{stage.count}</span>
                    <span className="w-20 text-right">
                      ${stage.value.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Progress value={percentage} className="h-1.5" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

