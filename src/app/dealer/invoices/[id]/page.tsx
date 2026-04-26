'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft, Download, CreditCard, Loader2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StripePaymentForm } from '@/components/stripe/StripePaymentForm'
import { InvoiceDocument } from '@/components/invoices/InvoiceDocument'
import { DEFAULT_CONFIG, type InvoiceTemplateConfig } from '@/lib/invoice-template-types'
import { generateInvoicePDF } from '@/lib/generateInvoicePDF'

const statusStyles: Record<string, string> = {
  Unpaid: 'bg-red-500/10 text-red-700 dark:text-red-400',
  'Partially Paid': 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  Paid: 'bg-green-500/10 text-green-700 dark:text-green-400',
  Overdue: 'bg-red-500/10 text-red-700 dark:text-red-400',
  Draft: 'bg-gray-500/10 text-gray-600 dark:text-gray-300',
}

interface ApiInvoice {
  id: string
  invoiceNumber: string
  quoteId?: string
  orderId?: string
  orderNumber?: string
  customerId?: string
  customerName: string
  dealerId?: string
  dealerName?: string
  sideMark?: string
  status: string
  statusDb?: string
  totalAmount: number
  paidAmount: number
  dueAmount: number
  subtotal?: number
  taxRate?: number
  taxAmount?: number
  sentAt?: string
  dueDate?: string
  createdAt?: string
  items?: any[]
  notes?: string
}

export default function DealerInvoiceDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const { token } = useAuthStore()

  const [invoice, setInvoice] = useState<ApiInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceTemplateConfig>(DEFAULT_CONFIG)

  // Load admin-saved invoice template from DB (no auth required)
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

  const fetchInvoice = useCallback(async () => {
    if (!token || !id) return
    try {
      setLoading(true)
      const res = await fetch(`/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setInvoice(null)
        return
      }
      const data = await res.json()
      if (!data.invoice) {
        setInvoice(null)
        return
      }
      const inv = data.invoice
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
        status: inv.status,
        statusDb: inv.statusDb,
        totalAmount: inv.totalAmount ?? 0,
        paidAmount: inv.paidAmount ?? 0,
        dueAmount: inv.dueAmount ?? 0,
        subtotal: inv.subtotal,
        taxRate: inv.taxRate,
        taxAmount: inv.taxAmount,
        sentAt: inv.sentAt,
        dueDate: inv.dueDate,
        createdAt: inv.createdAt,
        items: inv.items || [],
        notes: inv.notes,
      })
    } catch (err) {
      console.error(err)
      setInvoice(null)
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  const handleDownload = async () => {
    if (!token || !invoice) return
    try {
      setDownloading(true)
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (!data.invoice) return
      await generateInvoicePDF(data.invoice, invoiceConfig)
    } catch (err) {
      console.error('Dealer invoice PDF error:', err)
    } finally {
      setDownloading(false)
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
      <div className="space-y-4">
        <p className="text-muted-foreground">Invoice not found.</p>
        <Link href="/dealer/invoices">
          <Button variant="outline">Back to Invoices</Button>
        </Link>
      </div>
    )
  }

  const canPay = invoice.dueAmount > 0 && invoice.status !== 'Paid'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dealer/invoices">
              <Button variant="ghost" size="sm" className="gap-2 mr-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <h2 className="text-2xl font-semibold">{invoice.invoiceNumber}</h2>
            <Badge
              variant="outline"
              className={cn(
                'border-0',
                statusStyles[invoice.status] || 'bg-gray-500/10 text-gray-600',
              )}
            >
              {invoice.status}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            {invoice.orderNumber
              ? `Order: ${invoice.orderNumber}`
              : invoice.quoteId
              ? `From Quote: ${invoice.quoteId}`
              : 'Invoice'}
          </p>
          {invoice.sentAt && (
            <p className="text-xs text-muted-foreground">
              Sent on{' '}
              {new Date(invoice.sentAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            PDF
          </Button>
          {canPay && (
            <Button onClick={() => setPayDialogOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Invoice
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total</span>
            <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Paid</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {formatCurrency(invoice.paidAmount)}
            </span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between text-base">
            <span className="font-semibold">Balance Due</span>
            <span className="font-bold text-primary">
              {formatCurrency(invoice.dueAmount)}
            </span>
          </div>
          {invoice.dueDate && (
            <p className="text-xs text-muted-foreground mt-1">
              Due on {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Invoice document rendered inline */}
      <div className="rounded-lg border overflow-hidden">
        <InvoiceDocument invoice={invoice} config={invoiceConfig} />
      </div>

      {/* Stripe payment dialog for dealers */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Invoice</DialogTitle>
            <DialogDescription>
              {`Invoice ${invoice.invoiceNumber} — Balance due: ${formatCurrency(
                invoice.dueAmount,
              )}`}
            </DialogDescription>
          </DialogHeader>
          {canPay && (
            <StripePaymentForm
              amount={invoice.dueAmount}
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
              onSuccess={async () => {
                setPayDialogOpen(false)
                await fetchInvoice()
              }}
              onCancel={() => setPayDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

