'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Loader2, Search } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface LineItem {
  id: string
  productName: string
  category: string
  subcategory: string
  width: number
  length: number
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface CustomerOption {
  id: string
  name: string
  sideMark: string
  email: string
}

interface QuoteOption {
  id: string
  quoteNumber: string
  customerName: string
  customerId: string
  sideMark: string
  totalAmount: number
  taxRate: number
  items: LineItem[]
}

function CreateInvoiceForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useAuthStore()
  const { toast } = useToast()

  const preloadQuoteId = searchParams.get('quoteId')
  const preloadOrderId = searchParams.get('orderId')

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [sideMark, setSideMark] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [status, setStatus] = useState<'DRAFT' | 'SENT'>('SENT')
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', productName: '', category: '', subcategory: '', width: 0, length: 0, quantity: 1, unitPrice: 0, totalPrice: 0 },
  ])
  const [linkedQuote, setLinkedQuote] = useState<QuoteOption | null>(null)
  const [linkedOrderId, setLinkedOrderId] = useState<string>('')

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([])
  const [customerLoading, setCustomerLoading] = useState(false)

  // Quote search
  const [quoteSearch, setQuoteSearch] = useState('')
  const [quoteOptions, setQuoteOptions] = useState<QuoteOption[]>([])
  const [quoteLoading, setQuoteLoading] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [loadingSource, setLoadingSource] = useState(false)

  // Computed totals
  const subtotal = items.reduce((acc, i) => acc + (i.totalPrice || 0), 0)
  const taxAmount = subtotal * (taxRate / 100)
  const totalAmount = subtotal + taxAmount

  // Pre-load from query params
  useEffect(() => {
    if (!token || (!preloadQuoteId && !preloadOrderId)) return
    setLoadingSource(true)

    if (preloadQuoteId) {
      fetch(`/api/quotes/${preloadQuoteId}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const q = data?.quote ?? data
          if (!q) return
          setLinkedQuote({
            id: q.id ?? q._id,
            quoteNumber: q.quoteNumber,
            customerName: q.customerName,
            customerId: q.customerId,
            sideMark: q.sideMark ?? '',
            totalAmount: q.totalAmount,
            taxRate: q.taxRate ?? 0,
            items: (q.items ?? []).map((item: any, idx: number) => ({
              id: String(idx + 1),
              productName: item.productName ?? '',
              category: item.category ?? '',
              subcategory: item.subcategory ?? '',
              width: item.width ?? 0,
              length: item.length ?? 0,
              quantity: item.quantity ?? 1,
              unitPrice: item.unitPrice ?? 0,
              totalPrice: item.totalPrice ?? 0,
            })),
          })
          setCustomerName(q.customerName ?? '')
          setCustomerId(q.customerId ?? '')
          setSideMark(q.sideMark ?? '')
          setTaxRate(q.taxRate ?? 0)
          setItems((q.items ?? []).map((item: any, idx: number) => ({
            id: String(idx + 1),
            productName: item.productName ?? '',
            category: item.category ?? '',
            subcategory: item.subcategory ?? '',
            width: item.width ?? 0,
            length: item.length ?? 0,
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice ?? 0,
            totalPrice: item.totalPrice ?? 0,
          })))
        })
        .catch(() => {})
        .finally(() => setLoadingSource(false))
    }
  }, [preloadQuoteId, preloadOrderId, token])

  // Customer search debounced
  useEffect(() => {
    if (!customerSearch.trim() || customerSearch.length < 2) { setCustomerOptions([]); return }
    const t = setTimeout(async () => {
      if (!token) return
      setCustomerLoading(true)
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}&limit=8`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setCustomerOptions((data.customers ?? []).map((c: any) => ({
          id: c._id ?? c.id,
          name: c.name ?? c.customerName ?? '',
          sideMark: c.sideMark ?? '',
          email: c.email ?? '',
        })))
      } catch { setCustomerOptions([]) }
      finally { setCustomerLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [customerSearch, token])

  // Quote search debounced
  useEffect(() => {
    if (!quoteSearch.trim() || quoteSearch.length < 2) { setQuoteOptions([]); return }
    const t = setTimeout(async () => {
      if (!token) return
      setQuoteLoading(true)
      try {
        const res = await fetch(`/api/quotes?search=${encodeURIComponent(quoteSearch)}&status=WON&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setQuoteOptions((data.quotes ?? []).map((q: any) => ({
          id: q.id ?? q._id,
          quoteNumber: q.quoteNumber,
          customerName: q.customerName,
          customerId: q.customerId,
          sideMark: q.sideMark ?? '',
          totalAmount: q.totalAmount,
          taxRate: q.taxRate ?? 0,
          items: q.items ?? [],
        })))
      } catch { setQuoteOptions([]) }
      finally { setQuoteLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [quoteSearch, token])

  const selectCustomer = (c: CustomerOption) => {
    setCustomerName(c.name)
    setCustomerId(c.id)
    setSideMark(c.sideMark)
    setCustomerSearch('')
    setCustomerOptions([])
  }

  const selectQuote = (q: QuoteOption) => {
    setLinkedQuote(q)
    setCustomerName(q.customerName)
    setCustomerId(q.customerId)
    setSideMark(q.sideMark)
    setTaxRate(q.taxRate)
    setItems(q.items.length ? q.items : items)
    setQuoteSearch('')
    setQuoteOptions([])
  }

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      if (field === 'unitPrice' || field === 'quantity') {
        updated.totalPrice = (Number(updated.unitPrice) || 0) * (Number(updated.quantity) || 1)
      }
      if (field === 'totalPrice') {
        updated.totalPrice = Number(value) || 0
      }
      return updated
    }))
  }

  const addItem = () => {
    setItems(prev => [...prev, {
      id: String(Date.now()),
      productName: '', category: '', subcategory: '',
      width: 0, length: 0, quantity: 1, unitPrice: 0, totalPrice: 0,
    }])
  }

  const removeItem = (id: string) => {
    if (items.length === 1) return
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      toast({ title: 'Required', description: 'Customer name is required.', variant: 'destructive' })
      return
    }
    if (items.every(i => !i.productName.trim())) {
      toast({ title: 'Required', description: 'At least one line item with a product name is required.', variant: 'destructive' })
      return
    }
    if (!token) return

    setSubmitting(true)
    try {
      const payload = {
        customerName: customerName.trim(),
        customerId: customerId || undefined,
        sideMark: sideMark.trim() || undefined,
        status,
        taxRate,
        dueDate,
        notes: notes.trim() || undefined,
        quoteId: linkedQuote?.id || undefined,
        orderId: linkedOrderId || undefined,
        items: items.filter(i => i.productName.trim()).map(i => ({
          productName: i.productName,
          category: i.category,
          subcategory: i.subcategory,
          width: i.width,
          length: i.length,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        })),
      }

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast({ title: 'Error', description: err.error || 'Failed to create invoice.', variant: 'destructive' })
        return
      }

      const data = await res.json()
      const newId = data.invoice?.id ?? data.invoice?._id
      toast({ title: 'Invoice created!', description: `Invoice ${data.invoice?.invoiceNumber} has been created.` })
      router.push(newId ? `/invoices/${newId}` : '/invoices')
    } catch {
      toast({ title: 'Error', description: 'An error occurred. Please try again.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-semibold">Create Invoice</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Generate an invoice from a quote, order, or manually</p>
        </div>
      </div>

      {loadingSource && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading source data…
        </div>
      )}

      {/* Link to Quote */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link to Quote (Optional)</CardTitle>
          <CardDescription>Search for an accepted quote to pre-fill this invoice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {linkedQuote ? (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <div>
                <p className="font-medium text-sm">{linkedQuote.quoteNumber} — {linkedQuote.customerName}</p>
                <p className="text-xs text-muted-foreground">Total: {formatCurrency(linkedQuote.totalAmount)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setLinkedQuote(null); setQuoteSearch('') }}>
                Remove
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  placeholder="Search by quote number or customer name…"
                  value={quoteSearch}
                  onChange={e => setQuoteSearch(e.target.value)}
                />
                {quoteLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
              </div>
              {quoteOptions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
                  {quoteOptions.map(q => (
                    <button
                      key={q.id}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b last:border-0"
                      onClick={() => selectQuote(q)}
                    >
                      <span className="font-medium">{q.quoteNumber}</span>
                      <span className="text-muted-foreground ml-2">{q.customerName}</span>
                      <span className="text-muted-foreground ml-2">{formatCurrency(q.totalAmount)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative space-y-1.5">
            <Label>Customer Name <span className="text-destructive">*</span></Label>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={customerId ? customerName : customerSearch || customerName}
                onChange={e => {
                  if (customerId) { setCustomerName(e.target.value); setCustomerId('') }
                  else { setCustomerSearch(e.target.value); setCustomerName(e.target.value) }
                }}
                placeholder="Type customer name or search…"
              />
              {customerLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
            </div>
            {customerId && <Badge variant="outline" className="text-xs">Linked to CRM customer</Badge>}
            {customerOptions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
                {customerOptions.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b last:border-0"
                    onClick={() => selectCustomer(c)}
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.sideMark && <span className="text-muted-foreground ml-2">{c.sideMark}</span>}
                    {c.email && <span className="text-muted-foreground ml-2 text-xs">{c.email}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Side Mark / Address</Label>
              <Input value={sideMark} onChange={e => setSideMark(e.target.value)} placeholder="Job site or address" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as 'DRAFT' | 'SENT')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={taxRate}
                onChange={e => setTaxRate(parseFloat(e.target.value || '0') || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Line Items</CardTitle>
              <CardDescription>Products or services to invoice</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addItem}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="grid gap-2 p-3 border rounded-lg bg-muted/30">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Product Name</Label>
                    <Input
                      value={item.productName}
                      onChange={e => updateItem(item.id, 'productName', e.target.value)}
                      placeholder="e.g. Roller Shade"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <Input
                      value={item.category}
                      onChange={e => updateItem(item.id, 'category', e.target.value)}
                      placeholder="e.g. Interior"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit Price</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unitPrice}
                      onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Total</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.totalPrice}
                      onChange={e => updateItem(item.id, 'totalPrice', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive w-full"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 max-w-xs ml-auto text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({taxRate}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle className="text-base">Notes (Optional)</CardTitle></CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any notes or special instructions for this invoice…"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Link href="/invoices">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : 'Create Invoice'}
        </Button>
      </div>
    </div>
  )
}

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CreateInvoiceForm />
    </Suspense>
  )
}
