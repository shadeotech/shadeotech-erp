'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Save, Calculator, Copy, ChevronLeft, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { PRODUCT_CATEGORIES } from '@/constants'
import Image from 'next/image'
import type { Fabric } from '@/types/fabric'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Decimal fractions for width and length
const decimalFractions = [
  { value: '0', label: '0' },
  { value: '0.125', label: '1/8' },
  { value: '0.25', label: '1/4' },
  { value: '0.375', label: '3/8' },
  { value: '0.5', label: '1/2' },
  { value: '0.625', label: '5/8' },
  { value: '0.75', label: '3/4' },
  { value: '0.875', label: '7/8' },
  { value: '1', label: '1' },
]

// Room types
const roomTypes = [
  'Bedroom', 'Washroom', 'Gaming Room', 'Living Room', 'Dining Room',
  'Kitchen', 'Office', 'Nursery', 'Guest Room', 'Master Bedroom', 'Bathroom', 'Other',
]

const controlTypes = ['Manual', 'Motorized']
const chainCordOptions = ['Chain', 'Cord']
const controlColors = ['White', 'Black', 'Ivory', 'Beige', 'Gray', 'Brown', 'Other']
const controlSides = ['Left', 'Right']
const mountTypes = ['Inside', 'Outside']
const cassetteColors = ['Black', 'White', 'Ivory', 'Beige', 'Gray', 'Brown', 'Other']
const bottomRailTypes = ['Sealed', 'Open', 'Standard']
const bottomRailColors = ['Black', 'White', 'Ivory', 'Beige', 'Gray', 'Brown', 'Other']

const mockFabrics: Fabric[] = [
  { id: '1', category: 'Duo Shades', subcategory: 'Light Filtering', color: 'White', collection: 'RL', imageFilename: 'white.jpg' },
  { id: '2', category: 'Duo Shades', subcategory: 'Light Filtering', color: 'Sunrise', collection: 'RL', imageFilename: 'Sunrise.jpg' },
  { id: '3', category: 'Duo Shades', subcategory: 'Light Filtering', color: 'Sand', collection: 'RL', imageFilename: 'Sand.jpg' },
  { id: '4', category: 'Duo Shades', subcategory: 'Light Filtering', color: 'Fossil', collection: 'RL', imageFilename: 'Fossil.jpg' },
  { id: '5', category: 'Duo Shades', subcategory: 'Light Filtering', color: 'Stone Grey', collection: 'RL', imageFilename: 'Stone_Grey.jpg' },
  { id: '6', category: 'Duo Shades', subcategory: 'Light Filtering', color: 'Graphite', collection: 'RL', imageFilename: 'Graphite.jpg' },
  { id: '7', category: 'Duo Shades', subcategory: 'Light Filtering', color: 'Slate', collection: 'RL', imageFilename: 'Slate.jpg' },
  { id: '8', category: 'Duo Shades', subcategory: 'Light Filtering', color: 'Sunset', collection: 'RL', imageFilename: 'Sunset.jpg' },
  { id: '9', category: 'Duo Shades', subcategory: 'Light Filtering', color: 'Mahogany', collection: 'RL', imageFilename: 'Mahogany.jpg' },
  { id: '10', category: 'Duo Shades', subcategory: 'Light Filtering', color: 'Obsidian', collection: 'RL', imageFilename: 'Obsisian.jpg' },
  { id: '11', category: 'Duo Shades', subcategory: 'Light Filtering', color: 'Onyx', collection: 'RL', imageFilename: 'Onyx.jpg' },
  { id: '12', category: 'Roller Shades', subcategory: 'Blackout', color: 'White Snow', collection: 'SH-YB-Allure', imageFilename: 'White_Snow.png' },
  { id: '13', category: 'Roller Shades', subcategory: 'Blackout', color: 'Lite Sundew', collection: 'SH-YB-Allure', imageFilename: 'Lite_Sundew.png' },
  { id: '14', category: 'Roller Shades', subcategory: 'Blackout', color: 'Mystic Gray', collection: 'SH-YB-Allure', imageFilename: 'Mystic_Gray.png' },
  { id: '15', category: 'Roller Shades', subcategory: 'Blackout', color: 'Brown Penny', collection: 'SH-YB-Allure', imageFilename: 'Brown_Penny.png' },
  { id: '16', category: 'Roller Shades', subcategory: 'Blackout', color: 'Blackore', collection: 'SH-YB-Allure', imageFilename: 'Blacklore.png' },
  { id: '17', category: 'Roller Shades', subcategory: 'Blackout', color: 'Ivory Cream', collection: 'SH-YB-Allure', imageFilename: 'Ivory_Cream.png' },
  { id: '18', category: 'Roller Shades', subcategory: 'Light Filtering', color: 'White Floral', collection: 'SH-YL-Cannes', imageFilename: 'White_Floral.png' },
  { id: '19', category: 'Roller Shades', subcategory: 'Light Filtering', color: 'Tan Floral', collection: 'SH-YL-Cannes', imageFilename: 'Tan_Floral.png' },
  { id: '20', category: 'Roller Shades', subcategory: 'Light Filtering', color: 'Black Floral', collection: 'SH-YL-Cannes', imageFilename: 'Black_Floral.png' },
]

interface EstimateItem {
  id: string
  product: string
  roomType: string
  quantity: number
  widthWhole: number
  widthDecimal: string
  lengthWhole: number
  lengthDecimal: string
  controlType: string
  chainCord: string
  controlColor: string
  controlSide: string
  mount: string
  fabric: string
  cassetteColor: string
  cassetteWrapped: boolean
  bottomRailType: string
  bottomRailColor: string
  brackets: string
  options: string
  unitPrice: number
}

export default function NewEstimatePage() {
  const router = useRouter()
  const [items, setItems] = useState<EstimateItem[]>([])
  const [notes, setNotes] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [installationDate, setInstallationDate] = useState('')
  const [sideMark, setSideMark] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const getFullWidth = (item: EstimateItem): number =>
    item.widthWhole + parseFloat(item.widthDecimal || '0')

  const getFullLength = (item: EstimateItem): number =>
    item.lengthWhole + parseFloat(item.lengthDecimal || '0')

  const addItem = () => {
    const newItem: EstimateItem = {
      id: `item-${Date.now()}`,
      product: '',
      roomType: '',
      quantity: 1,
      widthWhole: 0,
      widthDecimal: '0',
      lengthWhole: 0,
      lengthDecimal: '0',
      controlType: '',
      chainCord: '',
      controlColor: '',
      controlSide: '',
      mount: '',
      fabric: '',
      cassetteColor: '',
      cassetteWrapped: false,
      bottomRailType: '',
      bottomRailColor: '',
      brackets: '',
      options: '',
      unitPrice: 0,
    }
    setItems([...items, newItem])
  }

  const duplicateItem = (id: string) => {
    const itemToDuplicate = items.find(item => item.id === id)
    if (itemToDuplicate) {
      const duplicated: EstimateItem = { ...itemToDuplicate, id: `item-${Date.now()}` }
      setItems([...items, duplicated])
    }
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
    setExpandedItems(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const updateItem = (id: string, field: keyof EstimateItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const getSelectedFabric = (fabricId: string): Fabric | undefined =>
    mockFabrics.find(f => f.id === fabricId)

  const getFabricImagePath = (filename: string): string => {
    if (filename === 'white.jpg' || filename.includes('X-Weave')) return '/images/fabrics/white.jpg'
    return `/images/fabrics/${filename}`
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const width = getFullWidth(item)
      const length = getFullLength(item)
      const area = (width * length) / 144
      return sum + area * item.quantity * item.unitPrice
    }, 0)
  }, [items])

  const tax = subtotal * 0.08
  const total = subtotal + tax

  const handleSave = () => {
    if (items.length === 0) {
      alert('Please add at least one item to the estimate')
      return
    }
    if (!customerName.trim()) {
      alert('Please enter customer name')
      return
    }
    console.log('Saving estimate:', { customerName, customerId, installationDate, sideMark, items, notes, subtotal, tax, total })
    router.push('/dealer/estimates')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dealer/estimates" className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Calculator className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold leading-tight truncate">Create Estimate</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Ballpark estimate before placing an order</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => router.push('/dealer/estimates')}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={items.length === 0 || !customerName.trim()}
            >
              <Save className="h-4 w-4 mr-1.5" />
              Save Estimate
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Client info */}
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Client Information
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Customer Name *</Label>
                  <Input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Side Mark</Label>
                  <Input
                    value={sideMark}
                    onChange={e => setSideMark(e.target.value)}
                    placeholder="Side mark (optional)"
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Customer ID</Label>
                  <Input
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    placeholder="Customer ID (optional)"
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Installation Date</Label>
                  <Input
                    type="date"
                    value={installationDate}
                    onChange={e => setInstallationDate(e.target.value)}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Items section */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              {/* Section header */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Items</span>
                  {items.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs rounded-full">
                      {items.length}
                    </Badge>
                  )}
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Column headers */}
              <div
                className="grid items-end gap-2 px-1 pb-1"
                style={{ gridTemplateColumns: '1.25rem 1fr 1fr 2.5rem 2fr 5rem 3.5rem 1.75rem 1.5rem' }}
              >
                <span />
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Width (in)</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Length (in)</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Qty</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Product</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">$/sq ft</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground text-right">Total</span>
                <span />
                <span />
              </div>

              {/* Item rows */}
              <div className="space-y-0.5">
                {items.map((item, index) => {
                  const width = getFullWidth(item)
                  const length = getFullLength(item)
                  const area = (width * length) / 144
                  const lineTotal = area * item.quantity * item.unitPrice
                  const hasTotal = lineTotal > 0
                  const isExpanded = expandedItems.has(item.id)
                  const selectedFabric = item.fabric ? getSelectedFabric(item.fabric) : undefined

                  return (
                    <div key={item.id}>
                      {/* Primary row */}
                      <div
                        className="grid items-center gap-2 py-1 px-1 rounded-lg hover:bg-muted/30 transition-colors"
                        style={{ gridTemplateColumns: '1.25rem 1fr 1fr 2.5rem 2fr 5rem 3.5rem 1.75rem 1.5rem' }}
                      >
                        {/* Row number */}
                        <span className="text-xs font-medium text-muted-foreground text-center select-none">
                          {index + 1}
                        </span>

                        {/* Width */}
                        <div className="flex items-center gap-1 min-w-0">
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={item.widthWhole || ''}
                            onChange={e => updateItem(item.id, 'widthWhole', parseInt(e.target.value) || 0)}
                            className="h-8 w-0 flex-1 min-w-0 text-sm px-2"
                          />
                          <Select
                            value={item.widthDecimal}
                            onValueChange={v => updateItem(item.id, 'widthDecimal', v)}
                          >
                            <SelectTrigger className="h-8 w-14 shrink-0 text-xs px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {decimalFractions.map(f => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Length */}
                        <div className="flex items-center gap-1 min-w-0">
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={item.lengthWhole || ''}
                            onChange={e => updateItem(item.id, 'lengthWhole', parseInt(e.target.value) || 0)}
                            className="h-8 w-0 flex-1 min-w-0 text-sm px-2"
                          />
                          <Select
                            value={item.lengthDecimal}
                            onValueChange={v => updateItem(item.id, 'lengthDecimal', v)}
                          >
                            <SelectTrigger className="h-8 w-14 shrink-0 text-xs px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {decimalFractions.map(f => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Qty */}
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="h-8 text-sm text-center px-1"
                        />

                        {/* Product */}
                        <Select
                          value={item.product}
                          onValueChange={v => updateItem(item.id, 'product', v)}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Product…" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Unit price */}
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={item.unitPrice || ''}
                          onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-8 text-sm text-right px-2"
                        />

                        {/* Line total */}
                        <span className={cn(
                          'text-sm font-semibold text-right tabular-nums',
                          hasTotal ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {hasTotal ? formatCurrency(lineTotal) : '—'}
                        </span>

                        {/* Expand toggle */}
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id)}
                          className="h-6 w-6 shrink-0 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="More options"
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="h-6 w-6 shrink-0 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <div className="mx-1 mb-2 mt-0.5 rounded-lg border bg-muted/20 p-3 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {/* Room Type */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Room Type</Label>
                              <Select
                                value={item.roomType}
                                onValueChange={v => updateItem(item.id, 'roomType', v)}
                              >
                                <SelectTrigger className="mt-1 h-8 text-sm">
                                  <SelectValue placeholder="Room…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roomTypes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Mount */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Mount</Label>
                              <Select
                                value={item.mount}
                                onValueChange={v => updateItem(item.id, 'mount', v)}
                              >
                                <SelectTrigger className="mt-1 h-8 text-sm">
                                  <SelectValue placeholder="Mount…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mountTypes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Control Type */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Control Type</Label>
                              <div className="flex h-8 rounded-md border overflow-hidden mt-1">
                                {controlTypes.map((ct, i) => (
                                  <button
                                    key={ct}
                                    type="button"
                                    onClick={() => updateItem(item.id, 'controlType', ct)}
                                    className={cn(
                                      'flex-1 text-xs font-medium transition-colors',
                                      i > 0 && 'border-l',
                                      item.controlType === ct
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background text-muted-foreground hover:text-foreground'
                                    )}
                                  >
                                    {ct}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Chain/Cord (only for manual) */}
                            {item.controlType === 'Manual' && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Chain / Cord</Label>
                                <Select
                                  value={item.chainCord}
                                  onValueChange={v => updateItem(item.id, 'chainCord', v)}
                                >
                                  <SelectTrigger className="mt-1 h-8 text-sm">
                                    <SelectValue placeholder="Chain/Cord…" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {chainCordOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Control Color */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Control Color</Label>
                              <Select
                                value={item.controlColor}
                                onValueChange={v => updateItem(item.id, 'controlColor', v)}
                              >
                                <SelectTrigger className="mt-1 h-8 text-sm">
                                  <SelectValue placeholder="Color…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {controlColors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Control Side */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Control Side</Label>
                              <Select
                                value={item.controlSide}
                                onValueChange={v => updateItem(item.id, 'controlSide', v)}
                              >
                                <SelectTrigger className="mt-1 h-8 text-sm">
                                  <SelectValue placeholder="Side…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {controlSides.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Fabric */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                            <div className="sm:col-span-2">
                              <Label className="text-xs text-muted-foreground">Fabric</Label>
                              <Select
                                value={item.fabric}
                                onValueChange={v => updateItem(item.id, 'fabric', v)}
                              >
                                <SelectTrigger className="mt-1 h-8 text-sm">
                                  <SelectValue placeholder="Select fabric…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockFabrics.map(f => (
                                    <SelectItem key={f.id} value={f.id}>
                                      {f.color} ({f.collection})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {selectedFabric && (
                              <div className="relative w-16 h-16 border rounded overflow-hidden bg-muted shrink-0">
                                <Image
                                  src={getFabricImagePath(selectedFabric.imageFilename)}
                                  alt={selectedFabric.color}
                                  fill
                                  className="object-contain"
                                  unoptimized
                                  sizes="64px"
                                />
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* Cassette Color */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Cassette Color</Label>
                              <Select
                                value={item.cassetteColor}
                                onValueChange={v => updateItem(item.id, 'cassetteColor', v)}
                              >
                                <SelectTrigger className="mt-1 h-8 text-sm">
                                  <SelectValue placeholder="Color…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {cassetteColors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Cassette Wrapped */}
                            <div className="flex items-end gap-2 pb-1">
                              <input
                                type="checkbox"
                                id={`wrapped-${item.id}`}
                                checked={item.cassetteWrapped}
                                onChange={e => updateItem(item.id, 'cassetteWrapped', e.target.checked)}
                                className="rounded"
                              />
                              <Label htmlFor={`wrapped-${item.id}`} className="text-sm cursor-pointer">Wrapped</Label>
                            </div>

                            {/* Bottom Rail Type */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Bottom Rail Type</Label>
                              <Select
                                value={item.bottomRailType}
                                onValueChange={v => updateItem(item.id, 'bottomRailType', v)}
                              >
                                <SelectTrigger className="mt-1 h-8 text-sm">
                                  <SelectValue placeholder="Type…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {bottomRailTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Bottom Rail Color */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Bottom Rail Color</Label>
                              <Select
                                value={item.bottomRailColor}
                                onValueChange={v => updateItem(item.id, 'bottomRailColor', v)}
                              >
                                <SelectTrigger className="mt-1 h-8 text-sm">
                                  <SelectValue placeholder="Color…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {bottomRailColors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Brackets</Label>
                              <Input
                                value={item.brackets}
                                onChange={e => updateItem(item.id, 'brackets', e.target.value)}
                                placeholder="Brackets"
                                className="mt-1 h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Options</Label>
                              <Input
                                value={item.options}
                                onChange={e => updateItem(item.id, 'options', e.target.value)}
                                placeholder="Options"
                                className="mt-1 h-8 text-sm"
                              />
                            </div>
                          </div>

                          {/* Row actions */}
                          <div className="flex gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateItem(item.id)}
                              className="h-7 text-xs"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Duplicate
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Add item */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="w-full border-dashed text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Item
              </Button>
            </div>

            {/* Notes */}
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
              <Textarea
                placeholder="Add any special instructions or notes for this estimate..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
            </div>
          </div>

          {/* Right — sticky summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Price summary */}
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Estimate Summary
                  </p>
                </div>

                <div className="px-4 py-3 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Items</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Shades</span>
                    <span>{items.reduce((s, i) => s + i.quantity, 0)}</span>
                  </div>
                  {customerName && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Customer</span>
                      <span className="truncate max-w-[8rem] text-right">{customerName}</span>
                    </div>
                  )}
                  {installationDate && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Install Date</span>
                      <span>{installationDate}</span>
                    </div>
                  )}
                </div>

                {(subtotal > 0 || items.length > 0) && (
                  <div className="border-t px-4 py-3 space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax (8%)</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                  </div>
                )}

                <div className="border-t bg-muted/40 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">Estimated Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={handleSave}
                  className="w-full"
                  disabled={items.length === 0 || !customerName.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Estimate
                </Button>
                <Button variant="outline" onClick={() => router.push('/dealer/estimates')} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
