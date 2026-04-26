'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export type PaymentMethod = 'Credit Card' | 'ACH' | 'Check' | 'Zelle' | 'Financing'

interface AddPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
  invoiceNumber: string
  customerId: string
  customerName: string
  sideMark: string
  maxAmount: number
  onPaymentRecorded?: () => void
}

const paymentMethods: PaymentMethod[] = [
  'Credit Card',
  'ACH',
  'Check',
  'Zelle',
  'Financing',
]

export function AddPaymentModal({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  maxAmount,
  onPaymentRecorded,
}: AddPaymentModalProps) {
  const { token } = useAuthStore()
  const [amount, setAmount] = useState<string>('')
  const [method, setMethod] = useState<PaymentMethod>('Credit Card')
  const [date, setDate] = useState<Date>(new Date())
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const paymentAmount = parseFloat(amount)
    
    if (paymentAmount <= 0 || paymentAmount > maxAmount) {
      alert(`Amount must be between $0.01 and ${maxAmount.toFixed(2)}`)
      return
    }

    if (!token) {
      alert('Please log in to record payments')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoiceId,
          amount: paymentAmount,
          method,
          date: format(date, 'yyyy-MM-dd'),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to record payment')
      }
      setAmount('')
      setMethod('Credit Card')
      setDate(new Date())
      onOpenChange(false)
      onPaymentRecorded?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  const handleFullPayment = () => {
    setAmount(maxAmount.toString())
  }

  const handle50Deposit = () => {
    const half = Math.round(maxAmount * 0.5 * 100) / 100
    setAmount(half.toString())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="flex-1 min-w-[120px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handle50Deposit}
              >
                50% Deposit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFullPayment}
              >
                Full Amount
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum: {maxAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Note: If paying 50% deposit, the remaining balance must be paid before installation.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Payment Method *</Label>
            <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Payment Date *</Label>
            <Input
              id="date"
              type="date"
              value={format(date, 'yyyy-MM-dd')}
              onChange={(e) => {
                const selectedDate = e.target.value ? new Date(e.target.value) : new Date()
                setDate(selectedDate)
              }}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

