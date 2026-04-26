'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Search,
  RefreshCw,
  Clock,
  Loader2,
  Package,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import type { ProductionStatus, ProductionOrder, StageCompletion } from '@/types/production'
import { cn } from '@/lib/utils'

const workflowSteps: { key: ProductionStatus; label: string; short: string }[] = [
  { key: 'READY_FOR_PRODUCTION', label: 'Received', short: 'Received' },
  { key: 'PRODUCTION_CHECK',     label: 'Production Check',     short: 'P.Check' },
  { key: 'COMPONENT_CUT',        label: 'Component Cut',        short: 'Comp. Cut' },
  { key: 'FABRIC_CUT',           label: 'Fabric Cut',           short: 'Fabric Cut' },
  { key: 'ASSEMBLE',             label: 'Assemble',             short: 'Assemble' },
  { key: 'QUALITY_CHECK',        label: 'Quality Check',        short: 'QC' },
  { key: 'PACKING',              label: 'Packing',              short: 'Packing' },
  { key: 'SHIPPED_INSTALLED',    label: 'Shipped/Installed',    short: 'Shipped' },
]

const PIPELINE_PROGRESS: Record<string, number> = {
  PENDING_APPROVAL: 13,
  READY_FOR_PRODUCTION: 25,
  PRODUCTION_CHECK: 37,
  COMPONENT_CUT: 50,
  FABRIC_CUT: 62,
  ASSEMBLE: 75,
  QUALITY_CHECK: 87,
  PACKING: 95,
  SHIPPED_INSTALLED: 100,
}

const STATUS_COLORS: Record<string, string> = {
  READY_FOR_PRODUCTION: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PRODUCTION_CHECK:     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  COMPONENT_CUT:        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  FABRIC_CUT:           'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ASSEMBLE:             'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  QUALITY_CHECK:        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  PACKING:              'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  SHIPPED_INSTALLED:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const PAGE_SIZES = [10, 25, 50]

function ArrowProgressBar({ order }: { order: ProductionOrder }) {
  const currentIndex = workflowSteps.findIndex(s => s.key === order.status)
  const completions = order.stageCompletions || []

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0 overflow-x-auto py-1">
        {workflowSteps.map((step, index) => {
          const isActive = index <= currentIndex
          const isLast = index === workflowSteps.length - 1
          const completion = completions.find((sc: StageCompletion) => sc.status === step.key)
          const pct = Math.round(((index + 1) / workflowSteps.length) * 100)

          const seg = (
            <div className="flex items-center relative" style={{ marginLeft: index === 0 ? 0 : -10 }}>
              <div
                className={cn(
                  'relative flex items-center justify-center h-9 px-2',
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                )}
                style={{
                  clipPath:
                    index === 0 && isLast
                      ? 'polygon(0 0,100% 0,100% 100%,0 100%)'
                      : index === 0
                      ? 'polygon(0 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,0 100%)'
                      : isLast
                      ? 'polygon(10px 0,100% 0,100% 100%,10px 100%)'
                      : 'polygon(10px 0,calc(100% - 10px) 0,100% 50%,calc(100% - 10px) 100%,10px 100%)',
                  minWidth: 82,
                  paddingLeft: index === 0 ? 10 : 18,
                  paddingRight: isLast ? 10 : 18,
                }}
              >
                <div className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 flex-shrink-0" strokeWidth={2} />
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] font-bold leading-none">{pct}%</span>
                    <span className="text-[8px] font-medium leading-tight whitespace-nowrap mt-0.5">
                      {step.short}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )

          if (isActive && completion) {
            return (
              <Tooltip key={step.key}>
                <TooltipTrigger asChild>{seg}</TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold text-xs">{step.label}</p>
                  <p className="text-xs text-gray-400">By: {completion.completedBy}</p>
                  <p className="text-xs text-gray-400">{format(new Date(completion.completedAt), 'MMM d, yyyy h:mm a')}</p>
                </TooltipContent>
              </Tooltip>
            )
          }
          return <div key={step.key}>{seg}</div>
        })}
      </div>
    </TooltipProvider>
  )
}

function exportCSV(orders: ProductionOrder[]) {
  const rows = [
    ['Order #', 'Customer', 'Side Mark', 'Products', 'Order Date', 'Installation Date', 'Shades', 'Status', 'Progress'],
    ...orders.map(o => [
      o.orderNumber,
      o.customerName,
      o.sideMark || '',
      (o.products || []).join(', '),
      format(new Date(o.orderDate), 'yyyy-MM-dd'),
      o.installationDate ? format(new Date(o.installationDate), 'yyyy-MM-dd') : '',
      String(o.totalShades),
      o.status,
      `${PIPELINE_PROGRESS[o.status] ?? 0}%`,
    ]),
  ]
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ProductionOrdersPage() {
  const { token } = useAuthStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [productFilter, setProductFilter] = useState<string>('ALL')
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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
      const mapped = (data.orders || [])
        .map((o: any) => ({
          ...o,
          orderDate: o.orderDate ? new Date(o.orderDate) : new Date(),
          installationDate: o.installationDate ? new Date(o.installationDate) : undefined,
          approvalDate: o.approvalDate ? new Date(o.approvalDate) : undefined,
          createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
          updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(),
          stageCompletions: (o.stageCompletions || []).map((sc: any) => ({
            ...sc,
            completedAt: sc.completedAt ? new Date(sc.completedAt) : new Date(),
          })),
        }))
        .filter((o: ProductionOrder) => o.status !== 'PENDING_APPROVAL')
      setOrders(mapped)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1) }, [search, statusFilter, productFilter])

  // Unique product list for filter
  const allProducts = useMemo(() => {
    const set = new Set<string>()
    orders.forEach(o => (o.products || []).forEach(p => set.add(p.split(' - ')[0].trim())))
    return Array.from(set).sort()
  }, [orders])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter(o => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false
      if (productFilter !== 'ALL' && !(o.products || []).some(p => p.split(' - ')[0].trim() === productFilter)) return false
      if (q) {
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          (o.sideMark || '').toLowerCase().includes(q) ||
          (o.products || []).some(p => p.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [orders, search, statusFilter, productFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const hasFilters = search !== '' || statusFilter !== 'ALL' || productFilter !== 'ALL'
  const clearFilters = () => { setSearch(''); setStatusFilter('ALL'); setProductFilter('ALL') }

  // Summary counts
  const counts = useMemo(() => ({
    total: orders.length,
    inProduction: orders.filter(o => !['SHIPPED_INSTALLED'].includes(o.status)).length,
    shipped: orders.filter(o => o.status === 'SHIPPED_INSTALLED').length,
    readyForProduction: orders.filter(o => o.status === 'READY_FOR_PRODUCTION').length,
  }), [orders])

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
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4 text-red-800 dark:text-red-200">
          <p className="font-medium">Error loading orders</p>
          <p className="text-sm mt-1">{error}</p>
          <Button variant="outline" className="mt-3" onClick={fetchOrders}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Orders List</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}{hasFilters ? ' matching filters' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV(filtered)}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary stat blocks */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Orders',          value: counts.total,              border: '#9CA3AF' },
          { label: 'In Production',          value: counts.inProduction,       border: '#F97316' },
          { label: 'Ready for Production',   value: counts.readyForProduction,  border: '#3B82F6' },
          { label: 'Shipped / Installed',    value: counts.shipped,            border: '#10B981' },
        ].map(({ label, value, border }) => (
          <div
            key={label}
            className="rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
            style={{ borderLeftWidth: 4, borderLeftColor: border }}
          >
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search order, customer, side mark…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-72"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {workflowSteps.map(s => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Products</SelectItem>
            {allProducts.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800/60">
              <TableHead className="w-28">Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Side Mark</TableHead>
              <TableHead>Product(s)</TableHead>
              <TableHead className="w-28">Order Date</TableHead>
              <TableHead className="w-28">Installation</TableHead>
              <TableHead className="w-16 text-center">Shades</TableHead>
              <TableHead className="w-24 text-center">Progress</TableHead>
              <TableHead>Production Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No orders found</p>
                  <p className="text-sm mt-1 text-gray-400">
                    {hasFilters ? 'Try adjusting your filters' : 'Orders appear here after approval'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((order) => (
                <TableRow key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <TableCell>
                    <Link
                      href={`/production/orders/${order._id}`}
                      className="font-mono text-sm font-semibold text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/production/orders/${order._id}`}
                      className="font-medium text-gray-900 dark:text-white hover:underline"
                    >
                      {order.customerName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {order.sideMark || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(order.products || []).map(p => (
                        <span
                          key={p}
                          className="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {p.split(' - ')[0].trim()}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {format(order.orderDate, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {order.installationDate ? format(order.installationDate, 'MMM dd, yyyy') : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {order.totalShades}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {PIPELINE_PROGRESS[order.status] ?? 0}%
                      </span>
                      <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-1.5 rounded-full bg-orange-500"
                          style={{ width: `${PIPELINE_PROGRESS[order.status] ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ArrowProgressBar order={order} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
