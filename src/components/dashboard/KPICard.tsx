'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  href?: string
  bgColor?: string
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  href,
  bgColor = '#E6F1FD'
}: KPICardProps) {
  const content = (
    <div
      className="rounded-xl p-5 transition-all hover:shadow-sm"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm text-gray-600 dark:text-gray-700">{title}</span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-semibold text-gray-900 dark:text-gray-800">{value}</span>
        {change !== undefined && (
          <span className={cn(
            'text-xs',
            change >= 0 ? 'text-green-500' : 'text-red-500'
          )}>
            {change >= 0 ? '+' : ''}{change}% ↗
          </span>
        )}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
