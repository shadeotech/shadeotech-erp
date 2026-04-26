'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { StripePaymentForm } from '@/components/stripe/StripePaymentForm'
import { useAuthStore } from '@/stores/authStore'

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-500/10 text-green-700 dark:text-green-400',
  PENDING: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  FAILED: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

export default function DealerPaymentsPage() {
  const { toast } = useToast()
  const { token } = useAuthStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD')
  const [invoices, setInvoices] = useState<{ id: string; invoiceNumber: string; dueAmount: number }[]>([])
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('')
  const [payments, setPayments] = useState<{ id: string; number: string; amount: number; date: Date; method: string; order: string; status: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [stripeStep, setStripeStep] = useState(false)

  const fetchPayments = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/payments', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const list = (data.payments ?? []).map((p: any) => ({
          id: p.id,
          number: p.paymentNumber ?? p.id,
          amount: p.amount ?? 0,
          date: p.date ? new Date(p.date) : new Date(),
          method: p.method ?? '—',
          order: p.invoiceNumber ?? '—',
          status: 'COMPLETED',
        }))
        setPayments(list)
      }
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchPayments()
    else setLoading(false)
  }, [token])

  useEffect(() => {
    if (!token || !dialogOpen) return
    const fetchInvoices = async () => {
      try {
        const res = await fetch('/api/invoices', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          const unpaid = (data.invoices ?? []).filter(
            (inv: any) => (inv.dueAmount ?? 0) > 0 && inv.status !== 'Paid'
          )
          const list = unpaid.map((inv: any) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber ?? inv.id,
            dueAmount: inv.dueAmount ?? 0,
          }))
          setInvoices(list)
          if (list.length > 0) {
            setSelectedInvoiceId(list[0].id)
            setPaymentAmount(String(list[0].dueAmount ?? 0))
          } else {
            setSelectedInvoiceId('')
            setPaymentAmount('')
          }
        }
      } catch {
        setInvoices([])
      }
    }
    fetchInvoices()
  }, [token, dialogOpen])

  const handleNonCardPayment = () => {
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) return

    toast({ title: 'Payment recorded', description: `${formatCurrency(amount)} payment has been recorded. Contact support for check/Zelle/ACH instructions.` })
    resetDialog()
  }

  const handleStripeSuccess = () => {
    const amount = parseFloat(paymentAmount)
    toast({ title: 'Payment successful!', description: `${formatCurrency(amount)} has been charged to your card.` })
    resetDialog()
    fetchPayments()
  }

  const resetDialog = () => {
    setDialogOpen(false)
    setPaymentAmount('')
    setPaymentMethod('CREDIT_CARD')
    setStripeStep(false)
    setSelectedInvoiceId('')
  }

  const isCreditCard = paymentMethod === 'CREDIT_CARD'
  const parsedAmount = parseFloat(paymentAmount)
  const amountValid = !isNaN(parsedAmount) && parsedAmount > 0
  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and make payments for your orders
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setDialogOpen(true) }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Make Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Make Payment</DialogTitle>
              <DialogDescription>
                {stripeStep
                  ? `Paying ${formatCurrency(parsedAmount)} by credit card`
                  : 'Enter payment details for your order'}
              </DialogDescription>
            </DialogHeader>

            {/* Step 1: Amount + Method selection */}
            {!stripeStep && (
              <>
                <div className="space-y-4">
                  {invoices.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="invoice">Invoice</Label>
                      <Select
                        value={selectedInvoiceId || 'none'}
                        onValueChange={(v) => {
                          setSelectedInvoiceId(v === 'none' ? '' : v)
                          const inv = invoices.find((i) => i.id === v)
                          if (inv) setPaymentAmount(String(inv.dueAmount))
                        }}
                      >
                        <SelectTrigger id="invoice">
                          <SelectValue placeholder="Select invoice" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Pay without invoice</SelectItem>
                          {invoices.map((inv) => (
                            <SelectItem key={inv.id} value={inv.id}>
                              {inv.invoiceNumber} — {formatCurrency(inv.dueAmount)} due
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="flex flex-wrap gap-2">
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="flex-1 min-w-[120px]"
                      />
                      {selectedInvoice && (selectedInvoice.dueAmount ?? 0) > 0 && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentAmount(String(Math.round(selectedInvoice.dueAmount * 0.5 * 100) / 100))}
                          >
                            50% Deposit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentAmount(String(selectedInvoice.dueAmount))}
                          >
                            Full Amount
                          </Button>
                        </>
                      )}
                    </div>
                    {selectedInvoice && (selectedInvoice.dueAmount ?? 0) > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        If paying 50% deposit, the remaining balance must be paid before installation.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger id="method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                        <SelectItem value="ACH">ACH</SelectItem>
                        <SelectItem value="CHECK">Check</SelectItem>
                        <SelectItem value="ZELLE">Zelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetDialog}>Cancel</Button>
                  {isCreditCard ? (
                    <Button disabled={!amountValid} onClick={() => setStripeStep(true)}>
                      Continue to Payment
                    </Button>
                  ) : (
                    <Button disabled={!amountValid} onClick={handleNonCardPayment}>
                      Record Payment
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}

            {/* Step 2: Stripe card form */}
            {stripeStep && amountValid && (
              <StripePaymentForm
                amount={parsedAmount}
                invoiceId={selectedInvoiceId || undefined}
                invoiceNumber={selectedInvoice?.invoiceNumber}
                onSuccess={handleStripeSuccess}
                onCancel={() => setStripeStep(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading payments…
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No payments yet. Use &quot;Make Payment&quot; to pay.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.number}</TableCell>
                      <TableCell className="text-muted-foreground">{payment.order}</TableCell>
                      <TableCell className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(payment.date, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[payment.status]}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
