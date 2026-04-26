'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { hasPermission, canPerformActions } from '@/lib/permissions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Search, Plus, CreditCard, TrendingUp, DollarSign, Loader2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { AddPaymentModal } from '@/components/sales/AddPaymentModal'

type PaymentMethod = 'Credit Card' | 'ACH' | 'Check' | 'Financing' | 'Zelle' | 'Cash'

type PeriodFilter = 'day' | 'week' | 'month' | 'fiscal_year' | 'all'

interface Payment {
  id: string
  paymentNumber: string
  invoiceId?: string
  invoiceNumber?: string
  customerId?: string
  customerName: string
  sideMark?: string
  amount: number
  date: string
  method: string
  isPartial?: boolean
}

const methodOptions: PaymentMethod[] = ['Credit Card', 'ACH', 'Check', 'Financing', 'Zelle', 'Cash']

export default function PaymentsPage() {
  const { user, token } = useAuthStore()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState({ paidCount: 0, partiallyPaidCount: 0 })
  const [loading, setLoading] = useState(true)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [methodFilter, setMethodFilter] = useState<'all' | string>('all')
  const [search, setSearch] = useState('')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<{
    id: string
    invoiceNumber: string
    customerId: string
    customerName: string
    sideMark: string
    dueAmount: number
  } | null>(null)
  const canPerformActionsOnSales = canPerformActions(user, 'sales')

  const fetchPayments = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (periodFilter && periodFilter !== 'all') params.set('period', periodFilter)
      const res = await fetch(`/api/payments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch payments')
      const data = await res.json()
      setPayments((data.payments || []).map((p: any) => ({
        id: p.id || p._id,
        paymentNumber: p.paymentNumber,
        invoiceId: p.invoiceId,
        invoiceNumber: p.invoiceNumber,
        customerId: p.customerId,
        customerName: p.customerName,
        sideMark: p.sideMark || '',
        amount: p.amount ?? 0,
        date: p.date,
        method: p.method,
        isPartial: !!p.isPartial,
      })))
      setStats(data.stats ?? { paidCount: 0, partiallyPaidCount: 0 })
    } catch (err) {
      console.error(err)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [token, periodFilter])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  useEffect(() => {
    if (user && !hasPermission(user, 'view_payments')) {
      router.push('/dashboard')
    }
  }, [user, router])

  if (!user || !hasPermission(user, 'view_payments')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        p.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        p.paymentNumber?.toLowerCase().includes(search.toLowerCase()) ||
        (p.sideMark || '').toLowerCase().includes(search.toLowerCase())
      const matchesMethod = methodFilter === 'all' || p.method === methodFilter
      return matchesSearch && matchesMethod
    })
  }, [payments, search, methodFilter])

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)

  const handleRecordPayment = () => {
    setSelectedInvoiceForPayment(null)
    setPaymentModalOpen(true)
  }

  const handleAddPaymentForInvoice = async (invoiceId: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      const inv = data.invoice
      setSelectedInvoiceForPayment({
        id: inv.id || inv._id,
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId,
        customerName: inv.customerName,
        sideMark: inv.sideMark || '',
        dueAmount: inv.dueAmount ?? 0,
      })
      setPaymentModalOpen(true)
    } catch {
      // ignore
    }
  }

  const portalPayments = payments.length > 0
    ? payments.filter((p) => p.customerName === payments[0]?.customerName)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Payments</h2>
          <p className="text-sm text-muted-foreground">
            Centralized view of all payments across quotes and invoices
          </p>
        </div>
        {canPerformActionsOnSales && (
          <Link href="/invoices">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </Link>
        )}
      </div>

      {/* Counters */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collected
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid (Invoices)
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.paidCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Partially Paid
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.partiallyPaidCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {payments.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Filtered
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{filtered.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Filters + table */}
        <div className="space-y-4 lg:col-span-2">
          {/* Filters */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search payments or customers..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={periodFilter}
                  onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="day">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="fiscal_year">Fiscal Year</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={methodFilter}
                  onValueChange={(v) => setMethodFilter(v as any)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {methodOptions.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Side Mark</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Linked</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.date ? new Date(p.date).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{p.customerName}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.sideMark || '—'}
                      </TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="border-0 text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                            Completed
                          </Badge>
                          {p.isPartial && (
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400">
                              Partial
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.invoiceId && (
                          <span>
                            Invoice{' '}
                            <Link href={`/invoices/${p.invoiceId}`} className="underline">
                              {p.invoiceNumber || p.invoiceId}
                            </Link>
                          </span>
                        )}
                        {!p.invoiceId && '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(p.amount)}
                      </TableCell>
                      <TableCell>
                        {p.invoiceId && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleAddPaymentForInvoice(p.invoiceId!)}
                          >
                            Add Payment
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>

        {/* Right column: Customer Portal Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Customer Portal (Preview)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-xs text-muted-foreground">
                This is how customers will see their payment history and pay outstanding balances.
              </p>
              <div className="rounded-lg border bg-gray-50 dark:bg-gray-700 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Customer</span>
                  <span>{portalPayments[0]?.customerName || '—'}</span>
                </div>
                <Separator />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Method</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portalPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs">
                          {new Date(p.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs">{p.method}</TableCell>
                        <TableCell className="text-xs text-right">
                          {formatCurrency(p.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedInvoiceForPayment && (
        <AddPaymentModal
          open={paymentModalOpen}
          onOpenChange={(open) => {
            setPaymentModalOpen(open)
            if (!open) setSelectedInvoiceForPayment(null)
          }}
          invoiceId={selectedInvoiceForPayment.id}
          invoiceNumber={selectedInvoiceForPayment.invoiceNumber}
          customerId={selectedInvoiceForPayment.customerId}
          customerName={selectedInvoiceForPayment.customerName}
          sideMark={selectedInvoiceForPayment.sideMark}
          maxAmount={selectedInvoiceForPayment.dueAmount}
          onPaymentRecorded={fetchPayments}
        />
      )}
    </div>
  )
}

