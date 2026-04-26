'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Package, DollarSign, Clock, Calendar, Loader2, RefreshCw, LayoutGrid, List, Kanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import type { ProductionOrder, ProductionStatus } from '@/types/production'
import { useAuthStore } from '@/stores/authStore'

// Pending Order Card Component (similar to ProjectCard)
interface PendingOrderCardProps {
  order: ProductionOrder
}

function PendingOrderCard({ order }: PendingOrderCardProps) {
  const statusColors: Record<ProductionStatus, string> = {
    PENDING_APPROVAL: 'text-yellow-500 dark:text-yellow-400',
    READY_FOR_PRODUCTION: 'text-gray-600 dark:text-gray-300',
    PRODUCTION_CHECK: 'text-gray-600 dark:text-gray-300',
    COMPONENT_CUT: 'text-gray-600 dark:text-gray-300',
    FABRIC_CUT: 'text-gray-600 dark:text-gray-300',
    ASSEMBLE: 'text-gray-600 dark:text-gray-300',
    QUALITY_CHECK: 'text-gray-600 dark:text-gray-300',
    PACKING: 'text-gray-600 dark:text-gray-300',
    SHIPPED_INSTALLED: 'text-gray-600 dark:text-gray-300',
  }

  const statusDots: Record<ProductionStatus, string> = {
    PENDING_APPROVAL: 'bg-yellow-500 dark:bg-yellow-400',
    READY_FOR_PRODUCTION: 'bg-gray-500 dark:bg-gray-400',
    PRODUCTION_CHECK: 'bg-gray-500 dark:bg-gray-400',
    COMPONENT_CUT: 'bg-gray-500 dark:bg-gray-400',
    FABRIC_CUT: 'bg-gray-500 dark:bg-gray-400',
    ASSEMBLE: 'bg-gray-500 dark:bg-gray-400',
    QUALITY_CHECK: 'bg-gray-500 dark:bg-gray-400',
    PACKING: 'bg-gray-500 dark:bg-gray-400',
    SHIPPED_INSTALLED: 'bg-gray-500 dark:bg-gray-400',
  }

  // Calculate progress based on items with production sheets assigned
  const itemsWithSheets = order.items.filter(item => item.productionSheetId).length
  const progress = order.items.length > 0 ? Math.round((itemsWithSheets / order.items.length) * 100) : 0

  return (
    <Link href={`/production/pending-approval/${order._id}`}>
      <div className="rounded-xl border border-gray-100 bg-white p-4 transition-all hover:shadow-md cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate max-w-[140px]">
              {order.orderNumber}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">{order.customerName}</p>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-yellow-50">
            <Package className="w-5 h-5 text-yellow-600" />
          </div>
        </div>

        {/* Details & Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{order.totalShades} shades</span>
          </div>
          <div className={`flex items-center gap-1 text-xs ${statusColors[order.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDots[order.status]}`}></span>
            Pending
          </div>
        </div>

        {/* Installation Date & Progress */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            {order.installationDate && (
              <>
                <Calendar className="w-3 h-3" />
                <span>{format(order.installationDate, 'MMM dd, yyyy')}</span>
              </>
            )}
          </span>
          <span className="text-gray-900 font-medium">{progress}%</span>
        </div>
      </div>
    </Link>
  )
}

export default function PendingApprovalPage() {
  const { token, user } = useAuthStore()
  const { toast } = useToast()
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const fetchOrders = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/orders?status=PENDING_APPROVAL', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load orders')
      }
      const data = await res.json()
      // Convert date strings to Date objects
      const ordersWithDates = (data.orders || []).map((order: any) => ({
        ...order,
        orderDate: order.orderDate ? new Date(order.orderDate) : new Date(),
        installationDate: order.installationDate ? new Date(order.installationDate) : undefined,
        approvalDate: order.approvalDate ? new Date(order.approvalDate) : undefined,
        createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
      }))
      setOrders(ordersWithDates)
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

  const handleSync = async () => {
    if (!token || syncing) return
    setSyncing(true)
    try {
      const res = await fetch('/api/orders/backfill', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      toast({
        title: data.created > 0 ? `Recovered ${data.created} order${data.created > 1 ? 's' : ''}` : 'Already up to date',
        description: `${data.created} created · ${data.skipped} already present`,
      })
      if (data.created > 0) fetchOrders()
    } catch {
      toast({ title: 'Sync failed', variant: 'destructive' })
    } finally {
      setSyncing(false)
    }
  }

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'pipeline'>('grid')

  // Pipeline columns grouped by installation urgency
  const pipelineColumns = useMemo(() => {
    const now = Date.now()
    const cols: { key: string; label: string; accent: string; dot: string; orders: ProductionOrder[] }[] = [
      { key: 'overdue',    label: 'Overdue',       accent: 'border-red-400 bg-red-50',    dot: 'bg-red-400',    orders: [] },
      { key: 'this_week',  label: 'This Week',      accent: 'border-amber-400 bg-amber-50', dot: 'bg-amber-400',  orders: [] },
      { key: 'next_2wk',   label: 'Next 2 Weeks',   accent: 'border-blue-400 bg-blue-50',   dot: 'bg-blue-400',   orders: [] },
      { key: 'later',      label: 'Later',           accent: 'border-gray-300 bg-gray-50',   dot: 'bg-gray-400',   orders: [] },
      { key: 'no_date',    label: 'No Date',         accent: 'border-gray-200 bg-white',     dot: 'bg-gray-300',   orders: [] },
    ]
    for (const order of orders) {
      if (!order.installationDate) { cols[4].orders.push(order); continue }
      const days = Math.ceil((order.installationDate.getTime() - now) / (1000 * 60 * 60 * 24))
      if (days < 0)       cols[0].orders.push(order)
      else if (days <= 7) cols[1].orders.push(order)
      else if (days <= 14) cols[2].orders.push(order)
      else                cols[3].orders.push(order)
    }
    return cols
  }, [orders])

  // Sort by installation date priority
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      if (!a.installationDate) return 1
      if (!b.installationDate) return -1
      return a.installationDate.getTime() - b.installationDate.getTime()
    })
  }, [orders])

  // Calculate KPI metrics
  const totalOrders = sortedOrders.length
  const totalShades = sortedOrders.reduce((sum, o) => sum + o.totalShades, 0)
  const urgentOrders = sortedOrders.filter(o => {
    if (!o.installationDate) return false
    const daysUntil = Math.ceil((o.installationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 7 && daysUntil >= 0
  }).length

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Error loading orders</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Pending Approval</h1>
        {(user as any)?.role === 'ADMIN' && (
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync Missing Orders
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending Orders', value: totalOrders,  sub: 'orders',    border: '#9CA3AF' },
          { label: 'Total Shades',   value: totalShades,  sub: 'shades',    border: '#F59E0B' },
          { label: 'Urgent',         value: urgentOrders, sub: 'this week', border: '#EF4444' },
        ].map(({ label, value, sub, border }) => (
          <div
            key={label}
            className="rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
            style={{ borderLeftWidth: 4, borderLeftColor: border }}
          >
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
              <span className="text-xs text-gray-400">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{sortedOrders.length} order{sortedOrders.length !== 1 ? 's' : ''} pending</p>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
          <button
            onClick={() => setViewMode('pipeline')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'pipeline' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Kanban className="h-3.5 w-3.5" /> Pipeline
          </button>
        </div>
      </div>

      {/* Orders */}
      {sortedOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No pending orders</p>
        </div>
      ) : viewMode === 'pipeline' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineColumns.map((col) => (
            <div key={col.key} className="flex-shrink-0 w-64">
              {/* Column header */}
              <div className={`flex items-center justify-between rounded-t-xl border-t-2 px-3 py-2.5 mb-2 ${col.accent}`}
                style={{ borderTopWidth: 3 }}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`}></span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{col.label}</span>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-white dark:bg-gray-700 rounded-full px-2 py-0.5 border border-gray-200 dark:border-gray-600">
                  {col.orders.length}
                </span>
              </div>
              {/* Cards */}
              <div className="flex flex-col gap-2">
                {col.orders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 py-6 text-center text-xs text-gray-400">
                    No orders
                  </div>
                ) : (
                  col.orders.map((order) => {
                    const itemsWithSheets = order.items.filter(i => i.productionSheetId).length
                    const progress = order.items.length > 0 ? Math.round((itemsWithSheets / order.items.length) * 100) : 0
                    const days = order.installationDate
                      ? Math.ceil((order.installationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null
                    return (
                      <Link key={order._id} href={`/production/pending-approval/${order._id}`}>
                        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-xs font-semibold text-gray-900 dark:text-white font-mono">{order.orderNumber}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[140px]">{order.customerName}</p>
                            </div>
                            <span className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-1.5 py-0.5 font-medium">
                              {order.totalShades} shades
                            </span>
                          </div>
                          {order.installationDate && (
                            <div className="flex items-center gap-1 text-[11px] mb-2">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className={days !== null && days < 0 ? 'text-red-500 font-medium' : days !== null && days <= 7 ? 'text-amber-600 font-medium' : 'text-gray-500'}>
                                {format(order.installationDate, 'MMM d, yyyy')}
                              </span>
                              {days !== null && days < 0 && (
                                <span className="ml-1 text-[10px] bg-red-100 text-red-600 rounded px-1">Overdue</span>
                              )}
                            </div>
                          )}
                          {/* Progress bar */}
                          <div className="mt-1">
                            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                              <span>Sheets assigned</span>
                              <span className="font-medium text-gray-600">{progress}%</span>
                            </div>
                            <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-400 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedOrders.map((order) => (
            <PendingOrderCard key={order._id} order={order} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Shades</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Installation</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedOrders.map((order) => {
                const daysUntil = order.installationDate
                  ? Math.ceil((order.installationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null
                const isUrgent = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0
                return (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/production/pending-approval/${order._id}`} className="font-mono text-xs font-semibold text-orange-600 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{order.customerName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{order.totalShades}</td>
                    <td className="px-4 py-3">
                      {order.installationDate ? (
                        <span className={isUrgent ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                          {format(order.installationDate, 'MMM d, yyyy')}
                          {isUrgent && <span className="ml-1 text-[10px] bg-red-100 text-red-600 rounded px-1">Urgent</span>}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                        Pending
                      </span>
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
