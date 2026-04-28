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
import { Plus, Trash2, Loader2, ChevronDown, ChevronRight, ShoppingCart, Package, ClipboardList } from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState<'to-be-sent' | 'material-received' | 'item-receipt'>('to-be-sent')

  // Item Receipt state
  const [itemReceiptOpen, setItemReceiptOpen] = useState(false)
  const [itemReceipt, setItemReceipt] = useState({
    vendor: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    receiptNo: '1001',
    memo: '',
  })
  const [itemReceiptLines, setItemReceiptLines] = useState([
    { product: '', sku: '', rate: '', qtyReceived: '' },
    { product: '', sku: '', rate: '', qtyReceived: '' },
  ])
  const [activeView, setActiveView] = useState<'supplier' | 'detailed'>('supplier')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Add PO dialog
  const [addOpen, setAddOpen] = useState(false)
  const [newPo, setNewPo] = useState({
    supplier: '',
    email: '',
    poStatus: 'OPEN',
    mailingAddress: '',
    shipTo: '',
    orderDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: '',
    location: '',
    shippingAddress: 'SHADEOTECH WINDOW FASHIONS\n539 W Commerce St\nDallas, TX  75208-1953 USA',
    shipVia: '',
    permitNo: '',
    sideMark: '',
    poNumber: '',
    validity: '',
    messageToVendor: '',
    memo: '',
    notes: '',
  })
  const [newPoItems, setNewPoItems] = useState<Partial<PurchaseOrderItem>[]>([
    { itemType: 'Component', itemName: '', itemCode: '', unitType: 'Each', qtyOrdered: 1 },
  ])
  const [newPoCategories, setNewPoCategories] = useState([
    { category: '', description: '', amount: '', customer: '' },
    { category: '', description: '', amount: '', customer: '' },
  ])
  const [newPoLineItems, setNewPoLineItems] = useState([
    { product: '', sku: '', description: '', qty: '', rate: '', amount: '', customer: '', itemType: 'Component', itemId: '' },
    { product: '', sku: '', description: '', qty: '', rate: '', amount: '', customer: '', itemType: 'Component', itemId: '' },
  ])

  // Inventory lookup for linking PO items
  const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; code: string; type: string; qty: number }[]>([])
  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/api/inventory/fabrics', { headers }).then(r => r.ok ? r.json() : { fabrics: [] }),
      fetch('/api/inventory/cassettes', { headers }).then(r => r.ok ? r.json() : { cassettes: [] }),
      fetch('/api/inventory/components', { headers }).then(r => r.ok ? r.json() : { components: [] }),
    ]).then(([fabData, casData, comData]) => {
      const all = [
        ...(fabData.fabrics || []).map((f: any) => ({ id: f._id, name: f.name, code: f.fabricCode || '', type: 'Fabric', qty: f.quantity ?? 0 })),
        ...(casData.cassettes || []).map((c: any) => ({ id: c._id, name: `${c.type} ${c.color}`, code: c._id.slice(-6), type: 'Cassette', qty: c.quantity ?? 0 })),
        ...(comData.components || []).map((c: any) => ({ id: c._id, name: c.name, code: c._id.slice(-6), type: 'Component', qty: c.quantity ?? 0 })),
      ]
      setInventoryItems(all)
    }).catch(console.error)
  }, [token])

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
      toast({ title: 'Vendor is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/inventory/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          supplier: newPo.supplier,
          orderDate: newPo.orderDate,
          notes: newPo.notes,
          email: newPo.email,
          poStatus: newPo.poStatus,
          mailingAddress: newPo.mailingAddress,
          shipTo: newPo.shipTo,
          dueDate: newPo.dueDate,
          location: newPo.location,
          shippingAddress: newPo.shippingAddress,
          shipVia: newPo.shipVia,
          permitNo: newPo.permitNo,
          sideMark: newPo.sideMark,
          poNumber: newPo.poNumber,
          validity: newPo.validity,
          messageToVendor: newPo.messageToVendor,
          memo: newPo.memo,
          items: newPoLineItems
            .filter(r => r.product.trim())
            .map(r => ({
              itemType: r.itemType || 'Component',
              itemId: r.itemId || undefined,
              itemName: r.product,
              itemCode: r.sku,
              unitType: 'Each',
              qtyOrdered: parseFloat(r.qty) || 1,
            })),
        }),
      })
      if (!res.ok) throw new Error('Failed to create purchase order')
      setAddOpen(false)
      resetNewPo()
      await fetchOrders()
      toast({ title: 'Purchase order created' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to create', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const resetNewPo = () => {
    setNewPo({
      supplier: '', email: '', poStatus: 'OPEN', mailingAddress: '', shipTo: '',
      orderDate: format(new Date(), 'yyyy-MM-dd'), dueDate: '', location: '',
      shippingAddress: 'SHADEOTECH WINDOW FASHIONS\n539 W Commerce St\nDallas, TX  75208-1953 USA',
      shipVia: '', permitNo: '', sideMark: '', poNumber: '', validity: '',
      messageToVendor: '', memo: '', notes: '',
    })
    setNewPoItems([{ itemType: 'Component', itemName: '', itemCode: '', unitType: 'Each', qtyOrdered: 1 }])
    setNewPoCategories([
      { category: '', description: '', amount: '', customer: '' },
      { category: '', description: '', amount: '', customer: '' },
    ])
    setNewPoLineItems([
      { product: '', sku: '', description: '', qty: '', rate: '', amount: '', customer: '', itemType: 'Component', itemId: '' },
      { product: '', sku: '', description: '', qty: '', rate: '', amount: '', customer: '', itemType: 'Component', itemId: '' },
    ])
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
          <button
            onClick={() => setActiveTab('item-receipt')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'item-receipt'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Item Receipt
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">

          {/* ── Item Receipt view ── */}
          {activeTab === 'item-receipt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Item Receipts</h3>
                <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setItemReceiptOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New Item Receipt
                </Button>
              </div>
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground text-sm">
                  No item receipts yet.{' '}
                  <button className="text-primary underline" onClick={() => setItemReceiptOpen(true)}>Create one</button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab !== 'item-receipt' && <>
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
          </>}{/* end non-item-receipt */}
        </div>
      </div>

      {/* Item Receipt Dialog */}
      <Dialog open={itemReceiptOpen} onOpenChange={setItemReceiptOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
            <DialogTitle className="text-lg font-semibold">Item receipt #{itemReceipt.receiptNo}</DialogTitle>
          </div>
          <div className="px-6 py-4 space-y-6">
            {/* Header fields */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Vendor</Label>
                <Input value={itemReceipt.vendor} onChange={(e) => setItemReceipt({ ...itemReceipt, vendor: e.target.value })} placeholder="Choose a vendor" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input type="date" value={itemReceipt.date} onChange={(e) => setItemReceipt({ ...itemReceipt, date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Receipt no.</Label>
                <Input value={itemReceipt.receiptNo} onChange={(e) => setItemReceipt({ ...itemReceipt, receiptNo: e.target.value })} className="mt-1" />
              </div>
            </div>

            {/* Item details table */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Item details</h4>
              <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground w-8">#</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">PRODUCT/SERVICE</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">SKU</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">RATE</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">QTY RECEIVED</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {itemReceiptLines.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-1 text-muted-foreground text-xs">{idx + 1}</td>
                        <td className="px-2 py-1 min-w-[180px]">
                          <Input value={row.product} onChange={(e) => { const u=[...itemReceiptLines]; u[idx]={...u[idx],product:e.target.value}; setItemReceiptLines(u) }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1" />
                        </td>
                        <td className="px-2 py-1">
                          <Input value={row.sku} onChange={(e) => { const u=[...itemReceiptLines]; u[idx]={...u[idx],sku:e.target.value}; setItemReceiptLines(u) }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1" />
                        </td>
                        <td className="px-2 py-1">
                          <Input value={row.rate} onChange={(e) => { const u=[...itemReceiptLines]; u[idx]={...u[idx],rate:e.target.value}; setItemReceiptLines(u) }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1 text-right" />
                        </td>
                        <td className="px-2 py-1">
                          <Input value={row.qtyReceived} onChange={(e) => { const u=[...itemReceiptLines]; u[idx]={...u[idx],qtyReceived:e.target.value}; setItemReceiptLines(u) }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1 text-right" />
                        </td>
                        <td className="px-1 flex items-center gap-1 py-1">
                          <button onClick={() => setItemReceiptLines([...itemReceiptLines, { product: row.product, sku: row.sku, rate: row.rate, qtyReceived: '' }])} className="text-muted-foreground hover:text-foreground p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </button>
                          <button onClick={() => setItemReceiptLines(itemReceiptLines.filter((_,i)=>i!==idx))} className="text-muted-foreground hover:text-red-500 p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-3 py-2 border-t dark:border-gray-700">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setItemReceiptLines([...itemReceiptLines, { product:'', sku:'', rate:'', qtyReceived:'' }])}>
                    Add lines
                  </Button>
                </div>
              </div>
            </div>

            {/* Memo + Attachments */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-xs text-muted-foreground">Memo</Label>
                <Textarea value={itemReceipt.memo} onChange={(e) => setItemReceipt({ ...itemReceipt, memo: e.target.value })} rows={4} className="mt-1 resize-none text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Attachments</Label>
                <div className="mt-1 border-2 border-dashed dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors">
                  <Input type="file" accept=".png,.jpg,.jpeg,.pdf,.xls,.xlsx" className="hidden" id="ir-attach" />
                  <label htmlFor="ir-attach" className="cursor-pointer">
                    <p className="text-xs text-blue-500 font-medium">Add attachment</p>
                    <p className="text-xs text-muted-foreground mt-1">Max file size: 20 MB</p>
                  </label>
                </div>
                <button className="mt-1 text-xs text-blue-500 hover:underline">Show existing</button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <Button variant="outline" onClick={() => setItemReceiptOpen(false)}>Cancel</Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setItemReceiptOpen(false)}>Save</Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setItemReceiptOpen(false)}>Save and close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Purchase Order — QuickBooks style */}
      <Dialog open={addOpen} onOpenChange={(v) => { if (!v) resetNewPo(); setAddOpen(v) }}>
        <DialogContent className="w-[96vw] max-w-[1280px] max-h-[94vh] overflow-y-auto p-0">

          {/* ── Title + Amount bar ── */}
          <div className="flex items-center justify-between px-8 py-4 border-b dark:border-gray-700 bg-white dark:bg-gray-950 sticky top-0 z-10">
            <DialogTitle className="text-xl font-bold tracking-tight">Purchase Order</DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AMOUNT</span>
              <span className="text-3xl font-bold tabular-nums">
                ${newPoLineItems.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* ── Top info band (light bg) ── */}
          <div className="bg-gray-50 dark:bg-gray-900/60 border-b dark:border-gray-800 px-8 py-5">
            {/* Row A: Vendor | Email | Status */}
            <div className="grid grid-cols-[1fr_2fr_1fr] gap-5 items-end">
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Vendor</Label>
                <Input
                  value={newPo.supplier}
                  onChange={(e) => setNewPo({ ...newPo, supplier: e.target.value })}
                  placeholder="Choose a vendor"
                  className="bg-white dark:bg-gray-900"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                  <span className="text-xs text-blue-500 hover:underline cursor-pointer font-medium">Cc/Bcc</span>
                </div>
                <Input
                  value={newPo.email}
                  onChange={(e) => setNewPo({ ...newPo, email: e.target.value })}
                  placeholder="Email (Separate emails with a comma)"
                  className="bg-white dark:bg-gray-900"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Purchase Order status</Label>
                <Select value={newPo.poStatus} onValueChange={(v) => setNewPo({ ...newPo, poStatus: v })}>
                  <SelectTrigger className="bg-white dark:bg-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">OPEN</SelectItem>
                    <SelectItem value="CLOSED">CLOSED</SelectItem>
                    <SelectItem value="PENDING">PENDING</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* ── Row B: Address / Ship-to / Dates / Location ── */}
            <div className="grid grid-cols-12 gap-5">

              {/* Mailing address */}
              <div className="col-span-2">
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mailing address</Label>
                <Textarea
                  value={newPo.mailingAddress}
                  onChange={(e) => setNewPo({ ...newPo, mailingAddress: e.target.value })}
                  rows={5}
                  className="text-sm resize-none"
                />
              </div>

              {/* Ship to + Shipping address */}
              <div className="col-span-3 space-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ship to</Label>
                  <Input
                    value={newPo.shipTo}
                    onChange={(e) => setNewPo({ ...newPo, shipTo: e.target.value })}
                    placeholder="Select customer for address"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Shipping address</Label>
                  <Textarea
                    value={newPo.shippingAddress}
                    onChange={(e) => setNewPo({ ...newPo, shippingAddress: e.target.value })}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>
              </div>

              {/* PO date / Due date / Ship Via */}
              <div className="col-span-4 grid grid-cols-2 gap-3 content-start">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Purchase Order date</Label>
                  <Input type="date" value={newPo.orderDate} onChange={(e) => setNewPo({ ...newPo, orderDate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Due date</Label>
                  <Input type="date" value={newPo.dueDate} onChange={(e) => setNewPo({ ...newPo, dueDate: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ship Via</Label>
                  <Input value={newPo.shipVia} onChange={(e) => setNewPo({ ...newPo, shipVia: e.target.value })} />
                </div>
              </div>

              {/* Location / Permit no. */}
              <div className="col-span-3 space-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Location</Label>
                  <Input value={newPo.location} onChange={(e) => setNewPo({ ...newPo, location: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Permit no.</Label>
                  <Input value={newPo.permitNo} onChange={(e) => setNewPo({ ...newPo, permitNo: e.target.value })} />
                </div>
              </div>
            </div>

            {/* ── Row C: Side Mark / P.O. Number / Validity ── */}
            <div className="grid grid-cols-3 gap-5 pt-1 border-t dark:border-gray-800">
              <div className="pt-4">
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Side Mark</Label>
                <Input value={newPo.sideMark} onChange={(e) => setNewPo({ ...newPo, sideMark: e.target.value })} />
              </div>
              <div className="pt-4">
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">P.O. Number</Label>
                <Input value={newPo.poNumber} onChange={(e) => setNewPo({ ...newPo, poNumber: e.target.value })} />
              </div>
              <div className="pt-4">
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Validity</Label>
                <Input value={newPo.validity} onChange={(e) => setNewPo({ ...newPo, validity: e.target.value })} />
              </div>
            </div>

            {/* Category details table */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-amber-500 rounded-full inline-block" />
                Category details
              </h4>
              <div className="border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground w-8">#</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">CATEGORY</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">DESCRIPTION</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">AMOUNT</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">CUSTOMER</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {newPoCategories.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-1 text-muted-foreground text-xs">{idx + 1}</td>
                        <td className="px-2 py-1">
                          <Input value={row.category} onChange={(e) => { const u=[...newPoCategories]; u[idx]={...u[idx],category:e.target.value}; setNewPoCategories(u) }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1" />
                        </td>
                        <td className="px-2 py-1">
                          <Input value={row.description} onChange={(e) => { const u=[...newPoCategories]; u[idx]={...u[idx],description:e.target.value}; setNewPoCategories(u) }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1" />
                        </td>
                        <td className="px-2 py-1">
                          <Input value={row.amount} onChange={(e) => { const u=[...newPoCategories]; u[idx]={...u[idx],amount:e.target.value}; setNewPoCategories(u) }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1 text-right" />
                        </td>
                        <td className="px-2 py-1">
                          <Input value={row.customer} onChange={(e) => { const u=[...newPoCategories]; u[idx]={...u[idx],customer:e.target.value}; setNewPoCategories(u) }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1" />
                        </td>
                        <td className="px-1">
                          <button onClick={() => setNewPoCategories(newPoCategories.filter((_,i)=>i!==idx))} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="h-3 w-3" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center gap-2 px-3 py-2 border-t dark:border-gray-700">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setNewPoCategories([...newPoCategories, { category:'', description:'', amount:'', customer:'' }])}>
                    Add lines
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setNewPoCategories([{ category:'', description:'', amount:'', customer:'' },{ category:'', description:'', amount:'', customer:'' }])}>
                    Clear all lines
                  </Button>
                </div>
              </div>
            </div>

            {/* Item details table */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-amber-500 rounded-full inline-block" />
                Item details
              </h4>
              <div className="border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground w-8">#</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">PRODUCT/SERVICE</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">SKU</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">DESCRIPTION</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">QTY</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">RATE</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">AMOUNT</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">CUSTOMER</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {newPoLineItems.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-1 text-muted-foreground text-xs">{idx + 1}</td>
                        <td className="px-2 py-1 min-w-[140px]">
                          <Input value={row.product} onChange={(e) => { const u=[...newPoLineItems]; u[idx]={...u[idx],product:e.target.value}; setNewPoLineItems(u) }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1" />
                        </td>
                        <td className="px-2 py-1">
                          <Input value={row.sku} onChange={(e) => { const u=[...newPoLineItems]; u[idx]={...u[idx],sku:e.target.value}; setNewPoLineItems(u) }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1" />
                        </td>
                        <td className="px-2 py-1 min-w-[160px]">
                          <Input value={row.description} onChange={(e) => { const u=[...newPoLineItems]; u[idx]={...u[idx],description:e.target.value}; setNewPoLineItems(u) }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1" />
                        </td>
                        <td className="px-2 py-1">
                          <Input value={row.qty} onChange={(e) => { const u=[...newPoLineItems]; u[idx]={...u[idx],qty:e.target.value}; setNewPoLineItems(u) }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1 text-right" />
                        </td>
                        <td className="px-2 py-1">
                          <Input value={row.rate} onChange={(e) => {
                            const u=[...newPoLineItems]
                            const qty = parseFloat(u[idx].qty) || 0
                            const rate = parseFloat(e.target.value) || 0
                            u[idx]={...u[idx],rate:e.target.value,amount:(qty*rate).toFixed(2)}
                            setNewPoLineItems(u)
                          }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1 text-right" />
                        </td>
                        <td className="px-2 py-1">
                          <Input value={row.amount} readOnly className="h-7 text-xs border-0 shadow-none bg-transparent text-right font-medium" />
                        </td>
                        <td className="px-2 py-1">
                          <Input value={row.customer} onChange={(e) => { const u=[...newPoLineItems]; u[idx]={...u[idx],customer:e.target.value}; setNewPoLineItems(u) }} className="h-7 text-xs border-0 shadow-none focus-visible:ring-1" />
                        </td>
                        <td className="px-1">
                          <button onClick={() => setNewPoLineItems(newPoLineItems.filter((_,i)=>i!==idx))} className="text-muted-foreground hover:text-red-500 p-1"><Trash2 className="h-3 w-3" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between px-3 py-2 border-t dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setNewPoLineItems([...newPoLineItems, { product:'', sku:'', description:'', qty:'', rate:'', amount:'', customer:'', itemType:'Component', itemId:'' }])}>
                      Add lines
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setNewPoLineItems([{ product:'',sku:'',description:'',qty:'',rate:'',amount:'',customer:'',itemType:'Component',itemId:'' },{ product:'',sku:'',description:'',qty:'',rate:'',amount:'',customer:'',itemType:'Component',itemId:'' }])}>
                      Clear all lines
                    </Button>
                  </div>
                  <span className="text-sm font-semibold">
                    Total&nbsp;&nbsp;${newPoLineItems.reduce((s,r)=>s+(parseFloat(r.amount)||0),0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Message / Memo / Attachments */}
            <div className="grid grid-cols-3 gap-5 pt-4 border-t dark:border-gray-800">
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your message to vendor</Label>
                <Textarea
                  value={newPo.messageToVendor}
                  onChange={(e) => setNewPo({ ...newPo, messageToVendor: e.target.value })}
                  rows={4}
                  className="text-sm resize-none"
                  placeholder="Optional message to vendor…"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Memo</Label>
                <Textarea
                  value={newPo.memo}
                  onChange={(e) => setNewPo({ ...newPo, memo: e.target.value })}
                  rows={4}
                  className="text-sm resize-none"
                  placeholder="Internal memo…"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Attachments</Label>
                <div className="border-2 border-dashed dark:border-gray-700 rounded-xl p-5 text-center cursor-pointer hover:bg-muted/20 transition-colors">
                  <Input type="file" accept=".png,.jpg,.jpeg,.pdf,.xls,.xlsx" className="hidden" id="po-attach" multiple />
                  <label htmlFor="po-attach" className="cursor-pointer space-y-1.5 block">
                    <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto">
                      <Plus className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-xs text-blue-500 font-semibold">Add attachment</p>
                    <p className="text-xs text-muted-foreground">Max file size: 20 MB</p>
                  </label>
                </div>
                <button className="mt-2 text-xs text-blue-500 hover:underline block">Show existing</button>
              </div>
            </div>
          </div>

          {/* Footer action bar */}
          <div className="flex items-center justify-between px-8 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky bottom-0">
            <Button variant="outline" onClick={() => { resetNewPo(); setAddOpen(false) }}>Cancel</Button>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">Print</Button>
              <Button variant="ghost" className="text-sm text-muted-foreground hover:text-foreground">Make recurring</Button>
              <Button variant="outline" onClick={handleAddPo} disabled={saving || !newPo.supplier.trim()} className="min-w-[70px]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white min-w-[120px]" onClick={handleAddPo} disabled={saving || !newPo.supplier.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save and close'}
              </Button>
            </div>
          </div>
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
