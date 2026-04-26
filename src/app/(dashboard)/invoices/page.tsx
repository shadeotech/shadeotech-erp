'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  MoreHorizontal,
  Eye,
  Send,
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Filter,
  ArrowUpDown,
  DollarSign,
  Loader2,
  Kanban,
  List,
  Bell,
  Mail,
} from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { AddPaymentModal } from '@/components/sales/AddPaymentModal'
import { InvoicePreviewDialog } from '@/components/sales/InvoicePreviewDialog'
import { CreateInvoiceModal } from '@/components/invoices/CreateInvoiceModal'
import { useAuthStore } from '@/stores/authStore'
import { canPerformActions } from '@/lib/permissions'
import { DataPagination } from '@/components/ui/data-pagination'

interface Invoice {
  id: string
  invoiceNumber: string
  quoteId?: string
  orderId?: string
  orderNumber?: string
  customerId: string
  customerName: string
  dealerId?: string
  dealerName?: string
  sideMark: string
  totalAmount: number
  paidAmount: number
  dueAmount: number
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Draft'
  statusDb?: string
  sentAt?: string
  dueDate: string
  createdAt: string
  items?: Array<{ id?: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }>
}

export default function InvoicesPage() {
  const { user, token } = useAuthStore()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<{
    id: string
    invoiceNumber: string
    customerId: string
    customerName: string
    sideMark: string
    maxAmount: number
  } | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState<typeof invoices[0] | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [view, setView] = useState<'table' | 'pipeline'>('table')
  const canPerformActionsOnSales = canPerformActions(user, 'sales')

  const handleSendToDealer = async (invoice: Invoice) => {
    if (!token || !invoice.dealerId) return
    if (invoice.sentAt) return
    try {
      setSendingId(invoice.id)
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
      await fetchInvoices()
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Failed to send invoice')
    } finally {
      setSendingId(null)
    }
  }

  const handleSendInvoice = async (invoice: Invoice) => {
    if (!token) return
    try {
      setSendingId(invoice.id)
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'invoice' }),
      })
      if (!res.ok) throw new Error('Failed to send invoice')
      alert(`Invoice ${invoice.invoiceNumber} sent to ${invoice.customerName}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invoice')
    } finally {
      setSendingId(null)
    }
  }

  const handleSendReminder = async (invoice: Invoice) => {
    if (!token) return
    const balance = invoice.totalAmount - (invoice.paidAmount ?? 0)
    if (balance <= 0) { alert('This invoice has no outstanding balance.'); return }
    try {
      setSendingId(invoice.id)
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'reminder', balance }),
      })
      if (!res.ok) throw new Error('Failed to send reminder')
      alert(`Payment reminder sent to ${invoice.customerName} for ${formatCurrency(balance)}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send reminder')
    } finally {
      setSendingId(null)
    }
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt-desc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const fetchInvoices = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await fetch('/api/invoices', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch invoices')
      const data = await res.json()
      const list = (data.invoices || []).map((inv: any) => ({
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
        items: inv.items,
      }))
      setInvoices(list)
    } catch (err) {
      console.error(err)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const counters = useMemo(() => {
    const total = invoices.length
    const totalAmount = invoices.reduce((s, inv) => s + inv.totalAmount, 0)
    const unpaidInvs = invoices.filter((inv) => inv.status === 'Unpaid')
    const partialInvs = invoices.filter((inv) => inv.status === 'Partially Paid')
    const overdueInvs = invoices.filter((inv) => inv.status === 'Overdue')
    return {
      total,
      totalAmount,
      unpaid: unpaidInvs.length,
      unpaidAmount: unpaidInvs.reduce((s, inv) => s + inv.dueAmount, 0),
      partiallyPaid: partialInvs.length,
      partialAmount: partialInvs.reduce((s, inv) => s + inv.dueAmount, 0),
      overdue: overdueInvs.length,
      overdueAmount: overdueInvs.reduce((s, inv) => s + inv.dueAmount, 0),
    }
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    let filtered = statusFilter === 'all' ? invoices : invoices.filter((inv) => inv.status === statusFilter)

    if (searchTerm) {
      filtered = filtered.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (inv.sideMark && inv.sideMark.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    const [sortField, sortOrder] = sortBy.split('-')
    return [...filtered].sort((a, b) => {
      let aVal: number | string
      let bVal: number | string

      if (sortField === 'createdAt' || sortField === 'dueDate') {
        aVal = new Date(a[sortField as keyof typeof a] as string).getTime()
        bVal = new Date(b[sortField as keyof typeof b] as string).getTime()
      } else if (sortField === 'totalAmount' || sortField === 'dueAmount') {
        aVal = a[sortField as keyof typeof a] as number
        bVal = b[sortField as keyof typeof b] as number
      } else {
        aVal = String(a[sortField as keyof typeof a] ?? '')
        bVal = String(b[sortField as keyof typeof b] ?? '')
      }

      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1)
    })
  }, [invoices, searchTerm, statusFilter, sortBy])

  const paginatedInvoices = useMemo(
    () => filteredInvoices.slice((page - 1) * perPage, page * perPage),
    [filteredInvoices, page, perPage]
  )

  const handleRecordPayment = (invoice: typeof invoices[0]) => {
    setSelectedInvoice({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      sideMark: invoice.sideMark,
      maxAmount: invoice.dueAmount,
    })
    setIsPaymentModalOpen(true)
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return (
          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            <FileText className="w-3 h-3 mr-1" />Draft
          </Badge>
        )
      case 'Paid':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3 mr-1" />Paid
          </Badge>
        )
      case 'Overdue':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="w-3 h-3 mr-1" />Overdue
          </Badge>
        )
      case 'Partially Paid':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3 mr-1" />Partially Paid
          </Badge>
        )
      case 'Unpaid':
        return (
          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            <Clock className="w-3 h-3 mr-1" />Unpaid
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            <X className="w-3 h-3 mr-1" />{status}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage invoices and track payments for approved estimates
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md border overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${view === 'table' ? 'bg-amber-500 text-white' : 'bg-background text-muted-foreground hover:bg-muted'}`}
            >
              <List className="h-4 w-4" />
              Table
            </button>
            <button
              onClick={() => setView('pipeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${view === 'pipeline' ? 'bg-amber-500 text-white' : 'bg-background text-muted-foreground hover:bg-muted'}`}
            >
              <Kanban className="h-4 w-4" />
              Pipeline
            </button>
          </div>
          {canPerformActionsOnSales && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Counter Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4" style={{ borderLeftColor: '#92400E' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.total}</div>
            <p className="text-xs font-medium text-gray-900 dark:text-white mt-0.5">{formatCurrency(counters.totalAmount)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredInvoices.length} shown</p>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#D97706' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.unpaid}</div>
            <p className="text-xs font-medium text-gray-900 dark:text-white mt-0.5">{formatCurrency(counters.unpaidAmount)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Partially Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.partiallyPaid}</div>
            <p className="text-xs font-medium text-gray-900 dark:text-white mt-0.5">{formatCurrency(counters.partialAmount)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Balance remaining</p>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#DC2626' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.overdue}</div>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-0.5">{formatCurrency(counters.overdueAmount)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline View */}
      {view === 'pipeline' && (() => {
        const PIPELINE_COLS = [
          { status: 'Draft', color: 'border-gray-400' },
          { status: 'Unpaid', color: 'border-blue-400' },
          { status: 'Partially Paid', color: 'border-yellow-400' },
          { status: 'Paid', color: 'border-green-400' },
          { status: 'Overdue', color: 'border-red-400' },
        ]
        return (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {PIPELINE_COLS.map(({ status, color }) => {
              const colInvs = filteredInvoices.filter((inv) => inv.status === status)
              const colTotal = colInvs.reduce((s, inv) => s + inv.totalAmount, 0)
              return (
                <div key={status} className="flex-shrink-0 w-64">
                  <div className={`rounded-t-lg border-t-4 ${color} bg-muted/50 px-3 py-2 flex items-center justify-between`}>
                    <span className="text-xs font-semibold uppercase tracking-wide">{status}</span>
                    <span className="text-xs bg-background rounded-full px-2 py-0.5 font-medium">{colInvs.length}</span>
                  </div>
                  <div className="space-y-2 p-2 bg-muted/20 rounded-b-lg min-h-[120px]">
                    {colTotal > 0 && (
                      <p className="text-xs font-medium text-muted-foreground px-1">{formatCurrency(colTotal)}</p>
                    )}
                    {colInvs.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-background rounded-lg border p-3 space-y-1.5 cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => { setPreviewInvoice(inv); setPreviewOpen(true) }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-xs font-semibold text-foreground">{inv.invoiceNumber}</span>
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(inv.totalAmount)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{inv.customerName}</p>
                        {inv.dueDate && (
                          <p className="text-[10px] text-muted-foreground">Due {format(new Date(inv.dueDate), 'MMM d, yyyy')}</p>
                        )}
                      </div>
                    ))}
                    {colInvs.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No invoices</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {view === 'table' && (
        <>
      {/* Search, Filter, Sort */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoices, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="dueDate-asc">Due: Soonest</SelectItem>
                <SelectItem value="dueDate-desc">Due: Latest</SelectItem>
                <SelectItem value="totalAmount-desc">Highest Amount</SelectItem>
                <SelectItem value="totalAmount-asc">Lowest Amount</SelectItem>
                <SelectItem value="dueAmount-desc">Highest Balance</SelectItem>
                <SelectItem value="dueAmount-asc">Lowest Balance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            View and manage invoices associated with approved quotes and orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No invoices found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>{invoice.customerName}</div>
                      <div className="text-xs text-muted-foreground">{invoice.sideMark}</div>
                    </TableCell>
                    <TableCell>{renderStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(invoice.paidAmount)}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(invoice.dueAmount)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {canPerformActionsOnSales ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open actions menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setPreviewInvoice(invoice)
                                setPreviewOpen(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/invoices/${invoice.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRecordPayment(invoice)}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSendInvoice(invoice)}
                              disabled={!!sendingId}
                            >
                              {sendingId === invoice.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="mr-2 h-4 w-4" />
                              )}
                              Send Invoice
                            </DropdownMenuItem>
                            {(invoice.totalAmount - (invoice.paidAmount ?? 0)) > 0 && (
                              <DropdownMenuItem
                                onClick={() => handleSendReminder(invoice)}
                                disabled={!!sendingId}
                              >
                                <Bell className="mr-2 h-4 w-4" />
                                Send Reminder
                              </DropdownMenuItem>
                            )}
                            {invoice.dealerId && (
                              <DropdownMenuItem
                                onClick={() => !invoice.sentAt && handleSendToDealer(invoice)}
                                disabled={!!invoice.sentAt || !!sendingId}
                              >
                                {sendingId === invoice.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="mr-2 h-4 w-4" />
                                )}
                                {invoice.sentAt ? 'Sent to Dealer' : 'Send to Dealer'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <DataPagination
            total={filteredInvoices.length}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(n) => { setPerPage(n); setPage(1) }}
          />
        </CardContent>
      </Card>
        </>
      )}

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchInvoices}
      />

      {/* Invoice Preview Dialog */}
      <InvoicePreviewDialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open)
          if (!open) setPreviewInvoice(null)
        }}
        invoice={previewInvoice}
      />

      {/* Add Payment Modal */}
      {selectedInvoice && (
        <AddPaymentModal
          open={isPaymentModalOpen}
          onOpenChange={(open) => {
            setIsPaymentModalOpen(open)
            if (!open) setSelectedInvoice(null)
          }}
          invoiceId={selectedInvoice.id}
          invoiceNumber={selectedInvoice.invoiceNumber}
          customerId={selectedInvoice.customerId}
          customerName={selectedInvoice.customerName}
          sideMark={selectedInvoice.sideMark}
          maxAmount={selectedInvoice.maxAmount}
          onPaymentRecorded={fetchInvoices}
        />
      )}
    </div>
  )
}
