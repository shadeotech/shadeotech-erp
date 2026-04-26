'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Loader2, Search, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'

interface LineItem {
  productName: string
  category: string
  width: string
  length: string
  quantity: string
  unitPrice: string
  totalPrice: number
}

interface Customer {
  id: string
  name: string
  sideMark: string
  email?: string
}

const emptyItem = (): LineItem => ({
  productName: '',
  category: '',
  width: '',
  length: '',
  quantity: '1',
  unitPrice: '',
  totalPrice: 0,
})

function computeRowTotal(item: LineItem): number {
  const qty = parseFloat(item.quantity) || 0
  const unit = parseFloat(item.unitPrice) || 0
  return parseFloat((qty * unit).toFixed(2))
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Called after an invoice is successfully created.
   * Used by admin invoices list to refresh data.
   */
  onCreated?: () => void
  /**
   * Optional callback used in some screens (e.g. customer detail)
   * to refresh surrounding data when an invoice is created.
   */
  onSuccess?: () => void
  /**
   * Optional pre-selected customer context.
   * Currently accepted for type-safety; the modal still uses its
   * own customer search flow for selection.
   */
  customerId?: string
  customerName?: string
  sideMark?: string
}

export function CreateInvoiceModal({
  open,
  onOpenChange,
  onCreated,
  onSuccess,
}: Props) {
  const { token } = useAuthStore()

  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const [sideMark, setSideMark] = useState('')
  const [status, setStatus] = useState<'SENT' | 'DRAFT'>('SENT')
  const [dueDate, setDueDate] = useState('')
  const [taxRate, setTaxRate] = useState('0')
  const [notes, setNotes] = useState('')

  const [billToStreet, setBillToStreet] = useState('')
  const [billToCity, setBillToCity] = useState('')
  const [billToState, setBillToState] = useState('')
  const [billToPostcode, setBillToPostcode] = useState('')
  const [shipToStreet, setShipToStreet] = useState('')
  const [shipToCity, setShipToCity] = useState('')
  const [shipToState, setShipToState] = useState('')
  const [shipToPostcode, setShipToPostcode] = useState('')
  const [items, setItems] = useState<LineItem[]>([emptyItem()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    if (!token) return
    setCustomersLoading(true)
    try {
      const res = await fetch('/api/customers', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCustomers(
          (data.customers ?? []).map((c: any) => ({
            id: c.id,
            name:
              c.name ||
              `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() ||
              c.sideMark ||
              'Unknown',
            sideMark: c.sideMark ?? '',
            email: c.email,
          }))
        )
      }
    } catch {
      setCustomers([])
    } finally {
      setCustomersLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (open) fetchCustomers()
  }, [open, fetchCustomers])

  const filteredCustomers = customers.filter(
    (c) =>
      !customerSearch ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.sideMark.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(customerSearch.toLowerCase())
  )

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c)
    setCustomerSearch(c.name)
    setSideMark(c.sideMark)
    setShowDropdown(false)
  }

  const updateItem = (index: number, field: keyof LineItem, value: string) => {
    setItems((prev) => {
      const next = [...prev]
      const updated = { ...next[index], [field]: value }
      updated.totalPrice = computeRowTotal(updated)
      next[index] = updated
      return next
    })
  }

  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0)
  const taxRateNum = parseFloat(taxRate) || 0
  const taxAmount = parseFloat(((subtotal * taxRateNum) / 100).toFixed(2))
  const total = subtotal + taxAmount

  const resetForm = () => {
    setCustomerSearch('')
    setSelectedCustomer(null)
    setSideMark('')
    setStatus('SENT')
    setDueDate('')
    setTaxRate('0')
    setNotes('')
    setItems([emptyItem()])
    setError(null)
    setShowDropdown(false)
    setBillToStreet(''); setBillToCity(''); setBillToState(''); setBillToPostcode('')
    setShipToStreet(''); setShipToCity(''); setShipToState(''); setShipToPostcode('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError(null)

    const customerName = selectedCustomer?.name ?? customerSearch.trim()
    if (!customerName) {
      setError('Please select or enter a customer name.')
      return
    }
    const filledItems = items.filter((i) => i.productName.trim())
    if (filledItems.length === 0) {
      setError('Add at least one line item with a product name.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomer?.id,
          customerName,
          sideMark: sideMark.trim() || undefined,
          items: filledItems.map((i) => ({
            productName: i.productName.trim(),
            category: i.category.trim() || undefined,
            width: i.width ? parseFloat(i.width) : undefined,
            length: i.length ? parseFloat(i.length) : undefined,
            quantity: parseFloat(i.quantity) || 1,
            unitPrice: parseFloat(i.unitPrice) || 0,
            totalPrice: i.totalPrice,
          })),
          taxRate: taxRateNum,
          dueDate: dueDate || undefined,
          notes: notes.trim() || undefined,
          status,
          billToStreet: billToStreet.trim() || undefined,
          billToCity: billToCity.trim() || undefined,
          billToState: billToState.trim() || undefined,
          billToPostcode: billToPostcode.trim() || undefined,
          shipToStreet: shipToStreet.trim() || undefined,
          shipToCity: shipToCity.trim() || undefined,
          shipToState: shipToState.trim() || undefined,
          shipToPostcode: shipToPostcode.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to create invoice')
        return
      }

      if (onCreated) onCreated()
      if (onSuccess) await onSuccess()
      onOpenChange(false)
      resetForm()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm() }}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* Sticky header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice for any customer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-6">

            {/* ── Customer + Meta ───────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Customer search */}
              <div className="space-y-1.5 relative">
                <Label>Customer *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    className="pl-9 pr-8"
                    placeholder="Search by name, side mark, email…"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      setSelectedCustomer(null)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    autoComplete="off"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>

                {showDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {customersLoading ? (
                      <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />Loading…
                      </div>
                    ) : filteredCustomers.length === 0 ? (
                      <div className="px-3 py-2.5 text-sm text-muted-foreground">No customers found</div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                          onMouseDown={() => selectCustomer(c)}
                        >
                          <span className="font-medium flex-1 truncate">{c.name}</span>
                          {c.sideMark && (
                            <Badge variant="outline" className="text-[10px] h-4 shrink-0">
                              {c.sideMark}
                            </Badge>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedCustomer?.email && (
                  <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                )}
              </div>

              {/* Side Mark */}
              <div className="space-y-1.5">
                <Label htmlFor="sideMark">Side Mark / Address</Label>
                <Input
                  id="sideMark"
                  value={sideMark}
                  onChange={(e) => setSideMark(e.target.value)}
                  placeholder="e.g. 123 Main St, Austin TX"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as 'SENT' | 'DRAFT')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SENT">Sent (Unpaid)</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* ── Bill To / Ship To ───────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bill To</p>
                <div className="space-y-2">
                  <Input placeholder="Street address" value={billToStreet} onChange={(e) => setBillToStreet(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="City" value={billToCity} onChange={(e) => setBillToCity(e.target.value)} />
                    <Input placeholder="State" value={billToState} onChange={(e) => setBillToState(e.target.value)} />
                  </div>
                  <Input placeholder="ZIP / Postcode" value={billToPostcode} onChange={(e) => setBillToPostcode(e.target.value)} className="max-w-[160px]" />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ship To</p>
                <div className="space-y-2">
                  <Input placeholder="Street address" value={shipToStreet} onChange={(e) => setShipToStreet(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="City" value={shipToCity} onChange={(e) => setShipToCity(e.target.value)} />
                    <Input placeholder="State" value={shipToState} onChange={(e) => setShipToState(e.target.value)} />
                  </div>
                  <Input placeholder="ZIP / Postcode" value={shipToPostcode} onChange={(e) => setShipToPostcode(e.target.value)} className="max-w-[160px]" />
                </div>
              </div>
            </div>

            {/* ── Line Items ──────────────────────────────── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Add Item
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                {/* Desktop header */}
                <div
                  className="hidden md:grid gap-2 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  style={{ gridTemplateColumns: '2fr 1fr 58px 58px 64px 1fr 80px 36px' }}
                >
                  <span>Product</span>
                  <span>Category</span>
                  <span className="text-center">W″</span>
                  <span className="text-center">H″</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Unit Price</span>
                  <span className="text-right">Total</span>
                  <span />
                </div>

                <div className="divide-y">
                  {items.map((item, i) => (
                    <div key={i} className="px-3 py-2.5">
                      {/* Desktop row */}
                      <div
                        className="hidden md:grid gap-2 items-center"
                        style={{ gridTemplateColumns: '2fr 1fr 58px 58px 64px 1fr 80px 36px' }}
                      >
                        <Input placeholder="Product name *" value={item.productName} onChange={(e) => updateItem(i, 'productName', e.target.value)} className="h-8 text-sm" />
                        <Input placeholder="Category" value={item.category} onChange={(e) => updateItem(i, 'category', e.target.value)} className="h-8 text-sm" />
                        <Input type="number" placeholder='W"' value={item.width} onChange={(e) => updateItem(i, 'width', e.target.value)} className="h-8 text-sm text-center" />
                        <Input type="number" placeholder='H"' value={item.length} onChange={(e) => updateItem(i, 'length', e.target.value)} className="h-8 text-sm text-center" />
                        <Input type="number" min="1" placeholder="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} className="h-8 text-sm text-center" />
                        <Input type="number" min="0" step="0.01" placeholder="0.00" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} className="h-8 text-sm text-right" />
                        <span className="text-sm font-medium text-right tabular-nums">{formatCurrency(item.totalPrice)}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => removeItem(i)} disabled={items.length === 1}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Mobile row */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => removeItem(i)} disabled={items.length === 1}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Input placeholder="Product name *" value={item.productName} onChange={(e) => updateItem(i, 'productName', e.target.value)} className="h-8 text-sm" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Category" value={item.category} onChange={(e) => updateItem(i, 'category', e.target.value)} className="h-8 text-sm" />
                          <div className="flex gap-1">
                            <Input type="number" placeholder='W"' value={item.width} onChange={(e) => updateItem(i, 'width', e.target.value)} className="h-8 text-sm text-center" />
                            <Input type="number" placeholder='H"' value={item.length} onChange={(e) => updateItem(i, 'length', e.target.value)} className="h-8 text-sm text-center" />
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} className="h-8 text-sm text-center w-16" />
                          <span className="text-muted-foreground text-sm">×</span>
                          <Input type="number" min="0" step="0.01" placeholder="Unit Price" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} className="h-8 text-sm flex-1" />
                          <span className="text-sm font-semibold w-20 text-right tabular-nums">{formatCurrency(item.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Notes + Totals ──────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={3} placeholder="Any notes to include on the invoice…" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground shrink-0">Tax %</span>
                  <Input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="h-8 text-sm w-24 text-right" />
                  <span className="text-sm text-muted-foreground ml-auto tabular-nums">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold tabular-nums">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                {error}
              </p>
            )}
          </div>

          {/* Sticky footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-background sticky bottom-0">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetForm() }} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</>
                : 'Create Invoice'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
