'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, startOfWeek, addDays, subWeeks, addWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, CalendarDays, Columns } from 'lucide-react'
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
  PENDING_APPROVAL: 'Pending Approval',
  READY_FOR_PRODUCTION: 'Ready For Production',
  PRODUCTION_CHECK: 'Production Check',
  COMPONENT_CUT: 'Component Cut',
  FABRIC_CUT: 'Fabric Cut',
  ASSEMBLE: 'Assemble',
  QUALITY_CHECK: 'Quality Check',
  PACKING: 'Packing',
  SHIPPED_INSTALLED: 'Shipped/Installed',
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

const statusBadgeStyles: Record<ProductionStatus, string> = {
  PENDING_APPROVAL: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  READY_FOR_PRODUCTION: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  PRODUCTION_CHECK: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
  COMPONENT_CUT: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  FABRIC_CUT: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  ASSEMBLE: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  QUALITY_CHECK: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  PACKING: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  SHIPPED_INSTALLED: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
}

const pipelineColumnStyles: Record<ProductionStatus, string> = {
  PENDING_APPROVAL: 'border-amber-300 dark:border-amber-700',
  READY_FOR_PRODUCTION: 'border-gray-200 dark:border-gray-700',
  PRODUCTION_CHECK: 'border-gray-200 dark:border-gray-700',
  COMPONENT_CUT: 'border-amber-200 dark:border-amber-800',
  FABRIC_CUT: 'border-amber-200 dark:border-amber-800',
  ASSEMBLE: 'border-amber-200 dark:border-amber-800',
  QUALITY_CHECK: 'border-gray-200 dark:border-gray-700',
  PACKING: 'border-gray-200 dark:border-gray-700',
  SHIPPED_INSTALLED: 'border-gray-200 dark:border-gray-700',
}

interface ScheduleOrder {
  id: string
  orderNumber: string
  customer: string
  shades: number
  installationDate: Date | null
  status: ProductionStatus
}

export default function ProductionSchedulePage() {
  const { token } = useAuthStore()
  const [orders, setOrders] = useState<ScheduleOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [view, setView] = useState<'calendar' | 'pipeline'>('calendar')
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load orders')
      }
      const data = await res.json()
      const mapped: ScheduleOrder[] = (data.orders || [])
        .filter((o: any) => o.status !== 'PENDING_APPROVAL')
        .map((o: any) => ({
          id: o._id,
          orderNumber: o.orderNumber,
          customer: o.customerName,
          shades: o.totalShades || 0,
          installationDate: o.installationDate ? new Date(o.installationDate) : null,
          status: o.status as ProductionStatus,
        }))
      setOrders(mapped)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Group orders by installation date (calendar view)
  const ordersByDay: Record<string, ScheduleOrder[]> = {}
  orders.forEach(order => {
    if (order.installationDate) {
      const dayKey = format(order.installationDate, 'yyyy-MM-dd')
      if (!ordersByDay[dayKey]) ordersByDay[dayKey] = []
      ordersByDay[dayKey].push(order)
    }
  })

  // Group orders by status (pipeline view)
  const ordersByStatus: Record<ProductionStatus, ScheduleOrder[]> = {} as any
  PIPELINE_STAGES.forEach(s => { ordersByStatus[s] = [] })
  orders.forEach(order => {
    if (ordersByStatus[order.status]) {
      ordersByStatus[order.status].push(order)
    }
  })

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
          <Button variant="outline" className="mt-3" onClick={fetchOrders}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Production Schedule</h2>
          <p className="text-sm text-muted-foreground">
            {view === 'calendar' ? 'Kanban view of orders by installation date' : 'Pipeline view by production stage'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setView('calendar')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                view === 'calendar'
                  ? 'bg-amber-600 text-white'
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </button>
            <button
              onClick={() => setView('pipeline')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                view === 'pipeline'
                  ? 'bg-amber-600 text-white'
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Columns className="h-3.5 w-3.5" />
              Pipeline
            </button>
          </div>

          <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          {view === 'calendar' && (
            <>
              <Button variant="outline" size="sm" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── CALENDAR VIEW ── */}
      {view === 'calendar' && (
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
                  <Card
                    key={idx}
                    className={cn(
                      'min-h-[560px] border',
                      isToday ? 'border-amber-500 dark:border-amber-500' : ''
                    )}
                  >
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-semibold">
                        {format(day, 'EEE')}
                        <div className={cn(
                          'text-xs mt-0.5 font-normal',
                          isToday ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-muted-foreground'
                        )}>
                          {format(day, 'MMM d')}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 pb-3">
                      <div className="space-y-1.5">
                        {dayOrders.map((order) => (
                          <Link key={order.id} href={`/production/orders/${order.id}`}>
                            <div className="p-2.5 border rounded-lg hover:bg-muted/50 dark:hover:bg-muted/30 cursor-pointer transition-colors">
                              <div className="font-medium text-xs text-gray-900 dark:text-white">{order.orderNumber}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 truncate">{order.customer}</div>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                <Badge variant="outline" className={cn('text-[10px] border-0 px-1.5', statusBadgeStyles[order.status])}>
                                  {statusLabels[order.status] ?? order.status}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5">
                                  {order.shades} shades
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
        </>
      )}

      {/* ── PIPELINE VIEW ── */}
      {view === 'pipeline' && (
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-[1200px] pb-4">
            {PIPELINE_STAGES.map((stage) => {
              const stageOrders = ordersByStatus[stage] || []
              return (
                <div
                  key={stage}
                  className={cn(
                    'flex-1 min-w-[160px] rounded-xl border-t-2 bg-gray-50 dark:bg-[#1a1a1a]',
                    pipelineColumnStyles[stage]
                  )}
                >
                  {/* Column header */}
                  <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {statusLabels[stage]}
                    </span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-[#2a2a2a] rounded-full px-1.5 py-0.5 min-w-[20px] text-center border border-gray-200 dark:border-gray-600">
                      {stageOrders.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="p-2 space-y-2 min-h-[500px]">
                    {stageOrders.map((order) => (
                      <Link key={order.id} href={`/production/orders/${order.id}`}>
                        <div className="bg-white dark:bg-[#232323] border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-amber-400 dark:hover:border-amber-600 transition-colors cursor-pointer shadow-sm">
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold text-xs text-gray-900 dark:text-white">
                              {order.orderNumber}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {order.shades}s
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 truncate">{order.customer}</div>
                          {order.installationDate && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-500 mt-1.5 font-medium">
                              {format(order.installationDate, 'MMM d')}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                    {stageOrders.length === 0 && (
                      <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                        No orders
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
