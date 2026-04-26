'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, Eye, CreditCard, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { StripePaymentForm } from '@/components/stripe/StripePaymentForm'

const statusColors: Record<string, string> = {
  Unpaid: 'bg-red-500/10 text-red-700 dark:text-red-400',
  'Partially Paid': 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  Paid: 'bg-green-500/10 text-green-700 dark:text-green-400',
  Overdue: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

export default function DealerInvoicesPage() {
  const { token } = useAuthStore()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [payingInvoice, setPayingInvoice] = useState<any | null>(null)

  const fetchInvoices = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/invoices', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      } else {
        setInvoices([])
      }
    } catch {
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and pay invoices sent to you by admin
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading invoices…
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No invoices yet. Invoices are sent to you when admin approves your orders.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.orderNumber ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[invoice.status] || 'bg-gray-500/10'}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(invoice.totalAmount ?? 0)}</TableCell>
                      <TableCell className={(invoice.dueAmount ?? 0) > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}>
                        {formatCurrency(invoice.dueAmount ?? 0)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dealer/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          {(invoice.dueAmount ?? 0) > 0 && (
                            <Button size="sm" onClick={() => setPayingInvoice(invoice)}>
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pay Now
                            </Button>
                          )}
                          <Link href={`/dealer/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Inline Pay Now dialog */}
      <Dialog open={!!payingInvoice} onOpenChange={(open) => { if (!open) setPayingInvoice(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Invoice</DialogTitle>
            <DialogDescription>
              {payingInvoice
                ? `${payingInvoice.invoiceNumber} — Balance due: ${formatCurrency(payingInvoice.dueAmount ?? 0)}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {payingInvoice && (
            <StripePaymentForm
              amount={payingInvoice.dueAmount}
              invoiceId={payingInvoice.id}
              invoiceNumber={payingInvoice.invoiceNumber}
              onSuccess={async () => {
                setPayingInvoice(null)
                await fetchInvoices()
              }}
              onCancel={() => setPayingInvoice(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
