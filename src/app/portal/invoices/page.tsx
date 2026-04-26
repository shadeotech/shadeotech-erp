'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
} from '@/components/ui/dialog'
import { Download, Eye, CreditCard, Search, Filter, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { format } from 'date-fns'
import { StripePaymentForm } from '@/components/stripe/StripePaymentForm'
import { useAuthStore } from '@/stores/authStore'
import { generateInvoicePDF } from '@/lib/generateInvoicePDF'
import { DEFAULT_CONFIG } from '@/lib/invoice-template-types'

const statusColors: Record<string, string> = {
  Unpaid: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'Partially Paid': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  Paid: 'bg-green-500/10 text-green-700 dark:text-green-400',
  Overdue: 'bg-red-500/10 text-red-700 dark:text-red-400',
  Draft: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  totalAmount: number
  paidAmount: number
  dueAmount: number
  dueDate?: string
  createdAt?: string
}

interface PayingInvoice {
  id: string
  number: string
  due: number
}

export default function CustomerInvoicesPage() {
  const { toast } = useToast()
  const { token } = useAuthStore()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [payingInvoice, setPayingInvoice] = useState<PayingInvoice | null>(null)

  const fetchInvoices = async () => {
    if (!token) { setLoading(false); return }
    try {
      const res = await fetch('/api/invoices', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices ?? [])
      }
    } catch {
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [token])

  // Handle 3DS redirect: when customer returns with ?payment=success&payment_intent=pi_xxx
  const searchParams = useSearchParams()
  const confirmedRef = useRef(false)
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const piClientSecret = searchParams.get('payment_intent_client_secret')
    if (paymentStatus !== 'success' || !piClientSecret || !token || confirmedRef.current) return
    confirmedRef.current = true

    const confirm3DS = async () => {
      try {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        if (!stripe) return
        const { paymentIntent } = await stripe.retrievePaymentIntent(piClientSecret)
        if (paymentIntent?.status === 'succeeded') {
          await fetch('/api/payments/confirm-stripe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
          })
          toast({ title: 'Payment confirmed!', description: 'Your payment has been recorded.' })
          fetchInvoices()
        }
      } catch (err) {
        console.error('[portal/invoices] 3DS confirm failed:', err)
      }
      // Clean up URL params
      window.history.replaceState({}, '', window.location.pathname)
    }
    confirm3DS()
  }, [searchParams, token])

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handlePaymentSuccess = () => {
    if (!payingInvoice) return
    toast({
      title: 'Payment successful!',
      description: `${formatCurrency(payingInvoice.due)} payment for ${payingInvoice.number} has been processed.`,
    })
    setPayingInvoice(null)
    fetchInvoices()
  }

  const handleDownload = async (invoiceId: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (!data.invoice) return
      await generateInvoicePDF(data.invoice, DEFAULT_CONFIG)
    } catch {
      // ignore for now; user can retry
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and pay your invoices
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
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
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[invoice.status] ?? ''}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell className="text-green-600 dark:text-green-400">
                        {formatCurrency(invoice.paidAmount)}
                      </TableCell>
                      <TableCell className={invoice.dueAmount > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}>
                        {formatCurrency(invoice.dueAmount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/portal/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          {invoice.dueAmount > 0 && (
                            <Button
                              size="sm"
                              onClick={() =>
                                setPayingInvoice({
                                  id: invoice.id,
                                  number: invoice.invoiceNumber,
                                  due: invoice.dueAmount,
                                })
                              }
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pay
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(invoice.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
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

      {/* Stripe Payment Dialog */}
      <Dialog
        open={!!payingInvoice}
        onOpenChange={(open) => { if (!open) setPayingInvoice(null) }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Invoice</DialogTitle>
            <DialogDescription>
              {payingInvoice
                ? `${payingInvoice.number} — Balance due: ${formatCurrency(payingInvoice.due)}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          {payingInvoice && (
            <StripePaymentForm
              amount={payingInvoice.due}
              invoiceId={payingInvoice.id}
              invoiceNumber={payingInvoice.number}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setPayingInvoice(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
