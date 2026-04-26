'use client'

import { formatCurrency } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

interface AverageDealValueWidgetProps {
  value: number
  ytdDeals?: number
}

export function AverageDealValueWidget({ value, ytdDeals }: AverageDealValueWidgetProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111] overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Average Deal Value</span>
      </div>

      <div className="flex flex-col items-center justify-center p-8 gap-3 h-[calc(100%-49px)]">
        <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
          {formatCurrency(value)}
        </p>
        {ytdDeals !== undefined && ytdDeals > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span>Based on {ytdDeals} deals this year</span>
          </div>
        )}
      </div>
    </div>
  )
}
