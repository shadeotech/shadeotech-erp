'use client'

import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { useQuotesStore, QuoteStatus } from '@/stores/quotesStore'
import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { MoreHorizontal, ArrowRight, Loader2, Package, Search, SlidersHorizontal, ArrowUpDown, Plus, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

// Stage config — WON/LOST renamed to Confirmed/Archived
const STAGES: {
  status: QuoteStatus
  label: string
  headerBg: string
  dotColor: string
  countBg: string
}[] = [
  {
    status: 'SENT',
    label: 'Sent',
    headerBg: 'bg-stone-700',
    dotColor: 'bg-stone-400',
    countBg: 'bg-stone-600',
  },
  {
    status: 'NEGOTIATION',
    label: 'Negotiating',
    headerBg: 'bg-amber-600',
    dotColor: 'bg-amber-300',
    countBg: 'bg-amber-500',
  },
  {
    status: 'POSTPONED',
    label: 'Postponed',
    headerBg: 'bg-neutral-500',
    dotColor: 'bg-neutral-300',
    countBg: 'bg-neutral-400',
  },
  {
    status: 'WON',
    label: 'Confirmed',
    headerBg: 'bg-emerald-600',
    dotColor: 'bg-emerald-300',
    countBg: 'bg-emerald-500',
  },
  {
    status: 'LOST',
    label: 'Archived',
    headerBg: 'bg-gray-500',
    dotColor: 'bg-gray-300',
    countBg: 'bg-gray-400',
  },
]

const ALL_STAGE_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  NEGOTIATION: 'Negotiating',
  POSTPONED: 'Postponed',
  WON: 'Confirmed',
  LOST: 'Archived',
  EXPIRED: 'Expired',
}

type SortKey = 'date_desc' | 'date_asc' | 'value_desc' | 'value_asc'

export function QuotePipeline() {
  const { quotes, updateStatus } = useQuotesStore()
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<QuoteStatus | 'ALL'>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('date_desc')

  const filteredQuotes = useMemo(() => {
    let qs = quotes
    if (search.trim()) {
      const q = search.toLowerCase()
      qs = qs.filter(
        (x) =>
          x.customerName?.toLowerCase().includes(q) ||
          x.quoteNumber?.toLowerCase().includes(q) ||
          x.sideMark?.toLowerCase().includes(q)
      )
    }
    return qs
  }, [quotes, search])

  const sortedQuotes = useMemo(() => {
    return [...filteredQuotes].sort((a, b) => {
      if (sortKey === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortKey === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortKey === 'value_desc') return b.totalAmount - a.totalAmount
      if (sortKey === 'value_asc') return a.totalAmount - b.totalAmount
      return 0
    })
  }, [filteredQuotes, sortKey])

  const SORT_LABELS: Record<SortKey, string> = {
    date_desc: 'Newest first',
    date_asc: 'Oldest first',
    value_desc: 'Highest value',
    value_asc: 'Lowest value',
  }

  const visibleStages = stageFilter === 'ALL' ? STAGES : STAGES.filter((s) => s.status === stageFilter)

  const columns = useMemo(
    () =>
      visibleStages.map((col) => ({
        ...col,
        quotes: sortedQuotes.filter((q) => q.status === col.status),
        total: sortedQuotes
          .filter((q) => q.status === col.status)
          .reduce((sum, q) => sum + q.totalAmount, 0),
      })),
    [sortedQuotes, visibleStages]
  )

  const handleSendToProduction = async (quoteId: string) => {
    if (!token || sendingId) return
    setSendingId(quoteId)
    try {
      const res = await fetch(`/api/quotes/${quoteId}/send-to-production`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast({
        title: 'Sent to Pending Approval',
        description: `Order ${data.orderNumber} created and awaiting review.`,
      })
      // Refresh quote status in store
      updateStatus(quoteId, 'WON')
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to send to production',
        variant: 'destructive',
      })
    } finally {
      setSendingId(null)
    }
  }

  const activeFilters = (stageFilter !== 'ALL' ? 1 : 0) + (search.trim() ? 1 : 0)

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals…"
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Stage filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 gap-1.5 text-sm ${stageFilter !== 'ALL' ? 'border-amber-400 text-amber-700 dark:text-amber-400' : ''}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {stageFilter === 'ALL' ? 'Filter' : ALL_STAGE_LABELS[stageFilter]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel className="text-xs text-gray-500">Stage</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setStageFilter('ALL')}
              className={stageFilter === 'ALL' ? 'font-semibold' : ''}
            >
              All stages
            </DropdownMenuItem>
            {STAGES.map((s) => (
              <DropdownMenuItem
                key={s.status}
                onClick={() => setStageFilter(s.status)}
                className={stageFilter === s.status ? 'font-semibold' : ''}
              >
                <span className={`mr-2 inline-block h-2 w-2 rounded-full ${s.dotColor.replace('bg-', 'bg-').replace('300', '500')}`} />
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm">
              <ArrowUpDown className="h-3.5 w-3.5" />
              {SORT_LABELS[sortKey]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel className="text-xs text-gray-500">Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setSortKey(key)}
                className={sortKey === key ? 'font-semibold' : ''}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active filter count badge */}
        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-sm text-gray-500"
            onClick={() => { setSearch(''); setStageFilter('ALL') }}
          >
            <X className="h-3 w-3" />
            Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
          </Button>
        )}

        {/* Spacer + New Deal */}
        <div className="ml-auto">
          <Link href="/quotes/new">
            <Button size="sm" className="h-8 gap-1.5 text-sm bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-3.5 w-3.5" />
              New Deal
            </Button>
          </Link>
        </div>
      </div>

    <ScrollArea className="w-full pb-4">
      <div className="flex gap-3 p-1" style={{ minWidth: `${visibleStages.length * 296}px` }}>
        {columns.map((col) => (
          <div key={col.status} className="w-72 flex-shrink-0 flex flex-col">
            {/* Column header — Monday.com style colored bar */}
            <div className={`rounded-t-lg ${col.headerBg} px-3 py-2.5 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{col.label}</span>
                <span className={`${col.countBg} text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center`}>
                  {col.quotes.length}
                </span>
              </div>
              <span className="text-white/80 text-xs font-medium">{formatCurrency(col.total)}</span>
            </div>

            {/* Column body */}
            <div className="bg-gray-50 dark:bg-gray-800/40 rounded-b-lg border border-t-0 border-gray-200 dark:border-gray-700 flex-1 p-2 space-y-2 min-h-[120px]">
              {col.quotes.map((quote) => {
                const lastUpdate = quote.history?.[quote.history.length - 1]?.timestamp || quote.createdAt
                return (
                  <div
                    key={quote.id}
                    className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:border-amber-300 dark:hover:border-amber-600 transition-colors group"
                  >
                    {/* Deal header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="text-sm font-semibold text-gray-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 truncate block"
                        >
                          {quote.customerName}
                        </Link>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                          {quote.quoteNumber}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/quotes/${quote.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          {/* Move to next stage */}
                          {STAGES.findIndex((s) => s.status === quote.status) < STAGES.length - 2 && (
                            <DropdownMenuItem
                              onClick={() => {
                                const idx = STAGES.findIndex((s) => s.status === quote.status)
                                if (idx >= 0 && idx < STAGES.length - 1) {
                                  updateStatus(quote.id, STAGES[idx + 1].status)
                                }
                              }}
                            >
                              <ArrowRight className="mr-2 h-3.5 w-3.5" />
                              Move to {STAGES[STAGES.findIndex((s) => s.status === quote.status) + 1]?.label}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleSendToProduction(quote.id)}
                            disabled={sendingId === quote.id}
                            className="text-amber-700 dark:text-amber-400 font-medium"
                          >
                            {sendingId === quote.id ? (
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Package className="mr-2 h-3.5 w-3.5" />
                            )}
                            Send to Pending Approval
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus(quote.id, 'LOST')}
                            className="text-gray-500"
                          >
                            Archive Deal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Deal value */}
                    <div className="text-base font-bold text-gray-900 dark:text-white mb-2">
                      {formatCurrency(quote.totalAmount)}
                    </div>

                    {/* Side mark */}
                    {quote.sideMark && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                        {quote.sideMark}
                      </p>
                    )}

                    {/* Footer — date and stage badge */}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {lastUpdate ? format(new Date(lastUpdate), 'MMM d') : '—'}
                      </span>
                      {/* Quick-move stage buttons */}
                      <div className="flex items-center gap-1">
                        {STAGES.filter((s) => s.status !== quote.status).map((s) => (
                          <button
                            key={s.status}
                            title={`Move to ${s.label}`}
                            onClick={() => updateStatus(quote.id, s.status)}
                            className={`w-2 h-2 rounded-full ${s.dotColor} opacity-40 hover:opacity-100 transition-opacity`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}

              {col.quotes.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 text-center mt-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500">No deals</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
    </div>
  )
}
