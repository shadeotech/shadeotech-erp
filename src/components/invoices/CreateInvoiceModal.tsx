'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Plus, Trash2, Loader2, Search, ChevronDown, Package } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { AddressAutocomplete, type AddressSelection } from '@/components/shared/AddressAutocomplete'

// ─── Card brand logo SVGs ────────────────────────────────────────────────────

function VisaLogo() {
  return (
    <svg width="42" height="26" viewBox="0 0 42 26" fill="none">
      <rect width="42" height="26" rx="4" fill="#1A1F71" />
      <text x="21" y="18" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold"
        fontFamily="Arial" fontStyle="italic" letterSpacing="1">VISA</text>
    </svg>
  )
}

function MastercardLogo() {
  return (
    <svg width="42" height="26" viewBox="0 0 42 26" fill="none">
      <rect width="42" height="26" rx="4" fill="#1A1A1A" />
      <circle cx="16" cy="13" r="7.5" fill="#EB001B" />
      <circle cx="26" cy="13" r="7.5" fill="#F79E1B" />
      <path d="M21 7.2a7.5 7.5 0 0 1 0 11.6A7.5 7.5 0 0 1 21 7.2z" fill="#FF5F00" />
    </svg>
  )
}

function AmexLogo() {
  return (
    <svg width="42" height="26" viewBox="0 0 42 26" fill="none">
      <rect width="42" height="26" rx="4" fill="#016FD0" />
      <text x="21" y="17.5" textAnchor="middle" fill="white" fontSize="9.5" fontWeight="bold"
        fontFamily="Arial" letterSpacing="0.8">AMEX</text>
    </svg>
  )
}

function DiscoverLogo() {
  return (
    <svg width="42" height="26" viewBox="0 0 42 26" fill="none">
      <rect width="42" height="26" rx="4" fill="#FFFFFF" stroke="#E5E7EB" />
      <text x="12" y="18" fill="#231F20" fontSize="8.5" fontWeight="bold" fontFamily="Arial">DISC</text>
      <circle cx="32" cy="13" r="8" fill="#F76F20" />
    </svg>
  )
}

function PayPalLogo() {
  return (
    <svg width="42" height="26" viewBox="0 0 42 26" fill="none">
      <rect width="42" height="26" rx="4" fill="#F7F9FA" stroke="#E5E7EB" />
      <text x="6" y="17.5" fill="#009CDE" fontSize="10" fontWeight="900" fontFamily="Arial">Pay</text>
      <text x="20" y="17.5" fill="#012169" fontSize="10" fontWeight="900" fontFamily="Arial">Pal</text>
    </svg>
  )
}

function AchLogo() {
  return (
    <svg width="42" height="26" viewBox="0 0 42 26" fill="none">
      <rect width="42" height="26" rx="4" fill="#374151" />
      <text x="21" y="17.5" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold"
        fontFamily="Arial" letterSpacing="0.5">BANK</text>
    </svg>
  )
}

// ─── Payment methods config ───────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { id: 'visa',       label: 'Visa',         surcharge: 3,   Logo: VisaLogo },
  { id: 'mastercard', label: 'Mastercard',   surcharge: 3,   Logo: MastercardLogo },
  { id: 'discover',   label: 'Discover',     surcharge: 3,   Logo: DiscoverLogo },
  { id: 'amex',       label: 'Amex',         surcharge: 3.5, Logo: AmexLogo },
  { id: 'paypal',     label: 'PayPal',       surcharge: 3,   Logo: PayPalLogo },
  { id: 'ach',        label: 'ACH / Debit',  surcharge: 0,   Logo: AchLogo },
] as const

type PaymentMethodId = typeof PAYMENT_METHODS[number]['id']

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  productName: string
  description: string
  quantity: string
  unitPrice: string
  totalPrice: number
  taxable: boolean
  inventoryId?: string
}

interface InventoryItem {
  _id: string
  name: string
  label: string
  category: string
  price?: number
}

interface Customer {
  id: string
  name: string
  sideMark: string
  email?: string
  street?: string
  city?: string
  state?: string
  postcode?: string
  country?: string
}

const emptyItem = (): LineItem => ({
  productName: '',
  description: '',
  quantity: '1',
  unitPrice: '',
  totalPrice: 0,
  taxable: false,
})

function computeRowTotal(item: LineItem): number {
  const qty = parseFloat(item.quantity) || 0
  const unit = parseFloat(item.unitPrice) || 0
  return parseFloat((qty * unit).toFixed(2))
}

// ─── Address block component ──────────────────────────────────────────────────

interface AddressBlockProps {
  label: string
  street: string; city: string; state: string; postcode: string
  onStreetChange: (v: string) => void
  onSelect: (a: AddressSelection) => void
  onCityChange: (v: string) => void
  onStateChange: (v: string) => void
  onPostcodeChange: (v: string) => void
}

function AddressBlock({ label, street, city, state, postcode,
  onStreetChange, onSelect, onCityChange, onStateChange, onPostcodeChange }: AddressBlockProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <AddressAutocomplete
        value={street}
        onChange={onStreetChange}
        onSelect={(a) => {
          onStreetChange(a.street)
          onCityChange(a.city)
          onStateChange(a.state)
          onPostcodeChange(a.postalCode)
          onSelect(a)
        }}
        placeholder="Street address…"
      />
      <div className="grid grid-cols-3 gap-2">
        <Input placeholder="City" value={city} onChange={(e) => onCityChange(e.target.value)} className="h-8 text-sm col-span-1" />
        <Input placeholder="State" value={state} onChange={(e) => onStateChange(e.target.value)} className="h-8 text-sm" />
        <Input placeholder="ZIP" value={postcode} onChange={(e) => onPostcodeChange(e.target.value)} className="h-8 text-sm" />
      </div>
    </div>
  )
}

// ─── Inventory combobox for a single line item ────────────────────────────────

interface ItemComboboxProps {
  value: string
  onChange: (name: string, price?: number, id?: string) => void
  items: InventoryItem[]
}

function ItemCombobox({ value, onChange, items }: ItemComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  // Sync when parent resets the value (e.g. form reset)
  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const trimmed = query.trim()
  const filtered = trimmed.length === 0
    ? items.slice(0, 40)
    : items.filter(i => i.label.toLowerCase().includes(trimmed.toLowerCase())).slice(0, 40)

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)   // keep parent productName in sync as user types
    setOpen(true)
  }

  return (
    <div ref={ref} className="relative w-full">
      <Input
        placeholder="Product / service *"
        value={query}
        onChange={handleTextChange}
        onFocus={() => setOpen(true)}
        className="h-8 text-sm pr-7"
        autoComplete="off"
      />
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      {open && (
        <ul className="absolute z-[9999] mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl text-sm">
          {items.length === 0 ? (
            <li className="px-3 py-2.5 text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />Loading inventory…
            </li>
          ) : filtered.length === 0 ? (
            <li>
              <button type="button"
                className="w-full text-left px-3 py-2.5 flex items-center gap-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                onMouseDown={(e) => { e.preventDefault(); onChange(query); setOpen(false) }}>
                <Plus className="h-3.5 w-3.5 shrink-0" />Add &ldquo;{trimmed}&rdquo; as custom item
              </button>
            </li>
          ) : (
            <>
              {filtered.map((item) => (
                <li key={item._id}>
                  <button type="button"
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2"
                    onMouseDown={(e) => { e.preventDefault(); onChange(item.label, item.price, item._id); setQuery(item.label); setOpen(false) }}>
                    <span className="flex-1 truncate font-medium">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{item.category}</span>
                  </button>
                </li>
              ))}
              <li className="border-t border-gray-100 dark:border-gray-700">
                <button type="button"
                  className="w-full text-left px-3 py-2 flex items-center gap-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-xs font-medium"
                  onMouseDown={(e) => { e.preventDefault(); onChange(query); setOpen(false) }}>
                  <Plus className="h-3.5 w-3.5" />Add new item
                </button>
              </li>
            </>
          )}
        </ul>
      )}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  onSuccess?: () => void
  customerId?: string
  customerName?: string
  sideMark?: string
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CreateInvoiceModal({ open, onOpenChange, onCreated, onSuccess }: Props) {
  const { token } = useAuthStore()

  // Customer
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [showCustomerDrop, setShowCustomerDrop] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Meta
  const [sideMark, setSideMark] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [status, setStatus] = useState<'SENT' | 'DRAFT'>('SENT')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [taxRate, setTaxRate] = useState('8.25')
  const [shipping, setShipping] = useState('')
  const [installation, setInstallation] = useState('')
  const [deposit, setDeposit] = useState('')

  // Addresses
  const [billStreet, setBillStreet] = useState('')
  const [billCity, setBillCity] = useState('')
  const [billState, setBillState] = useState('')
  const [billZip, setBillZip] = useState('')
  const [shipStreet, setShipStreet] = useState('')
  const [shipCity, setShipCity] = useState('')
  const [shipState, setShipState] = useState('')
  const [shipZip, setShipZip] = useState('')
  const [shipSameAsBill, setShipSameAsBill] = useState(false)

  // Notes
  const [noteToCustomer, setNoteToCustomer] = useState(
    'Payment Terms: A 50% deposit is required to initiate the order. The remaining 50% balance is due before installation. No installation will be scheduled without full payment received in advance.'
  )
  const [internalNotes, setInternalNotes] = useState('')
  const [memoOnStatement, setMemoOnStatement] = useState('')

  // Payment
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId | null>(null)

  // Line items & inventory
  const [items, setItems] = useState<LineItem[]>([emptyItem()])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  // Form state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Sync ship → bill when "same" checked ─────────────────────────────────
  useEffect(() => {
    if (!shipSameAsBill) return
    setShipStreet(billStreet)
    setShipCity(billCity)
    setShipState(billState)
    setShipZip(billZip)
  }, [shipSameAsBill, billStreet, billCity, billState, billZip])

  // ── Fetch customers ───────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    if (!token) return
    setCustomersLoading(true)
    try {
      const res = await fetch('/api/customers', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setCustomers(
          (data.customers ?? []).map((c: any) => ({
            id: c.id,
            name: c.name || `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.sideMark || 'Unknown',
            sideMark: c.sideMark ?? '',
            email: c.email,
            street: c.street,
            city: c.city,
            state: c.town,
            postcode: c.postcode,
          }))
        )
      }
    } catch { setCustomers([]) }
    finally { setCustomersLoading(false) }
  }, [token])

  // ── Fetch inventory items ─────────────────────────────────────────────────
  const fetchInventory = useCallback(async () => {
    if (!token) return
    try {
      const [fabRes, casRes, comRes] = await Promise.all([
        fetch('/api/inventory/fabrics',    { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/inventory/cassettes',  { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/inventory/components', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const [fabData, casData, comData] = await Promise.all([fabRes.json(), casRes.json(), comRes.json()])
      const combined: InventoryItem[] = [
        ...(fabData.fabrics ?? []).map((f: any) => ({
          _id: f._id,
          name: f.name,
          label: [f.name, f.colorName, f.fabricCode].filter(Boolean).join(' — '),
          category: 'Fabric',
          price: undefined,
        })),
        ...(casData.cassettes ?? []).map((c: any) => ({
          _id: c._id,
          name: c.type,
          label: [c.type, c.color, c.specs].filter(Boolean).join(' — '),
          category: 'Cassette',
          price: undefined,
        })),
        ...(comData.components ?? []).map((c: any) => ({
          _id: c._id,
          name: c.name,
          label: c.name,
          category: 'Component',
          price: undefined,
        })),
      ]
      setInventoryItems(combined)
    } catch { /* non-critical */ }
  }, [token])

  useEffect(() => {
    if (open) { fetchCustomers(); fetchInventory() }
  }, [open, fetchCustomers, fetchInventory])

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
    if (c.street) {
      setBillStreet(c.street); setBillCity(c.city ?? ''); setBillState(c.state ?? ''); setBillZip(c.postcode ?? '')
    }
    setShowCustomerDrop(false)
  }

  // ── Line item helpers ─────────────────────────────────────────────────────
  const updateItem = (index: number, patch: Partial<LineItem>) => {
    setItems((prev) => {
      const next = [...prev]
      const updated = { ...next[index], ...patch }
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

  // ── Totals ────────────────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0)
  const taxableSubtotal = items.filter(i => i.taxable).reduce((sum, i) => sum + i.totalPrice, 0)
  const taxRateNum = parseFloat(taxRate) || 0
  const taxAmount = parseFloat(((taxableSubtotal * taxRateNum) / 100).toFixed(2))
  const shippingNum = parseFloat(shipping) || 0
  const installationNum = parseFloat(installation) || 0
  const depositNum = parseFloat(deposit) || 0
  const invoiceTotal = subtotal + taxAmount + shippingNum + installationNum
  const paymentMethod = PAYMENT_METHODS.find(p => p.id === selectedPayment)
  const processingFee = paymentMethod && paymentMethod.surcharge > 0
    ? parseFloat((invoiceTotal * paymentMethod.surcharge / 100).toFixed(2))
    : 0
  const grandTotal = invoiceTotal + processingFee

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setCustomerSearch(''); setSelectedCustomer(null); setSideMark(''); setPoNumber('')
    setStatus('SENT'); setInvoiceDate(''); setDueDate(''); setTaxRate('8.25')
    setShipping(''); setInstallation(''); setDeposit(''); setShipSameAsBill(false); setSelectedPayment(null)
    setBillStreet(''); setBillCity(''); setBillState(''); setBillZip('')
    setShipStreet(''); setShipCity(''); setShipState(''); setShipZip('')
    setNoteToCustomer('Payment Terms: A 50% deposit is required to initiate the order. The remaining 50% balance is due before installation. No installation will be scheduled without full payment received in advance.')
    setInternalNotes(''); setMemoOnStatement('')
    setItems([emptyItem()]); setError(null); setShowCustomerDrop(false)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError(null)
    const customerName = selectedCustomer?.name ?? customerSearch.trim()
    if (!customerName) { setError('Please select or enter a customer name.'); return }
    if (dueDate && invoiceDate && dueDate < invoiceDate) {
      setError('Due date cannot be before the invoice date.'); return
    }
    const filledItems = items.filter((i) => i.productName.trim())
    if (filledItems.length === 0) { setError('Add at least one line item with a product name.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customerId: selectedCustomer?.id,
          customerName,
          sideMark: sideMark.trim() || undefined,
          poNumber: poNumber.trim() || undefined,
          invoiceDate: invoiceDate || undefined,
          dueDate: dueDate || undefined,
          items: filledItems.map((i) => ({
            productName: i.productName.trim(),
            description: i.description.trim() || undefined,
            quantity: parseFloat(i.quantity) || 1,
            unitPrice: parseFloat(i.unitPrice) || 0,
            totalPrice: i.totalPrice,
            taxable: i.taxable,
            inventoryId: i.inventoryId,
          })),
          taxRate: taxRateNum,
          shipping: shippingNum || undefined,
          installation: installationNum || undefined,
          deposit: depositNum || undefined,
          processingFee: processingFee || undefined,
          paymentMethod: selectedPayment || undefined,
          notes: noteToCustomer.trim() || undefined,
          internalNotes: internalNotes.trim() || undefined,
          memo: memoOnStatement.trim() || undefined,
          status,
          billToStreet: billStreet.trim() || undefined,
          billToCity: billCity.trim() || undefined,
          billToState: billState.trim() || undefined,
          billToPostcode: billZip.trim() || undefined,
          shipToStreet: shipStreet.trim() || undefined,
          shipToCity: shipCity.trim() || undefined,
          shipToState: shipState.trim() || undefined,
          shipToPostcode: shipZip.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create invoice'); return }
      if (onCreated) onCreated()
      if (onSuccess) await onSuccess()
      onOpenChange(false)
      resetForm()
    } catch { setError('Network error. Please try again.') }
    finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm() }}>
      <DialogContent className="max-w-5xl max-h-[94vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-lg font-semibold">Create Invoice</DialogTitle>
          <DialogDescription>Fill in the details below to create a new invoice.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-6">

            {/* ── Customer + Meta ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Customer search */}
              <div className="space-y-1.5 relative">
                <Label>Customer *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    className="pl-9 pr-8"
                    placeholder="Search customer…"
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); setSelectedCustomer(null); setShowCustomerDrop(true) }}
                    onFocus={() => setShowCustomerDrop(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDrop(false), 150)}
                    autoComplete="off"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                {showCustomerDrop && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {customersLoading
                      ? <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading…</div>
                      : filteredCustomers.length === 0
                      ? <div className="px-3 py-2.5 text-sm text-muted-foreground">No customers found</div>
                      : filteredCustomers.map((c) => (
                          <button key={c.id} type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                            onMouseDown={() => selectCustomer(c)}>
                            <span className="font-medium flex-1 truncate">{c.name}</span>
                            {c.sideMark && <Badge variant="outline" className="text-[10px] h-4 shrink-0">{c.sideMark}</Badge>}
                          </button>
                        ))
                    }
                  </div>
                )}
                {selectedCustomer?.email && <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Invoice No.</Label>
                <Input placeholder="Auto-generated" disabled className="bg-muted/40" />
              </div>

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as 'SENT' | 'DRAFT')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SENT">Sent (Unpaid)</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Invoice Date</Label>
                <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} min={invoiceDate || undefined}
                  onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Side Mark</Label>
                <Input placeholder="e.g. 123 Main St" value={sideMark} onChange={(e) => setSideMark(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>P.O. Number <span className="text-[10px] text-muted-foreground font-normal">(hidden)</span></Label>
                <Input placeholder="Purchase order #" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
              </div>
            </div>

            {/* ── Addresses ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AddressBlock
                label="Bill To"
                street={billStreet} city={billCity} state={billState} postcode={billZip}
                onStreetChange={setBillStreet}
                onSelect={() => {}}
                onCityChange={setBillCity}
                onStateChange={setBillState}
                onPostcodeChange={setBillZip}
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ship / Deliver To</p>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={shipSameAsBill}
                      onChange={(e) => setShipSameAsBill(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300 accent-amber-500"
                    />
                    Same as Bill To
                  </label>
                </div>
                <AddressAutocomplete
                  value={shipStreet}
                  onChange={(v) => { if (!shipSameAsBill) setShipStreet(v) }}
                  onSelect={(a) => {
                    if (!shipSameAsBill) {
                      setShipStreet(a.street); setShipCity(a.city); setShipState(a.state); setShipZip(a.postalCode)
                    }
                  }}
                  placeholder="Street address…"
                  disabled={shipSameAsBill}
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="City" value={shipCity} onChange={(e) => { if (!shipSameAsBill) setShipCity(e.target.value) }} disabled={shipSameAsBill} className="h-8 text-sm col-span-1" />
                  <Input placeholder="State" value={shipState} onChange={(e) => { if (!shipSameAsBill) setShipState(e.target.value) }} disabled={shipSameAsBill} className="h-8 text-sm" />
                  <Input placeholder="ZIP" value={shipZip} onChange={(e) => { if (!shipSameAsBill) setShipZip(e.target.value) }} disabled={shipSameAsBill} className="h-8 text-sm" />
                </div>
              </div>
            </div>

            {/* ── Product or Service ───────────────────────────────────── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Product or Service</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Add line
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="hidden md:grid bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  style={{ gridTemplateColumns: '2.2fr 2fr 56px 88px 88px 36px 32px' }}>
                  <span># Product / Service</span>
                  <span>Description</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Rate</span>
                  <span className="text-right">Amount</span>
                  <span className="text-center">Tax</span>
                  <span />
                </div>

                <div className="divide-y">
                  {items.map((item, i) => (
                    <div key={i}>
                      {/* Desktop */}
                      <div className="hidden md:grid px-3 py-2.5 gap-2 items-center"
                        style={{ gridTemplateColumns: '2.2fr 2fr 56px 88px 88px 36px 32px' }}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
                          <ItemCombobox
                            value={item.productName}
                            items={inventoryItems}
                            onChange={(name, price, id) => updateItem(i, {
                              productName: name,
                              unitPrice: price ? String(price) : item.unitPrice,
                              inventoryId: id,
                            })}
                          />
                        </div>
                        <Input placeholder="Description" value={item.description}
                          onChange={(e) => updateItem(i, { description: e.target.value })}
                          className="h-8 text-sm" />
                        <Input type="number" min="1" placeholder="1" value={item.quantity}
                          onChange={(e) => updateItem(i, { quantity: e.target.value })}
                          className="h-8 text-sm text-center" />
                        <Input type="number" min="0" step="0.01" placeholder="0.00" value={item.unitPrice}
                          onChange={(e) => updateItem(i, { unitPrice: e.target.value })}
                          className="h-8 text-sm text-right" />
                        <span className="text-sm font-medium text-right tabular-nums pr-1">
                          {formatCurrency(item.totalPrice)}
                        </span>
                        <div className="flex items-center justify-center">
                          <input type="checkbox" checked={item.taxable}
                            onChange={(e) => updateItem(i, { taxable: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 accent-amber-500 cursor-pointer" />
                        </div>
                        <Button type="button" variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => removeItem(i)} disabled={items.length === 1}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Mobile */}
                      <div className="md:hidden px-3 py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                          <Button type="button" variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500"
                            onClick={() => removeItem(i)} disabled={items.length === 1}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <ItemCombobox value={item.productName} items={inventoryItems}
                          onChange={(name, price, id) => updateItem(i, { productName: name, unitPrice: price ? String(price) : item.unitPrice, inventoryId: id })} />
                        <Input placeholder="Description" value={item.description}
                          onChange={(e) => updateItem(i, { description: e.target.value })} className="h-8 text-sm" />
                        <div className="flex gap-2 items-center">
                          <Input type="number" min="1" placeholder="Qty" value={item.quantity}
                            onChange={(e) => updateItem(i, { quantity: e.target.value })} className="h-8 text-sm text-center w-16" />
                          <span className="text-muted-foreground text-sm">×</span>
                          <Input type="number" min="0" step="0.01" placeholder="Rate" value={item.unitPrice}
                            onChange={(e) => updateItem(i, { unitPrice: e.target.value })} className="h-8 text-sm flex-1" />
                          <span className="text-sm font-semibold w-20 text-right tabular-nums">{formatCurrency(item.totalPrice)}</span>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                          <input type="checkbox" checked={item.taxable}
                            onChange={(e) => updateItem(i, { taxable: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 accent-amber-500" />
                          Taxable
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Bottom: Notes + Totals ───────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Notes */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="noteToCustomer">Note to customer</Label>
                  <Textarea id="noteToCustomer" rows={4}
                    placeholder="Visible to the customer on the invoice…"
                    value={noteToCustomer} onChange={(e) => setNoteToCustomer(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="internalNotes">
                    Internal customer notes
                    <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(hidden)</span>
                  </Label>
                  <Textarea id="internalNotes" rows={2}
                    placeholder="Only visible to you…"
                    value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="memo">
                    Memo on statement
                    <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(hidden)</span>
                  </Label>
                  <Textarea id="memo" rows={2}
                    placeholder="Appears on statement, not on invoice…"
                    value={memoOnStatement} onChange={(e) => setMemoOnStatement(e.target.value)} />
                </div>
              </div>

              {/* Totals + Payment */}
              <div className="space-y-5">
                {/* Totals */}
                <div className="space-y-2.5 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground shrink-0">Sales tax %</span>
                    <Input type="number" min="0" max="100" step="0.01"
                      value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                      className="h-7 text-sm w-20 text-right" />
                    <span className="text-muted-foreground ml-auto tabular-nums">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground shrink-0">Shipping</span>
                    <Input type="number" min="0" step="0.01" placeholder="0.00"
                      value={shipping} onChange={(e) => setShipping(e.target.value)}
                      className="h-7 text-sm w-20 text-right" />
                    <span className="text-muted-foreground ml-auto tabular-nums">{formatCurrency(shippingNum)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground shrink-0">Installation</span>
                    <Input type="number" min="0" step="0.01" placeholder="0.00"
                      value={installation} onChange={(e) => setInstallation(e.target.value)}
                      className="h-7 text-sm w-20 text-right" />
                    <span className="text-muted-foreground ml-auto tabular-nums">{formatCurrency(installationNum)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="font-semibold text-sm">Invoice total</span>
                    <span className="font-bold tabular-nums">{formatCurrency(invoiceTotal)}</span>
                  </div>
                  {processingFee > 0 && (
                    <div className="flex items-center justify-between text-sm text-amber-600 dark:text-amber-400">
                      <span>{paymentMethod?.label} processing fee ({paymentMethod?.surcharge}%)</span>
                      <span className="tabular-nums">+{formatCurrency(processingFee)}</span>
                    </div>
                  )}
                  {processingFee > 0 && (
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="font-bold text-sm">Grand total</span>
                      <span className="text-lg font-bold tabular-nums">{formatCurrency(grandTotal)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm border-t pt-2">
                    <span className="text-muted-foreground shrink-0">Deposit</span>
                    <Input type="number" min="0" step="0.01" placeholder="0.00"
                      value={deposit} onChange={(e) => setDeposit(e.target.value)}
                      className="h-7 text-sm w-20 text-right" />
                    <span className="text-muted-foreground ml-auto tabular-nums">{formatCurrency(depositNum)}</span>
                  </div>
                </div>

                {/* Customer payment options */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Customer payment options</Label>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Select the customer&rsquo;s payment method. A processing fee will be added for card payments.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map(({ id, label, surcharge, Logo }) => {
                      const active = selectedPayment === id
                      return (
                        <button key={id} type="button"
                          onClick={() => setSelectedPayment(active ? null : id)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all',
                            active
                              ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 shadow-sm'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          )}
                        >
                          <Logo />
                          <div className="text-center">
                            <p className="text-[10px] font-medium leading-none">{label}</p>
                            <p className={cn(
                              'text-[9px] mt-0.5 leading-none',
                              surcharge === 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                            )}>
                              {surcharge === 0 ? 'Free' : `+${surcharge}%`}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
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
            <Button type="button" variant="outline"
              onClick={() => { onOpenChange(false); resetForm() }} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600 text-white border-0">
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
