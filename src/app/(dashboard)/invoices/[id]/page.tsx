'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import {
  FileText,
  CreditCard,
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
  Activity,
  MailOpen,
  MailCheck,
  Pencil,
  UserX,
  Phone,
  MapPin,
  ExternalLink,
  X,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn, formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { AddPaymentModal } from '@/components/sales/AddPaymentModal'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InvoiceDocument } from '@/components/invoices/InvoiceDocument'
import { DEFAULT_CONFIG, type InvoiceTemplateConfig } from '@/lib/invoice-template-types'
import { EditInvoiceModal } from '@/components/invoices/EditInvoiceModal'

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT:          { label: 'Draft',          className: 'bg-gray-100 text-gray-600 border-gray-200' },
  SENT:           { label: 'Sent',           className: 'bg-blue-50 text-blue-700 border-blue-200' },
  PARTIALLY_PAID: { label: 'Partially Paid', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PAID:           { label: 'Paid',           className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OVERDUE:        { label: 'Overdue',        className: 'bg-red-50 text-red-700 border-red-200' },
  CANCELLED:      { label: 'Cancelled',      className: 'bg-gray-100 text-gray-500 border-gray-200' },
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
  const [sendMsg, setSendMsg] = useState<string | null>(null)
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceTemplateConfig>(DEFAULT_CONFIG)
  const [customerInfo, setCustomerInfo] = useState<{ name: string; email: string; phone: string; mobile: string } | null>(null)
  const [editCustomerOpen, setEditCustomerOpen] = useState(false)
  const [editCustomerForm, setEditCustomerForm] = useState({ name: '', email: '', phone: '', mobile: '' })
  const [editCustomerSaving, setEditCustomerSaving] = useState(false)
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false)
  const [ccInput, setCcInput] = useState('')
  const [ccSaving, setCcSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings/company')
      .then(r => r.json())
      .then(data => {
        if (data.invoiceTemplateConfig) setInvoiceConfig({ ...DEFAULT_CONFIG, ...data.invoiceTemplateConfig })
      })
      .catch(() => {})
  }, [])

  const fetchCustomerInfo = useCallback(async (customerId: string) => {
    if (!token || !customerId) return
    try {
      const res = await fetch(`/api/customers/${customerId}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const c = await res.json()
        // GET /api/customers/[id] returns the object directly (not wrapped in customer:{})
        setCustomerInfo({ name: c.name || '', email: c.email || '', phone: c.phone || '', mobile: c.mobile || '' })
      }
    } catch {}
  }, [token])

  useEffect(() => {
    if (invoice?.customerId) fetchCustomerInfo(invoice.customerId)
  }, [invoice?.customerId, fetchCustomerInfo])

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
          statusDb: inv.statusDb,
          sentAt: inv.sentAt,
          dueDate: inv.dueDate,
          createdAt: inv.createdAt,
          items: inv.items || [],
          subtotal: inv.subtotal ?? 0,
          taxRate: inv.taxRate ?? 0,
          taxAmount: inv.taxAmount ?? 0,
          emailLog: inv.emailLog ?? [],
          ccEmails: inv.ccEmails ?? [],
          notes: inv.notes ?? '',
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
      }
    } catch (err) {
      console.error(err)
      setInvoice(null)
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => { fetchData() }, [fetchData])

  const invoicePayments = invoice ? payments.filter((p: any) => p.invoiceId === invoice.id) : []
  const paymentProgress = invoice && invoice.totalAmount > 0
    ? (invoice.paidAmount / invoice.totalAmount) * 100
    : 0

  const handleSendInvoice = async () => {
    if (!token || !invoice) return
    if (!customerInfo?.email) {
      setSendMsg('No email on file — click Edit on the customer card to add one.')
      setTimeout(() => setSendMsg(null), 5000)
      return
    }
    try {
      setSending(true)
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'invoice' }),
      })
      const data = await res.json()
      setSendMsg(data.sent ? `Invoice sent to ${data.sentTo ?? invoice.customerName}` : 'Invoice marked sent (no email on file)')
      await fetchData()
    } catch { setSendMsg('Failed to send invoice') }
    finally { setSending(false); setTimeout(() => setSendMsg(null), 5000) }
  }

  const handleSendReminder = async () => {
    if (!token || !invoice) return
    if (invoice.dueAmount <= 0) { setSendMsg('No outstanding balance.'); return }
    if (!customerInfo?.email) {
      setSendMsg('No email on file — click Edit on the customer card to add one.')
      setTimeout(() => setSendMsg(null), 5000)
      return
    }
    try {
      setSending(true)
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'reminder', balance: invoice.dueAmount }),
      })
      const data = await res.json()
      setSendMsg(data.sent
        ? `Reminder sent to ${data.sentTo ?? invoice.customerName} for ${formatCurrency(invoice.dueAmount)}`
        : 'Reminder logged (no email on file)')
      await fetchData()
    } catch { setSendMsg('Failed to send reminder') }
    finally { setSending(false); setTimeout(() => setSendMsg(null), 5000) }
  }

  const handleSaveCustomer = async () => {
    if (!token || !invoice?.customerId) return
    try {
      setEditCustomerSaving(true)
      const res = await fetch(`/api/customers/${invoice.customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: editCustomerForm.name.trim(),
          email: editCustomerForm.email.trim(),
          phone: editCustomerForm.phone.trim(),
          mobile: editCustomerForm.mobile.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSendMsg(data.error || 'Failed to update customer'); return }
      const c = data.customer
      setCustomerInfo({ name: c.name || '', email: c.email || '', phone: c.phone || '', mobile: c.mobile || '' })
      setEditCustomerOpen(false)
      setSendMsg('Customer info updated')
      setTimeout(() => setSendMsg(null), 3000)
    } catch { setSendMsg('Failed to update customer') }
    finally { setEditCustomerSaving(false) }
  }

  const addCcEmail = async (email: string) => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) return
    if ((invoice?.ccEmails ?? []).includes(trimmed)) { setCcInput(''); return }
    const next = [...(invoice?.ccEmails ?? []), trimmed]
    setCcSaving(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ccEmails: next }),
      })
      if (res.ok) { await fetchData(); setCcInput('') }
    } finally { setCcSaving(false) }
  }

  const removeCcEmail = async (email: string) => {
    const next = (invoice?.ccEmails ?? []).filter((e: string) => e !== email)
    try {
      await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ccEmails: next }),
      })
      await fetchData()
    } catch {}
  }

  const handleSendToDealer = async () => {
    if (!token || !invoice?.dealerId || invoice.sentAt) return
    try {
      setSending(true)
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'send' }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed')
      }
      await fetchData()
    } catch (err) {
      setSendMsg(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
      setTimeout(() => setSendMsg(null), 4000)
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
        <Link href="/invoices"><Button variant="outline">Back to Invoices</Button></Link>
      </div>
    )
  }

  const isOverdue = invoice.dueDate && new Date() > new Date(invoice.dueDate) && invoice.status !== 'Paid'
  const statusCfg = statusConfig[invoice.statusDb ?? invoice.status] ?? { label: invoice.status, className: 'bg-gray-100 text-gray-600 border-gray-200' }

  const emailLog: any[] = invoice.emailLog ?? []
  const totalOpens = emailLog.reduce((s: number, e: any) => s + (e.openCount ?? 0), 0)
  const lastOpened = emailLog
    .filter((e: any) => e.lastOpenedAt)
    .sort((a: any, b: any) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime())[0]

  return (
    <div className="space-y-5">
      <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Invoices
      </Link>

      {/* Flash message */}
      {sendMsg && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{sendMsg}
        </div>
      )}

      {/* Hero header */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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
                {/* Email open indicator */}
                {totalOpens > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-medium">
                    <MailOpen className="h-3 w-3" /> Opened {totalOpens}×
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {invoice.orderNumber ? `Order ${invoice.orderNumber}` : invoice.quoteId ? `Quote ${invoice.quoteId}` : 'Standalone Invoice'}
                {invoice.dealerName && ` · ${invoice.dealerName}`}
                {invoice.sentAt && ` · Sent ${format(new Date(invoice.sentAt), 'MMM d, yyyy')}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setEditInvoiceOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleSendInvoice} disabled={sending}>
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Send Invoice
            </Button>
            {invoice.dueAmount > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs text-amber-600 border-amber-200 hover:bg-amber-50" onClick={handleSendReminder} disabled={sending}>
                <Bell className="h-3.5 w-3.5" /> Reminder
              </Button>
            )}
            <Button size="sm" className="gap-1.5 h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setIsPaymentModalOpen(true)}>
              <CreditCard className="h-3.5 w-3.5" /> Record Payment
            </Button>
          </div>
        </div>

        {/* Stat blocks */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800">
          {[
            { label: 'Invoice Total', value: formatCurrency(invoice.totalAmount), icon: <DollarSign className="h-3.5 w-3.5" />, color: 'text-gray-600 dark:text-gray-400' },
            { label: 'Amount Paid',   value: formatCurrency(invoice.paidAmount),  icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Balance Due',   value: formatCurrency(invoice.dueAmount),   icon: <Clock className="h-3.5 w-3.5" />, color: invoice.dueAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400' },
            { label: 'Due Date',      value: invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : '—', icon: <Calendar className="h-3.5 w-3.5" />, color: isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="px-6 py-4">
              <div className={cn('flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide mb-1', color)}>{icon}{label}</div>
              <p className={cn('text-xl font-bold', color)}>{value}</p>
            </div>
          ))}
        </div>

        {/* Payment progress */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>{paymentProgress.toFixed(0)}% paid</span>
            <span>{formatCurrency(invoice.paidAmount)} of {formatCurrency(invoice.totalAmount)}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', paymentProgress >= 100 ? 'bg-emerald-500' : 'bg-amber-500')}
              style={{ width: `${Math.min(paymentProgress, 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {/* Line Items */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Line Items</h2>
            </div>
            {(invoice.items?.length ?? 0) > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit Price</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {invoice.items.map((item: any, index: number) => (
                    <tr key={item.id || index} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                        {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                        {item.category && !item.description && <p className="text-xs text-gray-400 mt-0.5">{item.category}</p>}
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
            <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4">
              <div className="ml-auto max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span><span>{formatCurrency(invoice.subtotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Tax {invoice.taxRate ? `(${invoice.taxRate}%)` : ''}</span>
                  <span>{formatCurrency(invoice.taxAmount ?? 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span>Total</span><span>{formatCurrency(invoice.totalAmount)}</span>
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
                  <div key={payment.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{payment.paymentNumber}</p>
                        <p className="text-xs text-gray-400">{payment.method} · {new Date(payment.date).toLocaleDateString()}</p>
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

          {/* ── Email Activity Log ── */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-500" />
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Email Activity</h2>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{emailLog.length} sent</span>
                {totalOpens > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <MailOpen className="h-3.5 w-3.5" />{totalOpens} total open{totalOpens !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {emailLog.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No emails sent yet</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[...emailLog].reverse().map((entry: any, idx: number) => {
                  const isReminder = entry.type === 'reminder'
                  const wasOpened = (entry.openCount ?? 0) > 0
                  return (
                    <div key={entry._id ?? idx} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/40 dark:hover:bg-gray-800/20 transition-colors">
                      <div className={cn(
                        'mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                        isReminder ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-blue-50 dark:bg-blue-900/20'
                      )}>
                        {isReminder
                          ? <Bell className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          : <MailCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {isReminder ? 'Payment Reminder' : 'Invoice'} sent
                          </span>
                          {wasOpened ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <MailOpen className="h-3 w-3" /> Opened {entry.openCount}×
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                              Not opened yet
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                          {entry.sentAt && (
                            <span>Sent {format(new Date(entry.sentAt), 'MMM d, yyyy h:mm a')}</span>
                          )}
                          {entry.sentTo && <span>→ {entry.sentTo}</span>}
                          {entry.firstOpenedAt && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              First opened {formatDistanceToNow(new Date(entry.firstOpenedAt), { addSuffix: true })}
                            </span>
                          )}
                          {entry.lastOpenedAt && entry.lastOpenedAt !== entry.firstOpenedAt && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Last opened {formatDistanceToNow(new Date(entry.lastOpenedAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</p>
              <button
                onClick={() => {
                  setEditCustomerForm({
                    name: customerInfo?.name ?? invoice.customerName ?? '',
                    email: customerInfo?.email ?? '',
                    phone: customerInfo?.phone ?? '',
                    mobile: customerInfo?.mobile ?? '',
                  })
                  setEditCustomerOpen(true)
                }}
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-semibold text-sm flex-shrink-0">
                  {invoice.customerName?.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{customerInfo?.name || invoice.customerName}</p>
                  {invoice.sideMark && <p className="text-xs text-gray-400 font-mono">{invoice.sideMark}</p>}
                </div>
              </div>

              {/* No email warning */}
              {customerInfo !== null && !customerInfo.email && (
                <div className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                  <UserX className="h-3.5 w-3.5 shrink-0" />
                  <span>No email on file — emails cannot be sent</span>
                </div>
              )}

              {/* Contact details */}
              <div className="space-y-1.5">
                {/* To: (auto from customer profile) */}
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-gray-400 font-medium w-6 shrink-0 pt-px">To:</span>
                  {customerInfo?.email ? (
                    <span className="text-gray-700 dark:text-gray-300 truncate">{customerInfo.email}</span>
                  ) : (
                    <span className="text-red-500 italic">No email — click Edit to add</span>
                  )}
                </div>
                {/* CC: chip input */}
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-gray-400 font-medium w-6 shrink-0 pt-1.5">CC:</span>
                  <div className="flex-1 min-w-0">
                    {(invoice.ccEmails ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {(invoice.ccEmails as string[]).map((email: string) => (
                          <span
                            key={email}
                            className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full px-2 py-0.5 text-[11px]"
                          >
                            {email}
                            <button
                              type="button"
                              onClick={() => removeCcEmail(email)}
                              className="text-gray-400 hover:text-red-500 ml-0.5 leading-none"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Input
                        type="email"
                        placeholder="Add CC email…"
                        value={ccInput}
                        onChange={e => setCcInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault()
                            addCcEmail(ccInput)
                          }
                        }}
                        className="h-6 text-[11px] px-2 flex-1 min-w-0"
                        disabled={ccSaving}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => addCcEmail(ccInput)}
                        disabled={ccSaving || !ccInput.trim()}
                      >
                        {ccSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                      </Button>
                    </div>
                  </div>
                </div>
                {customerInfo?.phone ? (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{customerInfo.phone}</span>
                  </div>
                ) : null}
                {customerInfo?.mobile && customerInfo.mobile !== customerInfo.phone ? (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{customerInfo.mobile} (mobile)</span>
                  </div>
                ) : null}
                {(invoice.billToCity || invoice.billToStreet) && (
                  <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span>{[invoice.billToStreet, invoice.billToCity, invoice.billToState].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>

              <Link
                href={`/customers/${invoice.customerId}`}
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                <ExternalLink className="h-3 w-3" /> View full profile
              </Link>
            </div>
          </div>

          {/* Invoice details */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            {[
              { label: 'Invoice #', value: invoice.invoiceNumber },
              { label: 'Created',   value: invoice.createdAt ? format(new Date(invoice.createdAt), 'MMM d, yyyy') : '—' },
              { label: 'Sent',      value: invoice.sentAt ? format(new Date(invoice.sentAt), 'MMM d, yyyy') : 'Not sent' },
              { label: 'Due Date',  value: invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM d, yyyy') : '—', urgent: isOverdue },
              ...(invoice.orderNumber ? [{ label: 'Order',  value: invoice.orderNumber }] : []),
              ...(invoice.dealerName  ? [{ label: 'Dealer', value: invoice.dealerName }]  : []),
            ].map(({ label, value, urgent }: any) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-400">{label}</span>
                <span className={cn('text-xs font-medium', urgent ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300')}>{value}</span>
              </div>
            ))}
          </div>

          {/* Email open stats */}
          {emailLog.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Stats</p>
              </div>
              {[
                { label: 'Emails sent',    value: emailLog.length },
                { label: 'Total opens',    value: totalOpens },
                { label: 'Reminders sent', value: emailLog.filter((e: any) => e.type === 'reminder').length },
                { label: 'Last opened',    value: lastOpened?.lastOpenedAt ? formatDistanceToNow(new Date(lastOpened.lastOpenedAt), { addSuffix: true }) : 'Never' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-4 space-y-2">
            <Button className="w-full gap-2 text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setIsPaymentModalOpen(true)}>
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

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview – {invoice.invoiceNumber}</DialogTitle>
            <DialogDescription>Preview as the invoice will appear when downloaded or sent</DialogDescription>
          </DialogHeader>
          <div className="bg-background max-h-[75vh] overflow-y-auto rounded border">
            <InvoiceDocument invoice={invoice} config={invoiceConfig} />
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        open={editInvoiceOpen}
        onOpenChange={setEditInvoiceOpen}
        invoice={invoice}
        onSaved={fetchData}
      />

      {/* Edit Customer Dialog */}
      <Dialog open={editCustomerOpen} onOpenChange={setEditCustomerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer Info</DialogTitle>
            <DialogDescription>Update contact details for {invoice.customerName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ec-name" className="text-xs font-medium">Name</Label>
              <Input
                id="ec-name"
                value={editCustomerForm.name}
                onChange={e => setEditCustomerForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-email" className="text-xs font-medium">Email address</Label>
              <Input
                id="ec-email"
                type="email"
                value={editCustomerForm.email}
                onChange={e => setEditCustomerForm(f => ({ ...f, email: e.target.value }))}
                placeholder="customer@example.com"
                className="h-9 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ec-phone" className="text-xs font-medium">Phone</Label>
                <Input
                  id="ec-phone"
                  value={editCustomerForm.phone}
                  onChange={e => setEditCustomerForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 555 000 0000"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ec-mobile" className="text-xs font-medium">Mobile</Label>
                <Input
                  id="ec-mobile"
                  value={editCustomerForm.mobile}
                  onChange={e => setEditCustomerForm(f => ({ ...f, mobile: e.target.value }))}
                  placeholder="+1 555 000 0000"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditCustomerOpen(false)} disabled={editCustomerSaving}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleSaveCustomer}
              disabled={editCustomerSaving}
            >
              {editCustomerSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
