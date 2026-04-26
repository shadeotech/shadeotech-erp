'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Zap, User, Phone, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { sanitizePhoneInput, validatePhone } from '@/lib/phoneValidation'
import { useQuickQuoteStore } from '@/stores/quickQuoteStore'
import { usePricingChartStore, type CollectionId } from '@/stores/pricingChartStore'
import { useQuotesStore } from '@/stores/quotesStore'
import { useAuthStore } from '@/stores/authStore'
import { DECIMAL_FRACTIONS, QUOTE_COLLECTIONS } from '@/lib/quoteConstants'
import { cn } from '@/lib/utils'

interface LineItemForm {
  id: string
  widthWhole: string
  widthDecimal: string
  lengthWhole: string
  lengthDecimal: string
  collectionId: string
  quantity: string
  operation: 'Manual' | 'Motorized'
}

const emptyLine = (): LineItemForm => ({
  id: Math.random().toString(36).slice(2, 9),
  widthWhole: '',
  widthDecimal: '0',
  lengthWhole: '',
  lengthDecimal: '0',
  collectionId: '',
  quantity: '1',
  operation: 'Manual',
})

interface QuickQuoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

function findClosest(value: number, array: number[]) {
  return array.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  )
}

export function QuickQuoteModal({ open, onOpenChange, onSaved }: QuickQuoteModalProps) {
  const { addQuickQuote, getInstallationFee, getTaxRate } = useQuickQuoteStore()
  const { getChart, fetchCharts } = usePricingChartStore()
  const { globalAdjust } = useQuotesStore()
  const { token } = useAuthStore()

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientPhoneError, setClientPhoneError] = useState<string | undefined>()
  const [lines, setLines] = useState<LineItemForm[]>([emptyLine()])

  const defaultInstallationFee = getInstallationFee()
  const [installationFee, setInstallationFee] = useState<number>(defaultInstallationFee)
  const taxRate = getTaxRate()

  useEffect(() => {
    if (token && open) {
      fetchCharts(token)
    }
  }, [token, open, fetchCharts])

  const addLine = () => setLines((prev) => [...prev, emptyLine()])

  const removeLine = (id: string) => {
    if (lines.length <= 1) return
    setLines((prev) => prev.filter((l) => l.id !== id))
  }

  const updateLine = (id: string, updates: Partial<LineItemForm>) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    )
  }

  const calcLinePrice = (line: LineItemForm): number => {
    const wholeW = parseFloat(line.widthWhole) || 0
    const decW = parseFloat(line.widthDecimal) || 0
    const wholeL = parseFloat(line.lengthWhole) || 0
    const decL = parseFloat(line.lengthDecimal) || 0
    const width = wholeW + decW
    const length = wholeL + decL
    if (!line.collectionId || width <= 0 || length <= 0) return 0

    const chart = getChart(line.collectionId as CollectionId)
    if (!chart) return 0

    const widthRounded = Math.round(width)
    const lengthRounded = Math.round(length)
    const closestWidth = findClosest(widthRounded, chart.mainTable.widthValues)
    const closestLength = findClosest(lengthRounded, chart.mainTable.lengthValues)

    let basePrice = chart.mainTable.prices[String(closestLength)]?.[String(closestWidth)] || 0

    if (line.operation === 'Motorized' && chart.cassetteTable) {
      const cassetteType = 'ROUND CASETTE'
      const cassettePrice = chart.cassetteTable.prices[cassetteType]?.[String(closestWidth)] || 0
      basePrice += cassettePrice
    }

    return basePrice * (1 + globalAdjust.percent / 100) + globalAdjust.flat
  }

  const getFullWidth = (line: LineItemForm) => {
    const whole = parseFloat(line.widthWhole) || 0
    const decimal = parseFloat(line.widthDecimal) || 0
    return whole + decimal
  }

  const getFullLength = (line: LineItemForm) => {
    const whole = parseFloat(line.lengthWhole) || 0
    const decimal = parseFloat(line.lengthDecimal) || 0
    return whole + decimal
  }

  const { items, subtotal, taxAmount, totalAmount } = useMemo(() => {
    const validItems: { item: LineItemForm; unitPrice: number; totalPrice: number }[] = []
    for (const line of lines) {
      const w = getFullWidth(line)
      const len = getFullLength(line)
      const qty = parseInt(line.quantity, 10) || 1
      if (!line.collectionId || w <= 0 || len <= 0) continue
      const unitPrice = calcLinePrice(line)
      validItems.push({ item: line, unitPrice, totalPrice: unitPrice * qty })
    }
    const itemsSubtotal = validItems.reduce((s, i) => s + i.totalPrice, 0)
    const beforeTax = itemsSubtotal + installationFee
    const tax = beforeTax * (taxRate / 100)
    const total = beforeTax + tax
    return {
      items: validItems,
      subtotal: itemsSubtotal,
      taxAmount: tax,
      totalAmount: total,
    }
  }, [lines, installationFee, taxRate, getChart, globalAdjust.percent, globalAdjust.flat])

  const handleSave = () => {
    if (!clientName.trim()) {
      alert('Please enter the client name.')
      return
    }
    if (!clientPhone.trim()) {
      alert('Please enter the client phone number.')
      return
    }
    const phoneErr = validatePhone(clientPhone)
    if (phoneErr) {
      setClientPhoneError(phoneErr)
      alert(phoneErr)
      return
    }
    if (items.length === 0) {
      alert('Please add at least one valid line (size, product, qty, operation).')
      return
    }

    const quickQuoteItems = items.map(({ item, unitPrice, totalPrice }) => ({
      id: item.id,
      product: QUOTE_COLLECTIONS.find((c) => c.id === item.collectionId)?.name || item.collectionId,
      width: getFullWidth(item),
      length: getFullLength(item),
      quantity: parseInt(item.quantity, 10) || 1,
      operation: item.operation,
      unitPrice,
      totalPrice,
    }))

    addQuickQuote({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      items: quickQuoteItems,
      subtotal,
      installationFee,
      taxAmount,
      totalAmount,
    })

    setClientName('')
    setClientPhone('')
    setClientPhoneError(undefined)
    setLines([emptyLine()])
    onOpenChange(false)
    onSaved?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden p-0 gap-0">
        {/* Header */}
        <DialogHeader className="border-b px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold leading-tight">Quick Estimate</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Ballpark estimate for phone calls — includes installation and tax.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Client info */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client Name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="John Smith"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone Number</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="(555) 123-4567"
                  value={clientPhone}
                  onChange={(e) => {
                    const v = sanitizePhoneInput(e.target.value)
                    setClientPhone(v)
                    setClientPhoneError(validatePhone(v))
                  }}
                  onBlur={() => setClientPhoneError(validatePhone(clientPhone))}
                  className={cn('pl-8 h-9', clientPhoneError && 'border-destructive')}
                />
              </div>
              {clientPhoneError && <p className="text-xs text-destructive mt-1">{clientPhoneError}</p>}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Items
              </span>
              {lines.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs rounded-full">
                  {lines.length}
                </Badge>
              )}
            </div>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Line items — table layout */}
          <div className="space-y-0.5">
            {/* Column headers */}
            <div
              className="grid items-end gap-2 px-1 pb-1.5"
              style={{ gridTemplateColumns: '1.25rem 1.75fr 1.75fr 2.5rem 2fr 7.5rem 4.5rem 1.5rem' }}
            >
              <span />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Width (in)</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Length (in)</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Qty</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Product</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Operation</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground text-right">Total</span>
              <span />
            </div>

            {lines.map((line, index) => {
              const linePrice = calcLinePrice(line)
              const qty = parseInt(line.quantity, 10) || 1
              const lineTotal = linePrice * qty
              const hasPrice = linePrice > 0

              return (
                <div
                  key={line.id}
                  className="grid items-center gap-2 py-1 px-1 rounded-lg hover:bg-muted/40 transition-colors"
                  style={{ gridTemplateColumns: '1.25rem 1.75fr 1.75fr 2.5rem 2fr 7.5rem 4.5rem 1.5rem' }}
                >
                  {/* Row number */}
                  <span className="text-xs font-medium text-muted-foreground text-center select-none">
                    {index + 1}
                  </span>

                  {/* Width: whole + fraction */}
                  <div className="flex items-center gap-1 min-w-0">
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={line.widthWhole || ''}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '' || v === '-') {
                          updateLine(line.id, { widthWhole: v === '-' ? '' : v })
                          return
                        }
                        const n = parseFloat(v)
                        if (!Number.isNaN(n) && n >= 0) updateLine(line.id, { widthWhole: v })
                      }}
                      className="h-8 w-0 flex-1 min-w-0 text-sm px-2"
                    />
                    <Select
                      value={line.widthDecimal}
                      onValueChange={(v) => updateLine(line.id, { widthDecimal: v })}
                    >
                      <SelectTrigger className="h-8 w-16 shrink-0 text-xs px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DECIMAL_FRACTIONS.map((frac) => (
                          <SelectItem key={frac.value} value={frac.value}>{frac.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Length: whole + fraction */}
                  <div className="flex items-center gap-1 min-w-0">
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={line.lengthWhole || ''}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '' || v === '-') {
                          updateLine(line.id, { lengthWhole: v === '-' ? '' : v })
                          return
                        }
                        const n = parseFloat(v)
                        if (!Number.isNaN(n) && n >= 0) updateLine(line.id, { lengthWhole: v })
                      }}
                      className="h-8 w-0 flex-1 min-w-0 text-sm px-2"
                    />
                    <Select
                      value={line.lengthDecimal}
                      onValueChange={(v) => updateLine(line.id, { lengthDecimal: v })}
                    >
                      <SelectTrigger className="h-8 w-16 shrink-0 text-xs px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DECIMAL_FRACTIONS.map((frac) => (
                          <SelectItem key={frac.value} value={frac.value}>{frac.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Qty */}
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.id, { quantity: e.target.value })}
                    className="h-8 text-sm text-center px-1"
                  />

                  {/* Product */}
                  <Select
                    value={line.collectionId}
                    onValueChange={(v) => updateLine(line.id, { collectionId: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Product…" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUOTE_COLLECTIONS.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Operation */}
                  <Select
                    value={line.operation}
                    onValueChange={(v) => updateLine(line.id, { operation: v as 'Manual' | 'Motorized' })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="Motorized">Motorized</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Line total */}
                  <span className={cn(
                    'text-sm font-semibold text-right tabular-nums',
                    hasPrice ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {hasPrice ? formatCurrency(lineTotal) : '—'}
                  </span>

                  {/* Remove */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length <= 1}
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLine}
              className="w-full mt-2 border-dashed text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Item
            </Button>
          </div>

          {/* Summary */}
          {totalAmount > 0 && (
            <div className="rounded-xl border bg-muted/20 overflow-hidden">
              <div className="px-4 py-3 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Items subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Installation</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={installationFee}
                      onChange={(e) => setInstallationFee(parseFloat(e.target.value) || 0)}
                      className="w-20 h-6 text-xs text-right border rounded px-1 bg-background"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax ({taxRate}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              </div>
              <div className="border-t bg-muted/40 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Estimated Total</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4 shrink-0 sm:justify-between gap-2">
          <p className="hidden sm:block text-xs text-muted-foreground self-center">
            Saved to Quick Estimates list — convert to a real estimate when ready.
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 sm:flex-none">
              Save Estimate
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
