'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Plus, Trash2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

interface LineItem {
  productName: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  taxable: boolean
}

interface EditInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: any
  onSaved: () => void
}

const emptyLine = (): LineItem => ({
  productName: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
  taxable: false,
})

export function EditInvoiceModal({ open, onOpenChange, invoice, onSaved }: EditInvoiceModalProps) {
  const { token } = useAuthStore()
  const [items, setItems] = useState<LineItem[]>([])
  const [dueDate, setDueDate] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !invoice) return
    setItems(
      (invoice.items ?? []).map((it: any) => ({
        productName: it.productName ?? '',
        description: it.description ?? '',
        quantity: it.quantity ?? 1,
        unitPrice: it.unitPrice ?? 0,
        totalPrice: it.totalPrice ?? 0,
        taxable: it.taxable ?? false,
      }))
    )
    setDueDate(invoice.dueDate ? invoice.dueDate.slice(0, 10) : '')
    setTaxRate(invoice.taxRate ?? 0)
    setNotes(invoice.notes ?? '')
    setError(null)
  }, [open, invoice])

  const updateItem = useCallback((idx: number, field: keyof LineItem, value: any) => {
    setItems(prev => {
      const next = [...prev]
      const row = { ...next[idx], [field]: value }
      if (field === 'quantity' || field === 'unitPrice') {
        row.totalPrice = Number(row.quantity) * Number(row.unitPrice)
      }
      next[idx] = row
      return next
    })
  }, [])

  const addItem = () => setItems(prev => [...prev, emptyLine()])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  const subtotal = items.reduce((s, it) => s + it.totalPrice, 0)
  const taxableSubtotal = items.filter(it => it.taxable).reduce((s, it) => s + it.totalPrice, 0)
  const taxAmount = taxableSubtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const handleSave = async () => {
    if (!token || !invoice) return
    if (items.length === 0) { setError('Add at least one line item.'); return }
    if (items.some(it => !it.productName.trim())) { setError('All items need a product name.'); return }
    const invoiceDate = invoice.createdAt?.slice(0, 10) ?? ''
    if (dueDate && invoiceDate && dueDate < invoiceDate) {
      setError('Due date must be on or after the invoice date.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'update',
          items: items.map(it => ({
            productName: it.productName.trim(),
            description: it.description.trim() || undefined,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            totalPrice: it.totalPrice,
            taxable: it.taxable,
          })),
          subtotal,
          taxRate,
          taxAmount,
          totalAmount: total,
          dueDate: dueDate || null,
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Failed to save changes.')
        return
      }
      onSaved()
      onOpenChange(false)
    } catch {
      setError('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice — {invoice?.invoiceNumber}</DialogTitle>
          <DialogDescription>Update line items, due date, and notes</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Line Items</Label>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addItem}>
                <Plus className="h-3.5 w-3.5" /> Add Row
              </Button>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Product / Service</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th>
                    <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 w-16">Qty</th>
                    <th className="text-right px-2 py-2 text-xs font-semibold text-gray-500 w-24">Rate</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 w-24">Amount</th>
                    <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 w-12">Tax</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item, idx) => (
                    <tr key={idx} className="bg-white dark:bg-gray-900">
                      <td className="px-3 py-1.5">
                        <Input
                          value={item.productName}
                          onChange={e => updateItem(idx, 'productName', e.target.value)}
                          placeholder="Item name"
                          className="h-8 text-sm border-0 shadow-none focus-visible:ring-1 px-1"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                          placeholder="Optional"
                          className="h-8 text-sm border-0 shadow-none focus-visible:ring-1 px-1"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="h-8 text-sm text-center border-0 shadow-none focus-visible:ring-1 px-1 w-16"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))}
                          className="h-8 text-sm text-right border-0 shadow-none focus-visible:ring-1 px-1 w-24"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium text-gray-700 dark:text-gray-300 text-xs">
                        {formatCurrency(item.totalPrice)}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={item.taxable}
                          onChange={e => updateItem(idx, 'taxable', e.target.checked)}
                          className="h-3.5 w-3.5 accent-amber-600 cursor-pointer"
                          title="Taxable"
                        />
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-400">
                        No items — click Add Row
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-3 flex justify-end">
              <div className="w-60 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span>Tax rate</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={taxRate}
                      onChange={e => setTaxRate(Number(e.target.value))}
                      className="w-12 h-6 text-xs text-right border border-gray-200 rounded px-1 dark:bg-gray-800 dark:border-gray-700"
                    />
                    <span>%</span>
                  </div>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white pt-1.5 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span><span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Due date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-due-date" className="text-xs font-medium">Due Date</Label>
              <Input
                id="edit-due-date"
                type="date"
                value={dueDate}
                min={invoice?.createdAt?.slice(0, 10) ?? undefined}
                onChange={e => setDueDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-notes" className="text-xs font-medium">Notes to Customer</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes visible to the customer…"
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
