'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Input } from '@/components/ui/input'
import {
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  MoreHorizontal,
  Loader2,
  ArrowLeft,
  Package,
  Calendar,
  StickyNote,
  Layers,
} from 'lucide-react'
import type { ProductionOrder, ProductionOrderItem } from '@/types/production'
import { useAuthStore } from '@/stores/authStore'
import Link from 'next/link'
import { SHEET_TEMPLATES, autoSelectTemplate, detectProductFamily } from '@/lib/productionSheetTemplates'

interface ProductionSheetOption {
  id: string
  _id: string
  name: string
  productType: string
  operation: 'MANUAL' | 'MOTORIZED'
}

const MOTOR_TYPES = ['AC 110V', 'AC 12V', 'AC 24V', 'Battery', 'Solar', 'Wand Motor']
const REMOTE_TYPES = ['1-Channel', '5-Channel', '15-Channel', 'Zigbee', 'Wireless Wall Switch', 'None']
const REMOTE_NUMBERS = Array.from({ length: 20 }, (_, i) => String(i + 1))
const SMART_ACCESSORY_TYPES = ['Smart Hub', 'Solar Sensor', 'Wind Sensor', 'Rain Sensor', 'Timer']

const PIPELINE_STEPS = [
  { key: 'PENDING_APPROVAL',     label: 'Pending' },
  { key: 'READY_FOR_PRODUCTION', label: 'Ready' },
  { key: 'PRODUCTION_CHECK',     label: 'Check' },
  { key: 'COMPONENT_CUT',        label: 'Comp. Cut' },
  { key: 'FABRIC_CUT',           label: 'Fabric Cut' },
  { key: 'ASSEMBLE',             label: 'Assemble' },
  { key: 'QUALITY_CHECK',        label: 'QC' },
  { key: 'PACKING',              label: 'Packing' },
  { key: 'SHIPPED_INSTALLED',    label: 'Shipped' },
]

export default function PendingOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const orderId = params.id as string
  const [order, setOrder] = useState<ProductionOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [productionSheets, setProductionSheets] = useState<Record<string, string>>({})
  const [availableSheets, setAvailableSheets] = useState<ProductionSheetOption[]>([])
  const [itemEdits, setItemEdits] = useState<Record<string, Partial<ProductionOrderItem>>>({})
  const [approving, setApproving] = useState(false)

  const fetchProductionSheets = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/production-sheets', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setAvailableSheets((data.productionSheets || []).map((s: any) => ({ id: s.id, _id: s.id, name: s.name, productType: s.productType, operation: s.operation })))
      }
    } catch {
      // Fallback to empty - user can still approve without sheet assignment
    }
  }, [token])

  useEffect(() => {
    fetchProductionSheets()
  }, [fetchProductionSheets])

  const getBuiltInTemplatesForItem = (item: ProductionOrderItem) => {
    const family = detectProductFamily(item.product || '')
    return SHEET_TEMPLATES.filter(
      (t) =>
        t.productFamily === family &&
        (t.operation === item.operation ||
          (item.operation === 'MANUAL' && t.operation === 'CORDLESS'))
    )
  }

  const getSheetsForItem = (item: ProductionOrderItem) => {
    return availableSheets.filter(
      (sheet) =>
        sheet.operation === item.operation &&
        (sheet.productType === item.product || item.product?.toLowerCase().includes(sheet.productType.toLowerCase()) || sheet.productType.toLowerCase().includes(item.product?.toLowerCase() || ''))
    )
  }

  const fetchOrder = useCallback(async () => {
    if (!token || !orderId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load order')
      }
      const data = await res.json()
      const orderWithDates = {
        ...data.order,
        orderDate: data.order.orderDate ? new Date(data.order.orderDate) : new Date(),
        installationDate: data.order.installationDate ? new Date(data.order.installationDate) : undefined,
        approvalDate: data.order.approvalDate ? new Date(data.order.approvalDate) : undefined,
        createdAt: data.order.createdAt ? new Date(data.order.createdAt) : new Date(),
        updatedAt: data.order.updatedAt ? new Date(data.order.updatedAt) : new Date(),
        items: (data.order.items || []).map((item: any) => ({
          ...item,
          _id: item._id || item.lineNumber?.toString(),
        })),
      }
      setOrder(orderWithDates)
      const autoSheets: Record<string, string> = {}
      ;(orderWithDates.items || []).forEach((it: any) => {
        const key = autoSelectTemplate({ product: it.product || '', operation: it.operation || 'MANUAL', cassetteTypeColor: it.cassetteTypeColor })
        if (key) autoSheets[it._id] = key
      })
      ;(orderWithDates.items || []).forEach((it: any) => {
        if (it.productionSheetId) autoSheets[it._id] = it.productionSheetId
      })
      setProductionSheets(autoSheets)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load order')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [token, orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <Link href="/production/pending-approval" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Pending Approval
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-medium">Error loading order</p>
          <p className="text-sm mt-1">{error || 'Order not found'}</p>
        </div>
      </div>
    )
  }

  const toggleItemSelection = (itemId: string) => {
    const newSet = new Set(selectedItems)
    if (newSet.has(itemId)) newSet.delete(itemId)
    else newSet.add(itemId)
    setSelectedItems(newSet)
  }

  const getMergeMates = (itemId: string): number[] => {
    if (!order) return []
    const sheetId = productionSheets[itemId]
    if (!sheetId) return []
    const item = order.items.find((i) => i._id === itemId)
    if (!item) return []
    return order.items
      .filter(
        (other) =>
          other._id !== itemId &&
          productionSheets[other._id] === sheetId &&
          other.fabric === item.fabric &&
          other.operation === item.operation &&
          other.cassetteTypeColor === item.cassetteTypeColor &&
          other.bottomRail === item.bottomRail,
      )
      .map((other) => other.lineNumber)
  }

  const handleProductionSheetChange = (itemId: string, sheetId: string) => {
    setProductionSheets(prev => ({ ...prev, [itemId]: sheetId }))
    const item = order?.items.find(i => i._id === itemId)
    if (!item) return
    const selectedSheet = availableSheets.find(s => s._id === sheetId || s.id === sheetId)
    if (!selectedSheet) return
    order.items.forEach(otherItem => {
      if (otherItem._id === itemId) return
      if (productionSheets[otherItem._id] !== sheetId) return
    })
  }

  const handleApprove = async () => {
    if (!token || !order) return
    try {
      setApproving(true)
      const itemsWithSheets = order.items.map((item) => {
        const sheetId = productionSheets[item._id]
        const builtIn = SHEET_TEMPLATES.find((t) => t.key === sheetId)
        const dbSheet = availableSheets.find((s) => s.id === sheetId || s._id === sheetId)
        return {
          ...item,
          ...itemEdits[item._id],
          productionSheetId: sheetId || item.productionSheetId,
          productionSheetName: builtIn?.name || dbSheet?.name || item.productionSheetName,
        }
      })
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'READY_FOR_PRODUCTION', approvalDate: new Date().toISOString(), items: itemsWithSheets }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to approve order')
      }
      router.push('/production/orders')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve order')
    } finally {
      setApproving(false)
    }
  }

  const handleItemEdit = (itemId: string, field: keyof ProductionOrderItem, value: any) => {
    setItemEdits(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }))
  }

  const itemsWithSheets = order.items.filter(item => productionSheets[item._id] || item.productionSheetId).length
  const allSheetsAssigned = order.items.length > 0 && itemsWithSheets === order.items.length
  const activeStepIndex = PIPELINE_STEPS.findIndex(s => s.key === order.status)

  return (
    <div className="p-6">
      {/* Breadcrumb + page header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/production/pending-approval" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Pending Approval
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-900 dark:text-white">{order.orderNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-gray-400">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approving}
            className="gap-2 h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white"
          >
            {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {approving ? 'Approving…' : 'Approve Order'}
          </Button>
        </div>
      </div>

      {/* Hero card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
        {/* Amber accent bar */}
        <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-100" />

        {/* Title row */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900 dark:text-white text-base">{order.orderNumber}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Pending Approval
                </span>
                {allSheetsAssigned && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                    All sheets assigned
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{order.customerName}</p>
            </div>
          </div>

          {/* Sheets progress */}
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{itemsWithSheets} / {order.items.length}</p>
            <p className="text-[11px] text-gray-400">sheets assigned</p>
            <div className="mt-1.5 w-28 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden ml-auto">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${order.items.length > 0 ? (itemsWithSheets / order.items.length) * 100 : 0}%`,
                  background: allSheetsAssigned ? '#10b981' : '#f59e0b',
                }}
              />
            </div>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-5 divide-x divide-gray-100 dark:divide-gray-700">
          {[
            { label: 'Customer',       value: order.customerName },
            { label: 'Side Mark',      value: order.sideMark || '—' },
            { label: 'Order Date',     value: format(order.orderDate, 'MMM dd, yyyy') },
            {
              label: 'Installation',
              value: order.installationDate ? format(order.installationDate, 'MMM dd, yyyy') : 'Not set',
              muted: !order.installationDate,
            },
            { label: 'Total Shades',   value: String(order.totalShades) },
          ].map(({ label, value, muted }) => (
            <div key={label} className="px-5 py-3.5">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
              <p className={`text-sm font-semibold truncate ${muted ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Pipeline progress steps */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            {PIPELINE_STEPS.map((step, i) => {
              const isActive = i === activeStepIndex
              const isPast = i < activeStepIndex
              return (
                <div key={step.key} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full border-2 transition-colors ${
                        isActive  ? 'bg-amber-500 border-amber-500' :
                        isPast    ? 'bg-emerald-400 border-emerald-400' :
                                    'bg-white border-gray-300'
                      }`}
                    />
                    <span className={`text-[9px] leading-none hidden lg:block ${
                      isActive ? 'font-bold text-amber-600' :
                      isPast   ? 'text-emerald-600' :
                                 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className={`h-px flex-1 mx-1 ${isPast ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Line Items</h3>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{order.items.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedItems.size === order.items.length && order.items.length > 0}
              onCheckedChange={(checked) => {
                if (checked) setSelectedItems(new Set(order.items.map(i => i._id)))
                else setSelectedItems(new Set())
              }}
            />
            <span className="text-xs text-gray-400">Select all</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-50">
                <TableHead className="w-10 pl-4"></TableHead>
                <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">#</TableHead>
                <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">QTY</TableHead>
                <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Area</TableHead>
                <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Mount</TableHead>
                <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">W&quot;</TableHead>
                <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">L&quot;</TableHead>
                <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Product</TableHead>
                <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Collection</TableHead>
                <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Fabric</TableHead>
                <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Cassette</TableHead>
                <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Bottom R.</TableHead>
                <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Side Ch.</TableHead>
                <TableHead className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Operation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, index) => {
                const editedItem = { ...item, ...itemEdits[item._id] }
                const isSelected = selectedItems.has(item._id)
                const rowBg = index % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/30'

                return (
                  <>
                    {/* Main item row */}
                    <TableRow key={item._id} className={`${rowBg} ${isSelected ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''} border-t border-gray-100 dark:border-gray-700`}>
                      <TableCell className="pl-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleItemSelection(item._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                          {item.lineNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-14 h-7 text-xs px-1.5 border-gray-200" value={editedItem.qty ?? ''} onChange={(e) => handleItemEdit(item._id, 'qty', Number(e.target.value))} />
                      </TableCell>
                      <TableCell>
                        <Input className="w-24 h-7 text-xs px-1.5 border-gray-200" value={editedItem.area ?? ''} onChange={(e) => handleItemEdit(item._id, 'area', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="w-20 h-7 text-xs px-1.5 border-gray-200" value={editedItem.mount ?? ''} onChange={(e) => handleItemEdit(item._id, 'mount', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="w-16 h-7 text-xs px-1.5 border-gray-200" value={editedItem.width ?? ''} onChange={(e) => handleItemEdit(item._id, 'width', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="w-16 h-7 text-xs px-1.5 border-gray-200" value={editedItem.length ?? ''} onChange={(e) => handleItemEdit(item._id, 'length', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="w-24 h-7 text-xs px-1.5 border-gray-200" value={editedItem.product ?? ''} onChange={(e) => handleItemEdit(item._id, 'product', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="w-28 h-7 text-xs px-1.5 border-gray-200" value={editedItem.collection ?? ''} onChange={(e) => handleItemEdit(item._id, 'collection', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="w-32 h-7 text-xs px-1.5 border-gray-200" value={editedItem.fabric ?? ''} onChange={(e) => handleItemEdit(item._id, 'fabric', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="w-28 h-7 text-xs px-1.5 border-gray-200" value={editedItem.cassetteTypeColor ?? ''} onChange={(e) => handleItemEdit(item._id, 'cassetteTypeColor', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="w-24 h-7 text-xs px-1.5 border-gray-200" value={editedItem.bottomRail ?? ''} onChange={(e) => handleItemEdit(item._id, 'bottomRail', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input className="w-24 h-7 text-xs px-1.5 border-gray-200" value={editedItem.sideChain ?? ''} onChange={(e) => handleItemEdit(item._id, 'sideChain', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Select value={editedItem.operation || 'MANUAL'} onValueChange={(value) => handleItemEdit(item._id, 'operation', value)}>
                          <SelectTrigger className="w-28 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MANUAL">MANUAL</SelectItem>
                            <SelectItem value="MOTORIZED">MOTORIZED</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>

                    {/* Motorized sub-row */}
                    {editedItem.operation === 'MOTORIZED' && (
                      <TableRow className="bg-blue-50/40 dark:bg-blue-900/10">
                        <TableCell colSpan={2} className="pl-4">
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Motor</span>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{editedItem.motor || '—'}</TableCell>
                        <TableCell>
                          <Select value={editedItem.motorType || ''} onValueChange={(value) => handleItemEdit(item._id, 'motorType', value)}>
                            <SelectTrigger className="w-32 h-7 text-xs"><SelectValue placeholder="Motor type" /></SelectTrigger>
                            <SelectContent>{MOTOR_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={editedItem.remoteControl || ''} onValueChange={(value) => handleItemEdit(item._id, 'remoteControl', value)}>
                            <SelectTrigger className="w-32 h-7 text-xs"><SelectValue placeholder="Remote" /></SelectTrigger>
                            <SelectContent>{REMOTE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={editedItem.remoteNumber || ''} onValueChange={(value) => handleItemEdit(item._id, 'remoteNumber', value)}>
                            <SelectTrigger className="w-24 h-7 text-xs"><SelectValue placeholder="Remote #" /></SelectTrigger>
                            <SelectContent>{REMOTE_NUMBERS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{editedItem.channelNumber || '—'}</TableCell>
                        <TableCell className="text-xs text-gray-500">{editedItem.accessories || '—'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="text-xs text-gray-500">{editedItem.smartAccessories || '—'}</span>
                            {editedItem.smartAccessories && (
                              <Select value={editedItem.smartAccessoriesType || ''} onValueChange={(value) => handleItemEdit(item._id, 'smartAccessoriesType', value)}>
                                <SelectTrigger className="w-32 h-7 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent>{SMART_ACCESSORY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{editedItem.brackets || '—'}</TableCell>
                        <TableCell colSpan={4} />
                      </TableRow>
                    )}

                    {/* Manual sub-row */}
                    {editedItem.operation === 'MANUAL' && (
                      <TableRow className="bg-gray-50/60 dark:bg-gray-700/20">
                        <TableCell colSpan={2} className="pl-4">
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Cord/Chain</span>
                        </TableCell>
                        <TableCell>
                          <Select value={editedItem.cordChain || ''} onValueChange={(value) => handleItemEdit(item._id, 'cordChain', value)}>
                            <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cord">Cord</SelectItem>
                              <SelectItem value="chain">Chain</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={editedItem.cordChainColor || ''} onValueChange={(value) => handleItemEdit(item._id, 'cordChainColor', value)}>
                            <SelectTrigger className="w-28 h-7 text-xs"><SelectValue placeholder="Color" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="white">White</SelectItem>
                              <SelectItem value="black">Black</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell colSpan={10} />
                      </TableRow>
                    )}

                    {/* Production sheet row */}
                    <TableRow className="bg-amber-50/70 dark:bg-amber-900/10 border-b-2 border-amber-100 dark:border-amber-900/30">
                      <TableCell colSpan={14} className="py-2.5 px-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Production Sheet</span>
                          </div>
                          <Select
                            value={productionSheets[item._id] || ''}
                            onValueChange={(value) => handleProductionSheetChange(item._id, value)}
                          >
                            <SelectTrigger className="w-60 h-7 text-xs border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-800">
                              <SelectValue placeholder="Select production sheet" />
                            </SelectTrigger>
                            <SelectContent>
                              {getBuiltInTemplatesForItem(item).map((t) => (
                                <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>
                              ))}
                              {getSheetsForItem(item).map((sheet) => (
                                <SelectItem key={sheet.id} value={sheet.id}>{sheet.name}</SelectItem>
                              ))}
                              {getBuiltInTemplatesForItem(item).length === 0 && getSheetsForItem(item).length === 0 && (
                                <div className="px-3 py-2 text-xs text-muted-foreground">No sheets for this product + operation</div>
                              )}
                            </SelectContent>
                          </Select>
                          {(() => {
                            const mergeMates = getMergeMates(item._id)
                            if (mergeMates.length === 0) return null
                            return (
                              <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-full">
                                Merges with line{mergeMates.length > 1 ? 's' : ''} #{mergeMates.join(', #')}
                              </span>
                            )
                          })()}
                          {productionSheets[item._id] && (
                            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Assigned
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  </>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Images */}
      {order.images && order.images.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
            <ImageIcon className="h-4 w-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Images</h3>
          </div>
          <div className="p-5 grid grid-cols-3 gap-4">
            {order.images.map((img, idx) => {
              const url = typeof img === 'string' ? img : img.url
              return (
                <div key={idx} className="relative aspect-video rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <img src={url} alt={`Image ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
          <StickyNote className="h-4 w-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notes</h3>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {order.notes || 'No notes available for this order.'}
          </p>
        </div>
      </div>
    </div>
  )
}
