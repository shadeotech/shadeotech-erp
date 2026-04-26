'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Loader2, ChevronDown, ChevronRight, ShoppingCart, Package } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import type { PurchaseOrder, PurchaseOrderItem } from '@/types/production'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PARTIALLY_RECEIVED: 'Partially Received',
  FULLY_RECEIVED: 'Fully Received',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  PARTIALLY_RECEIVED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  FULLY_RECEIVED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

const ITEM_TYPES = ['Fabric', 'Cassette', 'Component', 'Option', 'Other']

interface ReceiveLineState {
  lineIndex: number
  qtyReceived: number
  fullyReceived: boolean
  forceClosed: boolean
}

export default function PurchaseOrdersPage() {
  const { token } = useAuthStore()
  const { toast } = useToast()

  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'to-be-sent' | 'material-received'>('to-be-sent')
  const [activeView, setActiveView] = useState<'supplier' | 'detailed'>('supplier')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Add PO dialog
  const [addOpen, setAddOpen] = useState(false)
  const [newPo, setNewPo] = useState({
    supplier: '',
    orderDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })
  const [newPoItems, setNewPoItems] = useState<Partial<PurchaseOrderItem>[]>([
    { itemType: 'Component', itemName: '', itemCode: '', unitType: 'Each', qtyOrdered: 1 },
  ])

  // Receive dialog
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [receivingPo, setReceivingPo] = useState<PurchaseOrder | null>(null)
  const [receiveLines, setReceiveLines] = useState<ReceiveLineState[]>([])
  const [receiveInvoiceDate, setReceiveInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [receiveInvoiceNo, setReceiveInvoiceNo] = useState('')
  const [receiveUser, setReceiveUser] = useState('')
  const [receiveNotes, setReceiveNotes] = useState('')

  const fetchOrders = useCallback(async () => {
    if (!token) { setLoading(false); return }
    setLoading(true)
    try {
      const res = await fetch('/api/inventory/purchase-orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.purchaseOrders || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'to-be-sent') return o.status === 'DRAFT' || o.status === 'SENT'
    return o.status === 'PARTIALLY_RECEIVED' || o.status === 'FULLY_RECEIVED'
  })

  const handleAddPo = async () => {
    if (!token || !newPo.supplier.trim()) {
      toast({ title: 'Supplier is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/inventory/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newPo, items: newPoItems }),
      })
      if (!res.ok) throw new Error('Failed to create purchase order')
      setAddOpen(false)
      setNewPo({ supplier: '', orderDate: format(new Date(), 'yyyy-MM-dd'), notes: '' })
      setNewPoItems([{ itemType: 'Component', itemName: '', itemCode: '', unitType: 'Each', qtyOrdered: 1 }])
      await fetchOrders()
      toast({ title: 'Purchase order created' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to create', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSendPo = async (po: PurchaseOrder) => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch(`/api/inventory/purchase-orders/${po._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'SENT' }),
      })
      if (!res.ok) throw new Error('Failed to update')
      await fetchOrders()
      toast({ title: 'Purchase order sent' })
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePo = async (id: string) => {
    if (!token) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/inventory/purchase-orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchOrders()
      toast({ title: 'Purchase order deleted' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const openReceiveDialog = (po: PurchaseOrder) => {
    setReceivingPo(po)
    setReceiveLines(po.items.map((_, idx) => ({
      lineIndex: idx,
      qtyReceived: po.items[idx].qtyReceived || 0,
      fullyReceived: po.items[idx].fullyReceived || false,
      forceClosed: po.items[idx].forceClosed || false,
    })))
    setReceiveInvoiceDate(format(new Date(), 'yyyy-MM-dd'))
    setReceiveInvoiceNo('')
    setReceiveUser('')
    setReceiveNotes('')
    setReceiveOpen(true)
  }

  const handleReceive = async () => {
    if (!token || !receivingPo) return
    if (!receiveInvoiceNo.trim()) {
      toast({ title: 'Invoice No is required', variant: 'destructive' })
      return
    }
    if (!receiveUser.trim()) {
      toast({ title: 'User Received is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/inventory/purchase-orders/${receivingPo._id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: receiveLines,
          invoiceDate: receiveInvoiceDate,
          invoiceNo: receiveInvoiceNo,
          receivedBy: receiveUser,
          notes: receiveNotes,
        }),
      })
      if (!res.ok) throw new Error('Failed to receive')
      setReceiveOpen(false)
      await fetchOrders()
      toast({ title: 'Stock updated', description: 'Inventory quantities have been incremented.' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to receive', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const receivedRatio = (po: PurchaseOrder) => {
    const total = po.items.reduce((s, i) => s + i.qtyOrdered, 0)
    const received = po.items.reduce((s, i) => s + i.qtyReceived, 0)
    return `${received.toFixed(2)} / ${total.toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Purchase Orders</h2>
          <p className="text-sm text-muted-foreground">Manage supplier purchase orders and stock receiving</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'to-be-sent' && filteredOrders.some(o => o.status === 'SENT') && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                const sent = filteredOrders.find(o => o.status === 'SENT')
                if (sent) openReceiveDialog(sent)
              }}
            >
              <Package className="h-4 w-4" />
              Receive
            </Button>
          )}
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add New Purchase
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Left sidebar */}
        <div className="w-48 flex-shrink-0 space-y-1">
          <button
            onClick={() => setActiveTab('to-be-sent')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'to-be-sent'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Purchase
          </button>
          <button
            onClick={() => setActiveTab('material-received')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'material-received'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Package className="h-4 w-4" />
            Order Received
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {/* Sub-tabs */}
          <div className="flex gap-1 border-b dark:border-gray-700">
            {(['supplier', 'detailed'] as const).map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeView === view
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {view === 'supplier' ? 'Supplier View' : 'Detailed View'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No purchase orders found.{' '}
                {activeTab === 'to-be-sent' && (
                  <button className="text-primary underline" onClick={() => setAddOpen(true)}>
                    Create one
                  </button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                {activeView === 'supplier' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Reference No</TableHead>
                        <TableHead>Supplier Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Ratio of Received Item</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map(po => (
                        <>
                          <TableRow key={po._id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === po._id ? null : po._id)}>
                            <TableCell>
                              {expandedId === po._id
                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell className="font-medium">{po.poNumber}</TableCell>
                            <TableCell>{po.supplier}</TableCell>
                            <TableCell>{po.orderDate ? format(new Date(po.orderDate), 'dd-MM-yyyy') : '—'}</TableCell>
                            <TableCell>{receivedRatio(po)}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[po.status]}`}>
                                {STATUS_LABELS[po.status]}
                              </span>
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                {po.status === 'DRAFT' && (
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleSendPo(po)} disabled={saving}>
                                    Send
                                  </Button>
                                )}
                                {(po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED') && (
                                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openReceiveDialog(po)}>
                                    Receive
                                  </Button>
                                )}
                                {po.status === 'DRAFT' && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeletePo(po._id)} disabled={deletingId === po._id}>
                                    {deletingId === po._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedId === po._id && (
                            <TableRow key={`${po._id}-expanded`}>
                              <TableCell colSpan={7} className="p-0 bg-gray-50 dark:bg-gray-900">
                                <div className="px-8 py-3">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-xs">Item Type</TableHead>
                                        <TableHead className="text-xs">Item Name</TableHead>
                                        <TableHead className="text-xs">Item Code</TableHead>
                                        <TableHead className="text-xs">Unit Type</TableHead>
                                        <TableHead className="text-xs">Qty to Order</TableHead>
                                        <TableHead className="text-xs">Received Qty</TableHead>
                                        <TableHead className="text-xs">Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {po.items.map((item, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell className="text-xs">{item.itemType}</TableCell>
                                          <TableCell className="text-xs font-medium">{item.itemName}</TableCell>
                                          <TableCell className="text-xs text-muted-foreground">{item.itemCode || '—'}</TableCell>
                                          <TableCell className="text-xs">{item.unitType}</TableCell>
                                          <TableCell className="text-xs">{item.qtyOrdered.toFixed(2)}</TableCell>
                                          <TableCell className="text-xs">{item.qtyReceived.toFixed(2)}</TableCell>
                                          <TableCell className="text-xs">
                                            {item.fullyReceived
                                              ? <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Received</Badge>
                                              : item.forceClosed
                                              ? <Badge className="text-[10px] bg-gray-100 text-gray-600">Closed</Badge>
                                              : <Badge className="text-[10px] bg-blue-100 text-blue-700">Order Placed</Badge>}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                  {po.notes && (
                                    <p className="text-xs text-muted-foreground mt-2 px-1">Notes: {po.notes}</p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {activeView === 'detailed' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO #</TableHead>
                        <TableHead>Item Type</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Qty to Order</TableHead>
                        <TableHead>Received Qty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Invoice</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.flatMap(po =>
                        po.items.map((item, idx) => (
                          <TableRow key={`${po._id}-${idx}`}>
                            <TableCell className="font-medium text-sm">{po.poNumber}</TableCell>
                            <TableCell className="text-sm">{item.itemType}</TableCell>
                            <TableCell className="text-sm">{item.itemName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.itemCode || '—'}</TableCell>
                            <TableCell className="text-sm">{item.unitType}</TableCell>
                            <TableCell className="text-sm">{item.qtyOrdered.toFixed(2)}</TableCell>
                            <TableCell className="text-sm">{item.qtyReceived.toFixed(2)}</TableCell>
                            <TableCell>
                              {item.fullyReceived
                                ? <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Received</Badge>
                                : item.forceClosed
                                ? <Badge className="text-[10px] bg-gray-100 text-gray-600">Closed</Badge>
                                : <Badge className="text-[10px] bg-blue-100 text-blue-700">Order Placed</Badge>}
                            </TableCell>
                            <TableCell className="text-sm">
                              {item.invoiceNo
                                ? <span className="text-blue-600 dark:text-blue-400 text-xs">{item.invoiceNo}</span>
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add New Purchase Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Supplier *</Label>
                <Input
                  value={newPo.supplier}
                  onChange={(e) => setNewPo({ ...newPo, supplier: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <Label>Order Date</Label>
                <Input
                  type="date"
                  value={newPo.orderDate}
                  onChange={(e) => setNewPo({ ...newPo, orderDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={newPo.notes}
                onChange={(e) => setNewPo({ ...newPo, notes: e.target.value })}
                placeholder="Any additional notes"
                rows={2}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items</Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setNewPoItems([...newPoItems, { itemType: 'Component', itemName: '', itemCode: '', unitType: 'Each', qtyOrdered: 1 }])}
                >
                  <Plus className="h-3 w-3" />
                  Add Line
                </Button>
              </div>
              <div className="space-y-2">
                {newPoItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-6 gap-2 items-center">
                    <Select
                      value={item.itemType || 'Component'}
                      onValueChange={(v) => {
                        const updated = [...newPoItems]
                        updated[idx] = { ...updated[idx], itemType: v }
                        setNewPoItems(updated)
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      className="col-span-2 h-8 text-xs"
                      placeholder="Item Name *"
                      value={item.itemName || ''}
                      onChange={(e) => {
                        const updated = [...newPoItems]
                        updated[idx] = { ...updated[idx], itemName: e.target.value }
                        setNewPoItems(updated)
                      }}
                    />
                    <Input
                      className="h-8 text-xs"
                      placeholder="Code"
                      value={item.itemCode || ''}
                      onChange={(e) => {
                        const updated = [...newPoItems]
                        updated[idx] = { ...updated[idx], itemCode: e.target.value }
                        setNewPoItems(updated)
                      }}
                    />
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      placeholder="Qty"
                      value={item.qtyOrdered || ''}
                      onChange={(e) => {
                        const updated = [...newPoItems]
                        updated[idx] = { ...updated[idx], qtyOrdered: Number(e.target.value) || 1 }
                        setNewPoItems(updated)
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setNewPoItems(newPoItems.filter((_, i) => i !== idx))}
                      disabled={newPoItems.length === 1}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPo} disabled={saving || !newPo.supplier.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Received Detail — {receivingPo?.poNumber}</DialogTitle>
          </DialogHeader>
          {receivingPo && (
            <div className="space-y-4">
              {/* Items table */}
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Item Type</TableHead>
                      <TableHead className="text-xs">Item Name</TableHead>
                      <TableHead className="text-xs">Unit Type</TableHead>
                      <TableHead className="text-xs">Ordered</TableHead>
                      <TableHead className="text-xs">Received</TableHead>
                      <TableHead className="text-xs">Outstanding</TableHead>
                      <TableHead className="text-xs">Fully Received</TableHead>
                      <TableHead className="text-xs">Qty Received</TableHead>
                      <TableHead className="text-xs">Force Close</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivingPo.items.map((item, idx) => {
                      const line = receiveLines[idx]
                      if (!line) return null
                      const outstanding = item.qtyOrdered - item.qtyReceived
                      return (
                        <TableRow key={idx}>
                          <TableCell className="text-xs">{item.itemType}</TableCell>
                          <TableCell className="text-xs font-medium">{item.itemName}</TableCell>
                          <TableCell className="text-xs">{item.unitType}</TableCell>
                          <TableCell className="text-xs">{item.qtyOrdered.toFixed(2)}</TableCell>
                          <TableCell className="text-xs">{item.qtyReceived.toFixed(2)}</TableCell>
                          <TableCell className="text-xs">{outstanding.toFixed(2)}</TableCell>
                          <TableCell>
                            <Select
                              value={line.fullyReceived ? 'Yes' : 'No'}
                              onValueChange={(v) => {
                                const updated = [...receiveLines]
                                updated[idx] = { ...updated[idx], fullyReceived: v === 'Yes' }
                                setReceiveLines(updated)
                              }}
                            >
                              <SelectTrigger className="h-7 w-20 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Yes">Yes</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={line.qtyReceived || ''}
                              onChange={(e) => {
                                const updated = [...receiveLines]
                                updated[idx] = { ...updated[idx], qtyReceived: Number(e.target.value) || 0 }
                                setReceiveLines(updated)
                              }}
                              className="h-7 w-20 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={line.forceClosed}
                              onChange={(e) => {
                                const updated = [...receiveLines]
                                updated[idx] = { ...updated[idx], forceClosed: e.target.checked }
                                setReceiveLines(updated)
                              }}
                              className="h-4 w-4"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Footer form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={receiveInvoiceDate}
                    onChange={(e) => setReceiveInvoiceDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Invoice No *</Label>
                  <Input
                    value={receiveInvoiceNo}
                    onChange={(e) => setReceiveInvoiceNo(e.target.value)}
                    placeholder="Invoice number"
                  />
                </div>
                <div>
                  <Label>User Received *</Label>
                  <Input
                    value={receiveUser}
                    onChange={(e) => setReceiveUser(e.target.value)}
                    placeholder="Name of person receiving"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={receiveNotes}
                    onChange={(e) => setReceiveNotes(e.target.value)}
                    placeholder="Optional notes"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Attach Invoice File (optional)</Label>
                  <Input type="file" accept=".png,.jpg,.jpeg,.pdf,.xls,.xlsx" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>Cancel</Button>
            <Button onClick={handleReceive} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
