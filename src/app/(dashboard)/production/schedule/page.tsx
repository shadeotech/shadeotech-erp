'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  format,
  startOfWeek,
  addDays,
  subWeeks,
  addWeeks,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  addMonths,
  isWithinInterval,
  isBefore,
  isAfter,
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  CalendarDays,
  Columns,
  Search,
  X,
  Filter,
  LayoutList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

type ProductionStatus =
  | 'PENDING_APPROVAL'
  | 'READY_FOR_PRODUCTION'
  | 'PRODUCTION_CHECK'
  | 'COMPONENT_CUT'
  | 'FABRIC_CUT'
  | 'ASSEMBLE'
  | 'QUALITY_CHECK'
  | 'PACKING'
  | 'SHIPPED_INSTALLED'

const statusLabels: Record<ProductionStatus, string> = {
  PENDING_APPROVAL:    'Pending Approval',
  READY_FOR_PRODUCTION:'Ready For Production',
  PRODUCTION_CHECK:    'Production Check',
  COMPONENT_CUT:       'Component Cut',
  FABRIC_CUT:          'Fabric Cut',
  ASSEMBLE:            'Assemble',
  QUALITY_CHECK:       'Quality Check',
  PACKING:             'Packing',
  SHIPPED_INSTALLED:   'Shipped/Installed',
}

const PIPELINE_STAGES: ProductionStatus[] = [
  'READY_FOR_PRODUCTION',
  'PRODUCTION_CHECK',
  'COMPONENT_CUT',
  'FABRIC_CUT',
  'ASSEMBLE',
  'QUALITY_CHECK',
  'PACKING',
  'SHIPPED_INSTALLED',
]

const ALL_STATUSES: ProductionStatus[] = [
  'PENDING_APPROVAL',
  ...PIPELINE_STAGES,
]

const statusBadgeStyles: Record<ProductionStatus, string> = {
  PENDING_APPROVAL:     'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  READY_FOR_PRODUCTION: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  PRODUCTION_CHECK:     'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  COMPONENT_CUT:        'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  FABRIC_CUT:           'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  ASSEMBLE:             'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  QUALITY_CHECK:        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  PACKING:              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  SHIPPED_INSTALLED:    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
}

const pipelineColumnStyles: Record<ProductionStatus, string> = {
  PENDING_APPROVAL:     'border-amber-300 dark:border-amber-700',
  READY_FOR_PRODUCTION: 'border-gray-200 dark:border-gray-700',
  PRODUCTION_CHECK:     'border-slate-300 dark:border-slate-700',
  COMPONENT_CUT:        'border-amber-200 dark:border-amber-800',
  FABRIC_CUT:           'border-amber-200 dark:border-amber-800',
  ASSEMBLE:             'border-amber-200 dark:border-amber-800',
  QUALITY_CHECK:        'border-gray-200 dark:border-gray-700',
  PACKING:              'border-blue-200 dark:border-blue-800',
  SHIPPED_INSTALLED:    'border-emerald-200 dark:border-emerald-800',
}

type DateRangeOption = 'all' | 'today' | 'this-week' | 'next-week' | 'next-2-weeks' | 'this-month' | 'next-month' | 'overdue' | 'no-date'
type SortOption = 'install-asc' | 'install-desc' | 'order-asc' | 'shades-desc'

const DATE_RANGE_LABELS: Record<DateRangeOption, string> = {
  'all':         'All dates',
  'today':       'Today',
  'this-week':   'This week',
  'next-week':   'Next week',
  'next-2-weeks':'Next 2 weeks',
  'this-month':  'This month',
  'next-month':  'Next month',
  'overdue':     'Overdue',
  'no-date':     'No date set',
}

interface ScheduleOrder {
  id: string
  orderNumber: string
  customer: string
  sideMark: string
  shades: number
  installationDate: Date | null
  status: ProductionStatus
}

function getDateRange(option: DateRangeOption): { start: Date; end: Date } | null {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd   = endOfDay(now)
  const weekStart  = startOfWeek(now, { weekStartsOn: 1 })
  switch (option) {
    case 'today':       return { start: todayStart, end: todayEnd }
    case 'this-week':   return { start: weekStart, end: endOfDay(addDays(weekStart, 6)) }
    case 'next-week': {
      const ns = addDays(weekStart, 7)
      return { start: ns, end: endOfDay(addDays(ns, 6)) }
    }
    case 'next-2-weeks': return { start: weekStart, end: endOfDay(addDays(weekStart, 13)) }
    case 'this-month':  return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'next-month': {
      const nm = addMonths(now, 1)
      return { start: startOfMonth(nm), end: endOfMonth(nm) }
    }
    case 'overdue':  return { start: new Date(0), end: endOfDay(addDays(now, -1)) }
    default: return null
  }
}

export default function ProductionSchedulePage() {
  const { token } = useAuthStore()
  const [orders, setOrders] = useState<ScheduleOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [view, setView] = useState<'calendar' | 'pipeline' | 'list'>('calendar')

  // ── Filters ──
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProductionStatus>('all')
  const [dateRange, setDateRange] = useState<DateRangeOption>('all')
  const [sortBy, setSortBy] = useState<SortOption>('install-asc')
  const [shadesMin, setShadesMin] = useState('')
  const [shadesMax, setShadesMax] = useState('')

  const hasActiveFilters = search || statusFilter !== 'all' || dateRange !== 'all' || shadesMin || shadesMax

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setDateRange('all')
    setShadesMin('')
    setShadesMax('')
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const fetchOrders = useCallback(async () => {
    if (!token) { setLoading(false); return }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load orders')
      }
      const data = await res.json()
      const mapped: ScheduleOrder[] = (data.orders || [])
        .filter((o: any) => o.status !== 'PENDING_APPROVAL')
        .map((o: any) => ({
          id:               o._id,
          orderNumber:      o.orderNumber,
          customer:         o.customerName,
          sideMark:         o.sideMark || '',
          shades:           o.totalShades || 0,
          installationDate: o.installationDate ? new Date(o.installationDate) : null,
          status:           o.status as ProductionStatus,
        }))
      setOrders(mapped)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── Filtered + sorted orders ──
  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase()
    const range = getDateRange(dateRange)

    return orders
      .filter(o => {
        if (q && !o.orderNumber.toLowerCase().includes(q) && !o.customer.toLowerCase().includes(q) && !o.sideMark.toLowerCase().includes(q))
          return false
        if (statusFilter !== 'all' && o.status !== statusFilter)
          return false
        if (dateRange === 'no-date')
          return o.installationDate === null
        if (dateRange === 'overdue')
          return o.installationDate !== null && isBefore(o.installationDate, startOfDay(new Date()))
        if (range && o.installationDate) {
          if (!isWithinInterval(o.installationDate, range)) return false
        } else if (range && !o.installationDate) {
          return false
        }
        if (shadesMin && o.shades < Number(shadesMin)) return false
        if (shadesMax && o.shades > Number(shadesMax)) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'install-asc') {
          if (!a.installationDate && !b.installationDate) return 0
          if (!a.installationDate) return 1
          if (!b.installationDate) return -1
          return a.installationDate.getTime() - b.installationDate.getTime()
        }
        if (sortBy === 'install-desc') {
          if (!a.installationDate && !b.installationDate) return 0
          if (!a.installationDate) return 1
          if (!b.installationDate) return -1
          return b.installationDate.getTime() - a.installationDate.getTime()
        }
        if (sortBy === 'order-asc') return a.orderNumber.localeCompare(b.orderNumber)
        if (sortBy === 'shades-desc') return b.shades - a.shades
        return 0
      })
  }, [orders, search, statusFilter, dateRange, shadesMin, shadesMax, sortBy])

  // Group for calendar
  const ordersByDay: Record<string, ScheduleOrder[]> = {}
  filteredOrders.forEach(order => {
    if (order.installationDate) {
      const key = format(order.installationDate, 'yyyy-MM-dd')
      if (!ordersByDay[key]) ordersByDay[key] = []
      ordersByDay[key].push(order)
    }
  })

  // Group for pipeline
  const ordersByStatus: Record<ProductionStatus, ScheduleOrder[]> = {} as any
  PIPELINE_STAGES.forEach(s => { ordersByStatus[s] = [] })
  filteredOrders.forEach(order => {
    if (ordersByStatus[order.status]) ordersByStatus[order.status].push(order)
  })

  // Stats
  const totalShades = filteredOrders.reduce((s, o) => s + o.shades, 0)
  const now = new Date()
  const weekEnd = endOfDay(addDays(startOfWeek(now, { weekStartsOn: 1 }), 6))
  const dueThisWeek = filteredOrders.filter(o => o.installationDate && isWithinInterval(o.installationDate, { start: startOfDay(now), end: weekEnd })).length
  const overdue = filteredOrders.filter(o => o.installationDate && isBefore(o.installationDate, startOfDay(now))).length
  const noDate = filteredOrders.filter(o => !o.installationDate).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 dark:bg-destructive/20 p-4">
          <p className="font-medium">Error loading orders</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Button variant="outline" className="mt-3" onClick={fetchOrders}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Production Schedule</h2>
          <p className="text-sm text-muted-foreground">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} · {totalShades} shades
            {hasActiveFilters && <span className="ml-1 text-amber-600 font-medium">(filtered)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {([
              ['calendar',  <CalendarDays className="h-3.5 w-3.5" />,  'Calendar'],
              ['pipeline',  <Columns     className="h-3.5 w-3.5" />,  'Pipeline'],
              ['list',      <LayoutList  className="h-3.5 w-3.5" />,  'List'],
            ] as const).map(([v, icon, label]) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                  view === v ? 'bg-amber-600 text-white' : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {icon}{label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {view === 'calendar' && (
            <>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCurrentWeek(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Order #, customer, side mark…"
              className="pl-9 h-8 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status */}
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
            <SelectTrigger className="h-8 text-xs w-[175px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ALL_STATUSES.map(s => (
                <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range */}
          <Select value={dateRange} onValueChange={v => setDateRange(v as DateRangeOption)}>
            <SelectTrigger className="h-8 text-xs w-[150px]">
              <SelectValue placeholder="All dates" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(DATE_RANGE_LABELS) as DateRangeOption[]).map(k => (
                <SelectItem key={k} value={k}>{DATE_RANGE_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-8 text-xs w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="install-asc">Install date ↑</SelectItem>
              <SelectItem value="install-desc">Install date ↓</SelectItem>
              <SelectItem value="order-asc">Order # A–Z</SelectItem>
              <SelectItem value="shades-desc">Most shades first</SelectItem>
            </SelectContent>
          </Select>

          {/* Shades range */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="text-xs font-medium">Shades</span>
            <Input
              type="number"
              placeholder="Min"
              value={shadesMin}
              onChange={e => setShadesMin(e.target.value)}
              className="h-8 w-16 text-xs text-center"
            />
            <span>–</span>
            <Input
              type="number"
              placeholder="Max"
              value={shadesMax}
              onChange={e => setShadesMax(e.target.value)}
              className="h-8 w-16 text-xs text-center"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium ml-auto"
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5">
            {search && (
              <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-full px-2.5 py-0.5 text-xs font-medium">
                "{search}" <button onClick={() => setSearch('')}><X className="h-3 w-3" /></button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-full px-2.5 py-0.5 text-xs font-medium">
                {statusLabels[statusFilter]} <button onClick={() => setStatusFilter('all')}><X className="h-3 w-3" /></button>
              </span>
            )}
            {dateRange !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 rounded-full px-2.5 py-0.5 text-xs font-medium">
                {DATE_RANGE_LABELS[dateRange]} <button onClick={() => setDateRange('all')}><X className="h-3 w-3" /></button>
              </span>
            )}
            {(shadesMin || shadesMax) && (
              <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full px-2.5 py-0.5 text-xs font-medium">
                Shades {shadesMin || '0'}–{shadesMax || '∞'} <button onClick={() => { setShadesMin(''); setShadesMax('') }}><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total orders',    value: filteredOrders.length, color: 'text-gray-900 dark:text-white' },
          { label: 'Due this week',   value: dueThisWeek,           color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Overdue',         value: overdue,               color: overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400' },
          { label: 'No date set',     value: noDate,                color: 'text-gray-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn('text-2xl font-bold mt-0.5', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* No results */}
      {filteredOrders.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-16 text-center space-y-2">
          <Filter className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">No orders match the current filters</p>
          <button onClick={clearFilters} className="text-xs text-amber-600 hover:text-amber-700 font-medium">Clear all filters</button>
        </div>
      )}

      {/* ── CALENDAR VIEW ── */}
      {view === 'calendar' && filteredOrders.length > 0 && (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-3 min-w-[1000px]">
              {days.map((day, idx) => {
                const dayKey = format(day, 'yyyy-MM-dd')
                const dayOrders = ordersByDay[dayKey] || []
                const isToday = dayKey === format(new Date(), 'yyyy-MM-dd')
                return (
                  <Card key={idx} className={cn('min-h-[520px] border', isToday ? 'border-amber-500' : '')}>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-semibold">
                        {format(day, 'EEE')}
                        <div className={cn('text-xs mt-0.5 font-normal', isToday ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-muted-foreground')}>
                          {format(day, 'MMM d')}
                        </div>
                        {dayOrders.length > 0 && (
                          <span className="inline-block mt-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-1.5 py-0.5 font-semibold">
                            {dayOrders.length}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 pb-3">
                      <div className="space-y-1.5">
                        {dayOrders.map((order) => (
                          <Link key={order.id} href={`/production/orders/${order.id}`}>
                            <div className="p-2.5 border rounded-lg hover:bg-muted/50 dark:hover:bg-muted/30 cursor-pointer transition-colors">
                              <div className="font-medium text-xs text-gray-900 dark:text-white">{order.orderNumber}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 truncate">{order.customer}</div>
                              {order.sideMark && <div className="text-[10px] text-muted-foreground/60 truncate font-mono">{order.sideMark}</div>}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                <Badge variant="outline" className={cn('text-[10px] border-0 px-1.5', statusBadgeStyles[order.status])}>
                                  {statusLabels[order.status]}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5">
                                  {order.shades}s
                                </Badge>
                              </div>
                            </div>
                          </Link>
                        ))}
                        {dayOrders.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">—</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
          {/* Unscheduled orders */}
          {filteredOrders.filter(o => !o.installationDate).length > 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">No installation date</p>
              <div className="flex flex-wrap gap-2">
                {filteredOrders.filter(o => !o.installationDate).map(order => (
                  <Link key={order.id} href={`/production/orders/${order.id}`}>
                    <div className="border rounded-lg px-3 py-2 text-xs hover:bg-muted/30 transition-colors cursor-pointer">
                      <span className="font-medium">{order.orderNumber}</span>
                      <span className="text-muted-foreground ml-1.5">{order.customer}</span>
                      <Badge variant="outline" className={cn('ml-2 text-[10px] border-0 px-1.5', statusBadgeStyles[order.status])}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── PIPELINE VIEW ── */}
      {view === 'pipeline' && filteredOrders.length > 0 && (
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-[1200px] pb-4">
            {PIPELINE_STAGES.map((stage) => {
              const stageOrders = ordersByStatus[stage] || []
              return (
                <div
                  key={stage}
                  className={cn('flex-1 min-w-[160px] rounded-xl border-t-2 bg-gray-50 dark:bg-[#1a1a1a]', pipelineColumnStyles[stage])}
                >
                  <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{statusLabels[stage]}</span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-[#2a2a2a] rounded-full px-1.5 py-0.5 min-w-[20px] text-center border border-gray-200 dark:border-gray-600 shrink-0 ml-1">
                      {stageOrders.length}
                    </span>
                  </div>
                  <div className="p-2 space-y-2 min-h-[400px]">
                    {stageOrders.map((order) => (
                      <Link key={order.id} href={`/production/orders/${order.id}`}>
                        <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-amber-400 dark:hover:border-amber-600 transition-colors cursor-pointer shadow-sm">
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold text-xs text-gray-900 dark:text-white">{order.orderNumber}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">{order.shades}s</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">{order.customer}</div>
                          {order.sideMark && <div className="text-[10px] text-muted-foreground/60 truncate font-mono mt-0.5">{order.sideMark}</div>}
                          {order.installationDate && (
                            <div className={cn(
                              'text-[10px] mt-1.5 font-medium',
                              isBefore(order.installationDate, startOfDay(new Date()))
                                ? 'text-red-500 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-500'
                            )}>
                              {isBefore(order.installationDate, startOfDay(new Date())) ? '⚠ ' : ''}
                              {format(order.installationDate, 'MMM d')}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                    {stageOrders.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">No orders</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && filteredOrders.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Side Mark</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Shades</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Install Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredOrders.map((order) => {
                const isOvd = order.installationDate && isBefore(order.installationDate, startOfDay(new Date()))
                return (
                  <tr key={order.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/production/orders/${order.id}`} className="font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{order.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{order.sideMark || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('text-[10px] border-0 px-1.5', statusBadgeStyles[order.status])}>
                        {statusLabels[order.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{order.shades}</td>
                    <td className={cn('px-4 py-3 text-sm font-medium', isOvd ? 'text-red-500 dark:text-red-400' : order.installationDate ? 'text-gray-700 dark:text-gray-300' : 'text-muted-foreground')}>
                      {order.installationDate ? (isOvd ? '⚠ ' : '') + format(order.installationDate, 'MMM d, yyyy') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
