'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, CheckCircle2, ScanLine } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import type { ProductionStatus, ProductionOrder, ProductionOrderItem } from '@/types/production'

const BarcodeComponent = dynamic(() => import('react-barcode'), { ssr: false })

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

const workflowSteps: ProductionStatus[] = [
  'READY_FOR_PRODUCTION',
  'PRODUCTION_CHECK',
  'COMPONENT_CUT',
  'FABRIC_CUT',
  'ASSEMBLE',
  'QUALITY_CHECK',
  'PACKING',
  'SHIPPED_INSTALLED',
]

const stageGroups = [
  { label: 'Office Check', stages: ['READY_FOR_PRODUCTION', 'PRODUCTION_CHECK'] as ProductionStatus[] },
  { label: 'Cutting Table', stages: ['COMPONENT_CUT', 'FABRIC_CUT'] as ProductionStatus[] },
  { label: 'Assemble Station', stages: ['ASSEMBLE', 'QUALITY_CHECK'] as ProductionStatus[] },
  { label: 'Dispatch Station', stages: ['PACKING', 'SHIPPED_INSTALLED'] as ProductionStatus[] },
]

interface FlatItem {
  orderId: string
  orderNumber: string
  orderStatus: ProductionStatus
  installationDate?: Date
  stageCompletions: any[]
  activity: any[]
  itemIndex: number
  totalItems: number
  item: ProductionOrderItem
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getBarcodeValue(fi: FlatItem): string {
  const orderNum = fi.orderNumber.replace(/-/g, '')
  const lineNum = String(fi.item.lineNumber || fi.itemIndex + 1).padStart(4, '0')
  return `${orderNum}${lineNum}`
}

export default function ProductionWorkshopPage() {
  const { token } = useAuthStore()
  const { toast } = useToast()

  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [stageFilter, setStageFilter] = useState<ProductionStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [activeTab, setActiveTab] = useState<'manufacturing' | 'activities'>('manufacturing')
  const [saving, setSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const active = (data.orders || [])
        .filter((o: any) => workflowSteps.includes(o.status))
        .map((o: any) => ({
          ...o,
          orderDate: new Date(o.orderDate),
          installationDate: o.installationDate ? new Date(o.installationDate) : undefined,
          approvalDate: o.approvalDate ? new Date(o.approvalDate) : undefined,
          stageCompletions: o.stageCompletions || [],
          activity: o.activity || [],
          items: (o.items || []).map((item: any, idx: number) => ({
            ...item,
            _id: item._id || String(idx + 1),
          })),
        }))
      setOrders(active)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Session timer — resets on new selection
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (selectedKey) {
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [selectedKey])

  // Flatten all order items
  const flatItems: FlatItem[] = orders.flatMap((order) =>
    (order.items || []).map((item, idx) => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      installationDate: (order as any).installationDate,
      stageCompletions: (order.stageCompletions || []) as any[],
      activity: (order.activity || []) as any[],
      itemIndex: idx,
      totalItems: order.items.length,
      item,
    }))
  )

  const filteredItems = flatItems.filter((fi) => {
    if (stageFilter !== 'ALL' && fi.orderStatus !== stageFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        fi.orderNumber.toLowerCase().includes(q) ||
        fi.item.area?.toLowerCase().includes(q) ||
        fi.item.product?.toLowerCase().includes(q) ||
        fi.item.fabric?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const selectedFlat = selectedKey
    ? filteredItems.find((fi) => `${fi.orderId}-${fi.itemIndex}` === selectedKey) ?? null
    : null
  const selectedOrder = selectedFlat ? orders.find(o => o._id === selectedFlat.orderId) ?? null : null
  const selectedItem: ProductionOrderItem | null = selectedFlat?.item ?? null

  const isOverdue = (fi: FlatItem) =>
    fi.installationDate && fi.installationDate < new Date() && fi.orderStatus !== 'SHIPPED_INSTALLED'

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !barcodeInput.trim()) return
    const scanned = barcodeInput.trim()
    const match = flatItems.find((fi) => getBarcodeValue(fi) === scanned)
    if (match) {
      const key = `${match.orderId}-${match.itemIndex}`
      setSelectedKey(key)
      toast({ title: 'Item found', description: `${match.orderNumber} — Item ${match.itemIndex + 1}` })
    } else {
      toast({ title: 'Not found', description: 'No item matches this barcode.', variant: 'destructive' })
    }
    setBarcodeInput('')
  }

  const handleMarkCompleted = async () => {
    if (!selectedFlat || !selectedOrder || saving) return
    const currentIdx = workflowSteps.findIndex(s => s === selectedOrder.status)
    if (currentIdx === -1 || currentIdx >= workflowSteps.length - 1) {
      toast({ title: 'Already complete', description: 'This order is at the final stage.' })
      return
    }
    const nextStatus = workflowSteps[currentIdx + 1]
    const authUser = useAuthStore.getState().user
    const userName = authUser ? `${authUser.firstName} ${authUser.lastName}` : 'User'
    const existing = (selectedOrder.stageCompletions || []) as any[]
    const newCompletions = [...existing]
    const targetIdx = workflowSteps.findIndex(s => s === nextStatus)
    for (let i = 0; i <= targetIdx; i++) {
      const s = workflowSteps[i]
      if (!newCompletions.find((c: any) => c.status === s)) {
        newCompletions.push({ status: s, completedBy: userName, completedAt: new Date().toISOString() })
      }
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus, stageCompletions: newCompletions }),
      })
      if (!res.ok) throw new Error('Failed')
      await fetchOrders()
      toast({ title: 'Stage completed', description: `→ ${statusLabels[nextStatus]}` })
    } catch {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const completedStatuses = new Set(
    ((selectedOrder?.stageCompletions || []) as any[]).map((sc: any) => sc.status as ProductionStatus)
  )

  const getCompletionInfo = (status: ProductionStatus) =>
    ((selectedOrder?.stageCompletions || []) as any[]).find((s: any) => s.status === status) ?? null

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Workshop</h2>
          <p className="text-xs text-muted-foreground">Barcode scanning and checkpoint tracking</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel ── */}
        <div className="w-72 flex-shrink-0 border-r dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900">
          {/* Stage filter */}
          <div className="p-3 border-b dark:border-gray-700">
            <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as ProductionStatus | 'ALL')}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Stages</SelectItem>
                {workflowSteps.map(s => (
                  <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + elapsed timer bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-cyan-500 text-white text-xs font-medium flex-shrink-0">
            <span>{format(new Date(), 'EEE, dd MMM yyyy')}</span>
            {selectedKey && (
              <span className="bg-green-600 rounded px-1.5 py-0.5 font-mono text-[11px]">
                {formatElapsed(elapsedSeconds)}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="p-3 border-b dark:border-gray-700">
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10 px-3">
                No items in production.
              </p>
            ) : (
              filteredItems.map((fi) => {
                const key = `${fi.orderId}-${fi.itemIndex}`
                const overdue = isOverdue(fi)
                const isSelected = selectedKey === key
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedKey(isSelected ? null : key)}
                    className={`cursor-pointer px-3 py-2.5 border-b dark:border-gray-800 text-xs transition-colors ${
                      isSelected
                        ? 'border-l-4 border-l-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                        : 'border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-semibold text-gray-900 dark:text-white">{fi.orderNumber}</span>
                      {fi.installationDate && (
                        <span className="text-gray-400 text-[10px]">
                          📅 {format(fi.installationDate, 'dd-MM-yyyy')}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 truncate">
                      {fi.item.lineNumber || fi.itemIndex + 1}-({fi.itemIndex + 1}/{fi.totalItems}) {fi.item.area} — {fi.item.product}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-gray-500">{fi.item.qty} · {fi.item.product}</span>
                      {overdue && (
                        <Badge variant="destructive" className="text-[10px] h-4 px-1">Overdue</Badge>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Center Panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
          {selectedFlat && selectedItem && selectedOrder ? (
            <>
              {/* Barcode + scan bar */}
              <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 px-6 py-4 flex-shrink-0">
                <p className="text-xs text-center text-muted-foreground mb-4">
                  complete the process by either scanning the barcode or clicking &apos;mark as completed&apos;
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <Input
                    placeholder="Scan Barcode"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    className="w-36 h-8 text-xs"
                  />
                  <div className="flex flex-col items-center">
                    <BarcodeComponent
                      value={getBarcodeValue(selectedFlat)}
                      width={1.2}
                      height={48}
                      fontSize={11}
                      margin={0}
                    />
                    <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {getBarcodeValue(selectedFlat)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">or</span>
                  <Button
                    onClick={handleMarkCompleted}
                    disabled={saving || selectedOrder.status === 'SHIPPED_INSTALLED'}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2 h-8 text-xs"
                  >
                    {saving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    Mark as Completed
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
                {(['manufacturing', 'activities'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${
                      activeTab === tab
                        ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                        : 'border-transparent text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'manufacturing' ? (
                  <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 overflow-hidden">
                    {/* Item header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {selectedOrder.orderNumber} &nbsp;
                        {selectedFlat.itemIndex + 1}-{selectedFlat.itemIndex + 1}/{selectedFlat.totalItems} {selectedItem.product}
                      </span>
                      {selectedOrder.installationDate && (
                        <span className="text-xs text-muted-foreground">
                          {format((selectedOrder as any).installationDate, 'dd-MM-yyyy')}
                        </span>
                      )}
                    </div>

                    {/* Key-value grid */}
                    <div className="divide-y dark:divide-gray-700">
                      {[
                        ['Unit Type', 'mm'],
                        ['Quantity', String(selectedItem.qty || 1)],
                        ['Measure To', selectedItem.mount || '—'],
                        ['Control Type', selectedItem.operation || '—'],
                        ['Fabric', selectedItem.fabric || '—'],
                        ['Collection', selectedItem.collection || '—'],
                        ['Cassette Type/Color', selectedItem.cassetteTypeColor || '—'],
                        ['Bottom Rail', selectedItem.bottomRail || '—'],
                        ['Side Chain', selectedItem.sideChain || '—'],
                        ['Brackets', selectedItem.brackets || '—'],
                      ].map(([label, value], i) => (
                        <div key={label} className={`flex items-center px-4 py-2.5 ${i % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                          <span className="text-xs text-muted-foreground w-40 flex-shrink-0">{label}</span>
                          <span className="text-xs text-gray-900 dark:text-white font-medium">{value}</span>
                        </div>
                      ))}

                      {selectedItem.operation === 'MOTORIZED' && (
                        <>
                          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20">
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Motorized</span>
                          </div>
                          {[
                            ['Motor', selectedItem.motor || '—'],
                            ['Motor Type', selectedItem.motorType || '—'],
                            ['Motor Accessories', selectedItem.smartAccessories || '—'],
                            ['Smart Hub Type', selectedItem.smartAccessoriesType || '—'],
                            ['Remote Control', selectedItem.remoteControl || '—'],
                            ['Remote No.', selectedItem.remoteNumber || '—'],
                            ['Channel #', selectedItem.channelNumber || '—'],
                            ['Accessories', selectedItem.accessories || '—'],
                          ].map(([label, value], i) => (
                            <div key={label} className={`flex items-center px-4 py-2.5 ${i % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                              <span className="text-xs text-muted-foreground w-40 flex-shrink-0">{label}</span>
                              <span className="text-xs text-gray-900 dark:text-white font-medium">{value}</span>
                            </div>
                          ))}
                        </>
                      )}

                      {selectedItem.operation === 'MANUAL' && (
                        <>
                          <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20">
                            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Manual</span>
                          </div>
                          {[
                            ['Cord/Chain', selectedItem.cordChain || '—'],
                            ['Cord/Chain Color', selectedItem.cordChainColor || '—'],
                          ].map(([label, value], i) => (
                            <div key={label} className={`flex items-center px-4 py-2.5 ${i % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                              <span className="text-xs text-muted-foreground w-40 flex-shrink-0">{label}</span>
                              <span className="text-xs text-gray-900 dark:text-white font-medium">{value}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Activities tab */
                  <div className="space-y-3">
                    {selectedFlat.activity.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-10">No activity yet.</p>
                    ) : (
                      [...selectedFlat.activity].reverse().map((log: any, idx) => (
                        <div key={log._id || idx} className="flex items-start gap-3 pb-3 border-b dark:border-gray-700 last:border-0">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-white">
                              <span className="text-blue-600 dark:text-blue-400">{log.userName || log.user}</span>
                              {' — '}{log.action}
                            </p>
                            {log.details && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">{log.details}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ScanLine className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Select an item to begin</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose from the list or scan a barcode
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel — Scan History ── */}
        <div className="w-56 flex-shrink-0 border-l dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900 overflow-y-auto">
          <div className="px-4 py-3 border-b dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Scan History</h3>
          </div>
          <div className="flex-1 p-4 space-y-5">
            {stageGroups.map((group) => {
              const groupDone = group.stages.some(s => completedStatuses.has(s))
              return (
                <div key={group.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-base leading-none ${groupDone ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-300 dark:text-gray-600'}`}>
                      {groupDone ? '●' : '○'}
                    </span>
                    <span className={`text-xs font-semibold ${groupDone ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                      {group.label}
                    </span>
                  </div>
                  <div className="ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-2.5">
                    {group.stages.map((status) => {
                      const completion = getCompletionInfo(status)
                      const done = completedStatuses.has(status)
                      return (
                        <div key={status}>
                          <p className={`text-xs font-medium ${done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                            {statusLabels[status]}
                          </p>
                          {completion && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                              {completion.completedBy}
                              {completion.completedAt && (
                                <> · {new Date(completion.completedAt).toLocaleDateString()}</>
                              )}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
