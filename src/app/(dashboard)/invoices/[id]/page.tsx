'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import {
  Send,
  FileText,
  CreditCard,
  User,
  Calendar,
  AlertCircle,
  Eye,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Mail,
  Bell,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn, formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { AddPaymentModal } from '@/components/sales/AddPaymentModal'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InvoiceDocument } from '@/components/invoices/InvoiceDocument'
import { DEFAULT_CONFIG, type InvoiceTemplateConfig } from '@/lib/invoice-template-types'

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT:          { label: 'Draft',          className: 'bg-gray-100 text-gray-600 border-gray-200' },
  SENT:           { label: 'Sent',           className: 'bg-blue-50 text-blue-700 border-blue-200' },
  PARTIALLY_PAID: { label: 'Partially Paid', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PAID:           { label: 'Paid',           className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OVERDUE:        { label: 'Overdue',        className: 'bg-red-50 text-red-700 border-red-200' },
  CANCELLED:      { label: 'Cancelled',      className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

function getStatusLabel(status: string) {
  return statusConfig[status]?.label ?? status.replace(/_/g, ' ')
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const { token } = useAuthStore()
  const [invoice, setInvoice] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceTemplateConfig>(DEFAULT_CONFIG)

  // Load admin invoice style/template config (same source used by settings and portal/dealer previews)
  useEffect(() => {
    fetch('/api/settings/company')
      .then((r) => r.json())
      .then((data) => {
        if (data.invoiceTemplateConfig) {
          setInvoiceConfig({ ...DEFAULT_CONFIG, ...data.invoiceTemplateConfig })
        }
      })
      .catch(() => {})
  }, [])

  const fetchData = useCallback(async () => {
    if (!token || !id) return
    try {
      setLoading(true)
      const [invRes, payRes] = await Promise.all([
        fetch(`/api/invoices/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/payments?invoiceId=${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (invRes.ok) {
        const invData = await invRes.json()
        const inv = invData.invoice
        setInvoice({
          id: inv.id || inv._id,
          invoiceNumber: inv.invoiceNumber,
          quoteId: inv.quoteId,
          orderId: inv.orderId,
          orderNumber: inv.orderNumber,
          customerId: inv.customerId,
          customerName: inv.customerName,
          dealerId: inv.dealerId,
          dealerName: inv.dealerName,
          sideMark: inv.sideMark || '',
          totalAmount: inv.totalAmount ?? 0,
          paidAmount: inv.paidAmount ?? 0,
          dueAmount: inv.dueAmount ?? 0,
          status: inv.status,
          sentAt: inv.sentAt,
          dueDate: inv.dueDate,
          createdAt: inv.createdAt,
          items: inv.items || [],
          billToStreet: inv.billToStreet,
          billToCity: inv.billToCity,
          billToState: inv.billToState,
          billToPostcode: inv.billToPostcode,
          billToCountry: inv.billToCountry,
          shipToStreet: inv.shipToStreet,
          shipToCity: inv.shipToCity,
          shipToState: inv.shipToState,
          shipToPostcode: inv.shipToPostcode,
          shipToCountry: inv.shipToCountry,
        })
      } else {
        setInvoice(null)
      }
      if (payRes.ok) {
        const payData = await payRes.json()
        setPayments(payData.payments || [])
      } else {
        setPayments([])
      }
    } catch (err) {
      console.error(err)
      setInvoice(null)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const invoicePayments = invoice ? payments.filter((p: any) => p.invoiceId === invoice.id) : []
  const paymentProgress = invoice && invoice.totalAmount > 0
    ? (invoice.paidAmount / invoice.totalAmount) * 100
    : 0

  const handleRecordPayment = () => {
    setIsPaymentModalOpen(true)
  }

  const handleSendInvoice = async () => {
    if (!token || !invoice) return
    try {
      setSending(true)
      await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'invoice' }),
      })
      alert(`Invoice sent to ${invoice.customerName}`)
    } catch { alert('Failed to send invoice') } finally { setSending(false) }
  }

  const handleSendReminder = async () => {
    if (!token || !invoice) return
    if (invoice.dueAmount <= 0) { alert('No outstanding balance.'); return }
    try {
      setSending(true)
      await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'reminder', balance: invoice.dueAmount }),
      })
      alert(`Reminder sent to ${invoice.customerName} for ${formatCurrency(invoice.dueAmount)}`)
    } catch { alert('Failed to send reminder') } finally { setSending(false) }
  }

  const handleSendToDealer = async () => {
    if (!token || !invoice?.dealerId || invoice.sentAt) return
    try {
      setSending(true)
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'send' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send invoice')
      }
      await fetchData()
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to send invoice')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Link href="/invoices">
          <Button variant="outline">Back to Invoices</Button>
        </Link>
      </div>
    )
  }

  const isOverdue = invoice.dueDate && new Date() > new Date(invoice.dueDate) && invoice.status !== 'PAID'
  const statusCfg = statusConfig[invoice.status] ?? { label: invoice.status, className: 'bg-gray-100 text-gray-600 border-gray-200' }

  return (
    <div className="space-y-5">
      {/* Back nav */}
      <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Invoices
      </Link>

      {/* Hero header card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {/* Top title bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <FileText className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{invoice.invoiceNumber}</h1>
                <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', statusCfg.className)}>
                  {statusCfg.label}
                </span>
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 text-red-700 px-2.5 py-0.5 text-xs font-medium">
                    <AlertCircle className="h-3 w-3" /> Overdue
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {invoice.orderNumber ? `Order ${invoice.orderNumber}` : invoice.quoteId ? `Quote ${invoice.quoteId}` : 'Standalone Invoice'}
                {invoice.dealerName && ` · ${invoice.dealerName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleSendInvoice} disabled={sending}>
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Send Invoice
            </Button>
            {invoice.dueAmount > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleSendReminder} disabled={sending}>
                <Bell className="h-3.5 w-3.5" /> Reminder
              </Button>
            )}
            <Button size="sm" className="gap-1.5 h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white" onClick={handleRecordPayment}>
              <CreditCard className="h-3.5 w-3.5" /> Record Payment
            </Button>
          </div>
        </div>

        {/* Stat blocks */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800">
          {[
            { label: 'Invoice Total',  value: formatCurrency(invoice.totalAmount),  icon: <DollarSign className="h-3.5 w-3.5" />, color: 'text-gray-600 dark:text-gray-400' },
            { label: 'Amount Paid',    value: formatCurrency(invoice.paidAmount),    icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Balance Due',    value: formatCurrency(invoice.dueAmount),     icon: <Clock className="h-3.5 w-3.5" />, color: invoice.dueAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400' },
            { label: 'Due Date',       value: invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : '—', icon: <Calendar className="h-3.5 w-3.5" />, color: isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="px-6 py-4">
              <div className={cn('flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide mb-1', color)}>
                {icon}{label}
              </div>
              <p className={cn('text-xl font-bold', color)}>{value}</p>
            </div>
          ))}
        </div>

        {/* Payment progress bar */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>{paymentProgress.toFixed(0)}% paid</span>
            <span>{formatCurrency(invoice.paidAmount)} of {formatCurrency(invoice.totalAmount)}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', paymentProgress >= 100 ? 'bg-emerald-500' : 'bg-amber-500')}
              style={{ width: `${Math.min(paymentProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div className="space-y-5">
          {/* Line Items */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Line Items</h2>
            </div>
            {((invoice as any).items?.length ?? 0) > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dimensions</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit Price</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(invoice as any).items.map((item: any, index: number) => (
                    <tr key={item.id || index} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                        {item.category && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.category}{item.subcategory && ` / ${item.subcategory}`}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-xs">
                        {item.width && item.length ? `${item.width}" × ${item.length}"` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{item.quantity || 1}</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(item.unitPrice || item.totalPrice)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-10 text-center text-gray-400">No line items</div>
            )}

            {/* Totals */}
            <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4">
              <div className="ml-auto max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency((invoice as any).subtotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Tax {(invoice as any).taxRate ? `(${(invoice as any).taxRate}%)` : ''}</span>
                  <span>{formatCurrency((invoice as any).taxAmount ?? 0)}</span>
                </div>
                {(invoice as any).lateFeeAccrued > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Late Fees</span>
                    <span>{formatCurrency((invoice as any).lateFeeAccrued)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Payment History</h2>
              <span className="text-xs text-gray-400">{invoicePayments.length} payment{invoicePayments.length !== 1 ? 's' : ''}</span>
            </div>
            {invoicePayments.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {invoicePayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{payment.paymentNumber}</p>
                        <p className="text-xs text-gray-400">
                          {payment.method} · {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-gray-400 text-sm">No payments recorded yet</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</p>
            </div>
            <div className="p-4">
              <Link href={`/customers/${invoice.customerId}`} className="flex items-center gap-3 group">
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-semibold text-sm flex-shrink-0">
                  {invoice.customerName?.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-amber-600 transition-colors truncate">{invoice.customerName}</p>
                  {invoice.sideMark && <p className="text-xs text-gray-400 font-mono">{invoice.sideMark}</p>}
                </div>
              </Link>
            </div>
          </div>

          {/* Invoice details */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            {[
              { label: 'Invoice #',    value: invoice.invoiceNumber },
              { label: 'Created',      value: invoice.createdAt ? format(new Date(invoice.createdAt), 'MMM d, yyyy') : '—' },
              { label: 'Due Date',     value: invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : '—', urgent: isOverdue },
              ...(invoice.orderNumber ? [{ label: 'Order', value: invoice.orderNumber }] : []),
              ...(invoice.dealerName  ? [{ label: 'Dealer', value: invoice.dealerName }]  : []),
            ].map(({ label, value, urgent }) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-400">{label}</span>
                <span className={cn('text-xs font-medium', urgent ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300')}>{value}</span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-4 space-y-2">
            <Button className="w-full gap-2 text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleRecordPayment}>
              <CreditCard className="h-3.5 w-3.5" /> Record Payment
            </Button>
            <Button variant="outline" className="w-full gap-2 text-xs h-8" onClick={handleSendInvoice} disabled={sending}>
              <Mail className="h-3.5 w-3.5" /> Send Invoice by Email
            </Button>
            {invoice.dueAmount > 0 && (
              <Button variant="outline" className="w-full gap-2 text-xs h-8 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={handleSendReminder} disabled={sending}>
                <Bell className="h-3.5 w-3.5" /> Send Payment Reminder
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview – {invoice.invoiceNumber}</DialogTitle>
            <DialogDescription>
              Preview as the invoice will appear when downloaded or sent
            </DialogDescription>
          </DialogHeader>
          <div className="bg-background max-h-[75vh] overflow-y-auto rounded border">
            <InvoiceDocument invoice={invoice} config={invoiceConfig} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Payment Modal */}
      <AddPaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
        onPaymentRecorded={fetchData}
        customerId={invoice.customerId}
        customerName={invoice.customerName}
        sideMark={invoice.sideMark}
        maxAmount={invoice.dueAmount}
      />
    </div>
  )
}

