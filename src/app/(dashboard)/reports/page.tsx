'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  Download,
  ArrowLeft,
  Search,
  Shield,
  MoreHorizontal,
  Eye,
  Printer,
  Mail,
  ShieldOff,
  ShieldCheck,
  Ban,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { useQuotesStore, type Quote } from '@/stores/quotesStore'

type ReportType = 'deals_closed' | 'sales_summary' | 'quote_performance' | 'revenue_by_period' | 'warranty_registration'

interface Report {
  id: ReportType
  title: string
  description: string
  icon: React.ReactNode
  category: string
}

const reports: Report[] = [
  {
    id: 'deals_closed',
    title: 'Deals Closed %',
    description: 'Percentage of deals closed (won/lost). Multiple quotes for the same order count as one.',
    icon: <TrendingUp className="h-5 w-5" />,
    category: 'Sales',
  },
  {
    id: 'sales_summary',
    title: 'Sales Summary',
    description: 'Overview of all sales transactions and revenue',
    icon: <DollarSign className="h-5 w-5" />,
    category: 'Sales',
  },
  {
    id: 'quote_performance',
    title: 'Quote Performance',
    description: 'Performance metrics for quotes by status and conversion rates',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'Sales',
  },
  {
    id: 'revenue_by_period',
    title: 'Revenue by Period',
    description: 'Revenue breakdown by month, quarter, or year',
    icon: <Calendar className="h-5 w-5" />,
    category: 'Financial',
  },
  {
    id: 'warranty_registration',
    title: 'Warranty Registration List',
    description: 'List of all registered product warranties with customer details',
    icon: <Shield className="h-5 w-5" />,
    category: 'Service',
  },
]

interface WarrantyRegistration {
  id: string
  customerName: string
  sideMark: string
  productName: string
  category: string
  serialNumber: string
  purchaseDate: string
  warrantyStartDate: string
  warrantyEndDate: string
  warrantyPeriod: string
  status: string
  email: string
  phone: string
  installationDate: string
}

const CANCELLATION_REASONS = [
  'Chargeback',
  'Payment Dispute',
  'Fraudulent Transaction',
  'Customer Request',
  'Other',
] as const
type CancellationReason = typeof CANCELLATION_REASONS[number]

export default function ReportsPage() {
  const router = useRouter()
  const { quotes } = useQuotesStore()
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [previewWarranty, setPreviewWarranty] = useState<WarrantyRegistration | null>(null)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<WarrantyRegistration | null>(null)
  const [cancelReason, setCancelReason] = useState<CancellationReason>('Chargeback')
  const [cancelNote, setCancelNote] = useState('')
  const [inactiveMap, setInactiveMap] = useState<Record<string, { reason: CancellationReason; note: string; date: string }>>({})
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const handleGenerateReport = (reportId: ReportType) => {
    setSelectedReport(reportId)
  }

  const handleBack = () => {
    setSelectedReport(null)
    setDateFrom('')
    setDateTo('')
  }

  const handlePrintWarranty = (warranty: WarrantyRegistration) => {
    const win = window.open('', '_blank', 'width=800,height=600')
    if (!win) return
    win.document.write(`
      <html><head><title>Warranty Certificate – ${warranty.id}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .sub { color: #666; font-size: 14px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        td { padding: 8px 12px; border: 1px solid #ddd; font-size: 14px; }
        td:first-child { font-weight: 600; width: 200px; background: #f9f9f9; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px;
          background: ${warranty.status === 'Active' ? '#dcfce7' : warranty.status === 'Expiring Soon' ? '#ffedd5' : '#fee2e2'};
          color: ${warranty.status === 'Active' ? '#166534' : warranty.status === 'Expiring Soon' ? '#9a3412' : '#991b1b'}; }
      </style></head><body>
      <h1>Warranty Certificate</h1>
      <div class="sub">Registration ID: ${warranty.id}</div>
      <table>
        <tr><td>Customer</td><td>${warranty.customerName}</td></tr>
        <tr><td>Email</td><td>${warranty.email}</td></tr>
        <tr><td>Phone</td><td>${warranty.phone}</td></tr>
        <tr><td>Side Mark</td><td>${warranty.sideMark}</td></tr>
        <tr><td>Product</td><td>${warranty.productName}</td></tr>
        <tr><td>Category</td><td>${warranty.category}</td></tr>
        <tr><td>Serial Number</td><td>${warranty.serialNumber}</td></tr>
        <tr><td>Purchase Date</td><td>${format(new Date(warranty.purchaseDate), 'MMM dd, yyyy')}</td></tr>
        <tr><td>Installation Date</td><td>${format(new Date(warranty.installationDate), 'MMM dd, yyyy')}</td></tr>
        <tr><td>Warranty Period</td><td>${warranty.warrantyPeriod}</td></tr>
        <tr><td>Valid From</td><td>${format(new Date(warranty.warrantyStartDate), 'MMM dd, yyyy')}</td></tr>
        <tr><td>Valid Until</td><td>${format(new Date(warranty.warrantyEndDate), 'MMM dd, yyyy')}</td></tr>
        <tr><td>Status</td><td><span class="badge">${warranty.status}</span></td></tr>
      </table>
      </body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  const handleSendEmail = async (warranty: WarrantyRegistration) => {
    setSendingEmail(warranty.id)
    try {
      await fetch('/api/warranty/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warrantyId: warranty.id, email: warranty.email }),
      })
    } catch (_) {
      // best-effort
    } finally {
      setSendingEmail(null)
    }
  }

  const confirmCancelWarranty = () => {
    if (!cancelTarget) return
    setInactiveMap(prev => ({
      ...prev,
      [cancelTarget.id]: {
        reason: cancelReason,
        note: cancelNote.trim(),
        date: new Date().toISOString().split('T')[0],
      },
    }))
    setCancelTarget(null)
    setCancelNote('')
    setCancelReason('Chargeback')
  }

  const handleReactivate = (warrantyId: string) => {
    setInactiveMap(prev => {
      const next = { ...prev }
      delete next[warrantyId]
      return next
    })
  }

  // Filter reports by search
  const filteredReports = useMemo(() => {
    if (!search) return reports
    return reports.filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  // Filter quotes by date range
  const filteredQuotes = useMemo(() => {
    let filtered = [...quotes]
    
    if (dateFrom) {
      filtered = filtered.filter(q => new Date(q.createdAt) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter(q => new Date(q.createdAt) <= new Date(dateTo))
    }
    
    return filtered
  }, [quotes, dateFrom, dateTo])

  // Generate Deals Closed Report
  const dealsClosedReport = useMemo(() => {
    if (selectedReport !== 'deals_closed') return null

    // Group quotes by customer and order (using customerId as order identifier)
    // For the same customer, we only count one quote per "order" (customerId)
    const customerOrders = new Map<string, {
      customerId: string
      customerName: string
      quotes: Quote[]
      hasWon: boolean
      hasLost: boolean
      finalStatus: 'WON' | 'LOST' | 'PENDING'
    }>()

    filteredQuotes.forEach(quote => {
      // Only consider quotes that are WON or LOST for this report
      if (quote.status !== 'WON' && quote.status !== 'LOST') return

      const key = quote.customerId
      
      if (!customerOrders.has(key)) {
        customerOrders.set(key, {
          customerId: quote.customerId,
          customerName: quote.customerName,
          quotes: [],
          hasWon: false,
          hasLost: false,
          finalStatus: 'PENDING',
        })
      }

      const order = customerOrders.get(key)!
      order.quotes.push(quote)
      
      if (quote.status === 'WON') {
        order.hasWon = true
      }
      if (quote.status === 'LOST') {
        order.hasLost = true
      }
    })

    // Determine final status for each order
    // If a customer has both WON and LOST quotes, WON takes precedence
    const orders = Array.from(customerOrders.values()).map(order => ({
      ...order,
      finalStatus: order.hasWon ? 'WON' as const : order.hasLost ? 'LOST' as const : 'PENDING' as const,
    }))

    const wonOrders = orders.filter(o => o.finalStatus === 'WON')
    const lostOrders = orders.filter(o => o.finalStatus === 'LOST')
    const totalOrders = wonOrders.length + lostOrders.length
    const winRate = totalOrders > 0 ? (wonOrders.length / totalOrders) * 100 : 0

    return {
      totalOrders,
      wonOrders: wonOrders.length,
      lostOrders: lostOrders.length,
      winRate,
      orders,
    }
  }, [selectedReport, filteredQuotes])

  // Mock Warranty Registration Data
  const warrantyRegistrations = useMemo((): WarrantyRegistration[] => {
    return [
      {
        id: 'WR-2024-001',
        customerName: 'John Smith',
        sideMark: 'SH-R12345',
        productName: 'Motorized Roller Shades',
        category: 'Roller Shades',
        serialNumber: 'RS-2024-001234',
        purchaseDate: '2024-01-15',
        warrantyStartDate: '2024-01-20',
        warrantyEndDate: '2029-01-20',
        warrantyPeriod: '5 years',
        status: 'Active',
        email: 'john.smith@email.com',
        phone: '(555) 123-4567',
        installationDate: '2024-01-20',
      },
      {
        id: 'WR-2024-002',
        customerName: 'Michael Johnson',
        sideMark: 'SH-R34567',
        productName: 'Plantation Shutters',
        category: 'Shutters',
        serialNumber: 'PS-2024-002456',
        purchaseDate: '2024-01-12',
        warrantyStartDate: '2024-01-15',
        warrantyEndDate: '2029-01-15',
        warrantyPeriod: '5 years',
        status: 'Active',
        email: 'michael.j@email.com',
        phone: '(555) 234-5678',
        installationDate: '2024-01-15',
      },
      {
        id: 'WR-2023-045',
        customerName: 'Jane Doe',
        sideMark: 'SH-R45678',
        productName: 'Cellular Shades',
        category: 'Cellular Shades',
        serialNumber: 'CS-2023-004567',
        purchaseDate: '2023-06-10',
        warrantyStartDate: '2023-06-15',
        warrantyEndDate: '2028-06-15',
        warrantyPeriod: '5 years',
        status: 'Active',
        email: 'jane.doe@email.com',
        phone: '(555) 345-6789',
        installationDate: '2023-06-15',
      },
      {
        id: 'WR-2023-032',
        customerName: 'XYZ Corporation',
        sideMark: 'SH-C45678',
        productName: 'Commercial Roller Shades',
        category: 'Roller Shades',
        serialNumber: 'CRS-2023-003210',
        purchaseDate: '2023-03-20',
        warrantyStartDate: '2023-04-01',
        warrantyEndDate: '2028-04-01',
        warrantyPeriod: '5 years',
        status: 'Active',
        email: 'facilities@xyzcorp.com',
        phone: '(555) 456-7890',
        installationDate: '2023-04-01',
      },
      {
        id: 'WR-2022-089',
        customerName: 'Sarah Williams',
        sideMark: 'SH-R56789',
        productName: 'Zebra Blinds',
        category: 'Zebra Blinds',
        serialNumber: 'ZB-2022-008912',
        purchaseDate: '2022-08-15',
        warrantyStartDate: '2022-08-20',
        warrantyEndDate: '2027-08-20',
        warrantyPeriod: '5 years',
        status: 'Active',
        email: 'sarah.w@email.com',
        phone: '(555) 567-8901',
        installationDate: '2022-08-20',
      },
      {
        id: 'WR-2021-123',
        customerName: 'David Brown',
        sideMark: 'SH-R67890',
        productName: 'Roman Shades',
        category: 'Roman Shades',
        serialNumber: 'ROM-2021-012345',
        purchaseDate: '2021-11-10',
        warrantyStartDate: '2021-11-15',
        warrantyEndDate: '2026-11-15',
        warrantyPeriod: '5 years',
        status: 'Expiring Soon',
        email: 'dbrown@email.com',
        phone: '(555) 678-9012',
        installationDate: '2021-11-15',
      },
    ]
  }, [])

  // Filter warranties by date range and search
  const filteredWarranties = useMemo(() => {
    let filtered = [...warrantyRegistrations]

    if (dateFrom) {
      filtered = filtered.filter(w => new Date(w.purchaseDate) >= new Date(dateFrom))
    }
    if (dateTo) {
      filtered = filtered.filter(w => new Date(w.purchaseDate) <= new Date(dateTo))
    }
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(w =>
        w.customerName.toLowerCase().includes(searchLower) ||
        w.sideMark.toLowerCase().includes(searchLower) ||
        w.productName.toLowerCase().includes(searchLower) ||
        w.serialNumber.toLowerCase().includes(searchLower) ||
        w.id.toLowerCase().includes(searchLower)
      )
    }

    if (statusFilter === 'inactive') {
      filtered = filtered.filter(w => !!inactiveMap[w.id])
    } else if (statusFilter === 'active') {
      filtered = filtered.filter(w => !inactiveMap[w.id])
    }

    return filtered
  }, [warrantyRegistrations, dateFrom, dateTo, search, statusFilter, inactiveMap])

  if (selectedReport) {
    return (
      <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-medium">
                {reports.find(r => r.id === selectedReport)?.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {reports.find(r => r.id === selectedReport)?.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              placeholder="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              placeholder="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        {/* Deals Closed Report */}
        {selectedReport === 'deals_closed' && dealsClosedReport && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{dealsClosedReport.totalOrders}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unique customer orders (multiple quotes per order count as one)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Won Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-green-600">
                    {dealsClosedReport.wonOrders}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dealsClosedReport.totalOrders > 0
                      ? ((dealsClosedReport.wonOrders / dealsClosedReport.totalOrders) * 100).toFixed(1)
                      : 0}% of total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Lost Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-red-600">
                    {dealsClosedReport.lostOrders}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dealsClosedReport.totalOrders > 0
                      ? ((dealsClosedReport.lostOrders / dealsClosedReport.totalOrders) * 100).toFixed(1)
                      : 0}% of total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-blue-600">
                    {dealsClosedReport.winRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Percentage of deals closed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>
                  Each row represents one customer order. Multiple quotes for the same customer count as one order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Total Quotes</TableHead>
                        <TableHead>Won Quotes</TableHead>
                        <TableHead>Lost Quotes</TableHead>
                        <TableHead>Total Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dealsClosedReport.orders.map((order) => (
                        <TableRow key={order.customerId}>
                          <TableCell className="font-medium">
                            {order.customerName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                order.finalStatus === 'WON'
                                  ? 'bg-green-500/10 text-green-600 border-0'
                                  : 'bg-red-500/10 text-red-600 border-0'
                              }
                            >
                              {order.finalStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.quotes.length}</TableCell>
                          <TableCell>
                            {order.quotes.filter(q => q.status === 'WON').length}
                          </TableCell>
                          <TableCell>
                            {order.quotes.filter(q => q.status === 'LOST').length}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(
                              order.quotes.reduce((sum, q) => sum + q.totalAmount, 0)
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Warranty Registration List Report */}
        {selectedReport === 'warranty_registration' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Warranties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{warrantyRegistrations.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">All registered warranties</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-green-600">
                    {warrantyRegistrations.filter(w => !inactiveMap[w.id] && w.status === 'Active').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Currently active warranties</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Expiring Soon</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-orange-600">
                    {warrantyRegistrations.filter(w => !inactiveMap[w.id] && w.status === 'Expiring Soon').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Within next 6 months</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Inactive / Cancelled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-slate-500">
                    {Object.keys(inactiveMap).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Chargebacks & disputes</p>
                </CardContent>
              </Card>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search warranties by customer, product, serial number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Warranty Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Warranty Registrations</CardTitle>
                    <CardDescription>
                      Complete list of all registered product warranties with customer information
                    </CardDescription>
                  </div>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Warranties</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Registration ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Purchase Date</TableHead>
                        <TableHead>Warranty Period</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWarranties.length > 0 ? (
                        filteredWarranties.map((warranty) => {
                          const inactive = inactiveMap[warranty.id]
                          return (
                          <TableRow key={warranty.id} className={inactive ? 'opacity-60' : ''}>
                            <TableCell className={`font-medium ${inactive ? 'line-through text-muted-foreground' : ''}`}>
                              {warranty.id}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{warranty.customerName}</p>
                                <p className="text-xs text-muted-foreground">{warranty.sideMark}</p>
                                <p className="text-xs text-muted-foreground">{warranty.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{warranty.productName}</p>
                                <p className="text-xs text-muted-foreground">{warranty.category}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {warranty.serialNumber}
                            </TableCell>
                            <TableCell>
                              {format(new Date(warranty.purchaseDate), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              {warranty.warrantyPeriod}
                            </TableCell>
                            <TableCell>
                              {format(new Date(warranty.warrantyEndDate), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              {inactive ? (
                                <div className="space-y-1">
                                  <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-0">
                                    Inactive
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">{inactive.reason}</p>
                                </div>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={
                                    warranty.status === 'Active'
                                      ? 'bg-green-500/10 text-green-600 border-0'
                                      : warranty.status === 'Expiring Soon'
                                      ? 'bg-orange-500/10 text-orange-600 border-0'
                                      : 'bg-red-500/10 text-red-600 border-0'
                                  }
                                >
                                  {warranty.status}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setPreviewWarranty(warranty)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePrintWarranty(warranty)}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleSendEmail(warranty)}
                                    disabled={!!inactive || sendingEmail === warranty.id}
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    {sendingEmail === warranty.id ? 'Sending…' : 'Send Email'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {inactive ? (
                                    <DropdownMenuItem onClick={() => handleReactivate(warranty.id)}>
                                      <ShieldCheck className="h-4 w-4 mr-2 text-green-600" />
                                      <span className="text-green-600">Reactivate Warranty</span>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => { setCancelTarget(warranty); setCancelReason('Chargeback'); setCancelNote('') }}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Ban className="h-4 w-4 mr-2" />
                                      Cancel Warranty
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No warranty registrations found matching your criteria
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other Reports Placeholder */}
        {selectedReport !== 'deals_closed' && selectedReport !== 'warranty_registration' && (
          <Card>
            <CardHeader>
              <CardTitle>{reports.find(r => r.id === selectedReport)?.title}</CardTitle>
              <CardDescription>
                This report will be generated based on the selected date range.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Report generation will be implemented with backend integration.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Cancel Warranty Dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              Cancel Warranty
            </DialogTitle>
            <DialogDescription>
              This will mark the warranty as <strong>Inactive</strong>. The customer will no longer be covered. You can reactivate it at any time.
            </DialogDescription>
          </DialogHeader>
          {cancelTarget && (
            <div className="space-y-4 py-1">
              <div className="rounded-lg border px-4 py-3 bg-muted/40 text-sm space-y-1">
                <p className="font-medium">{cancelTarget.customerName}</p>
                <p className="text-muted-foreground">{cancelTarget.productName} · {cancelTarget.serialNumber}</p>
                <p className="text-muted-foreground">Registration: {cancelTarget.id}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Reason for Cancellation</Label>
                <Select value={cancelReason} onValueChange={(v) => setCancelReason(v as CancellationReason)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCELLATION_REASONS.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  placeholder="Add internal notes about the chargeback or dispute…"
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmCancelWarranty}>
              <ShieldOff className="h-4 w-4 mr-2" />
              Confirm — Mark Inactive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warranty Preview Modal */}
      <Dialog open={!!previewWarranty} onOpenChange={(open) => { if (!open) setPreviewWarranty(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Warranty Certificate
            </DialogTitle>
          </DialogHeader>
          {previewWarranty && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Registration ID</span>
                <span className="font-mono font-semibold">{previewWarranty.id}</span>
              </div>
              <div className="border rounded-lg divide-y text-sm">
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{previewWarranty.customerName}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-muted-foreground">Email</span>
                  <span>{previewWarranty.email}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{previewWarranty.phone}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-muted-foreground">Side Mark</span>
                  <span className="font-mono">{previewWarranty.sideMark}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-muted-foreground">Product</span>
                  <span className="font-medium">{previewWarranty.productName}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-muted-foreground">Category</span>
                  <span>{previewWarranty.category}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-muted-foreground">Serial Number</span>
                  <span className="font-mono">{previewWarranty.serialNumber}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-muted-foreground">Purchase Date</span>
                  <span>{format(new Date(previewWarranty.purchaseDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-muted-foreground">Installation Date</span>
                  <span>{format(new Date(previewWarranty.installationDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-muted-foreground">Warranty Period</span>
                  <span>{previewWarranty.warrantyPeriod}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-muted-foreground">Valid Until</span>
                  <span className="font-medium">{format(new Date(previewWarranty.warrantyEndDate), 'MMM dd, yyyy')}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5 items-start">
                  <span className="text-muted-foreground">Status</span>
                  {inactiveMap[previewWarranty.id] ? (
                    <div className="space-y-0.5">
                      <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-0 w-fit">
                        Inactive
                      </Badge>
                      <p className="text-xs text-muted-foreground">{inactiveMap[previewWarranty.id].reason}</p>
                      {inactiveMap[previewWarranty.id].note && (
                        <p className="text-xs text-muted-foreground italic">{inactiveMap[previewWarranty.id].note}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Cancelled {inactiveMap[previewWarranty.id].date}</p>
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className={
                        previewWarranty.status === 'Active'
                          ? 'bg-green-500/10 text-green-600 border-0 w-fit'
                          : previewWarranty.status === 'Expiring Soon'
                          ? 'bg-orange-500/10 text-orange-600 border-0 w-fit'
                          : 'bg-red-500/10 text-red-600 border-0 w-fit'
                      }
                    >
                      {previewWarranty.status}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => handlePrintWarranty(previewWarranty)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                {inactiveMap[previewWarranty.id] ? (
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => { handleReactivate(previewWarranty.id); setPreviewWarranty(null) }}
                  >
                    <ShieldCheck className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-green-600">Reactivate</span>
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => { handleSendEmail(previewWarranty); setPreviewWarranty(null) }}
                    disabled={sendingEmail === previewWarranty.id}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {sendingEmail === previewWarranty.id ? 'Sending…' : 'Send Email'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Reports</h2>
          <p className="text-sm text-muted-foreground">
            Generate and view business reports
          </p>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredReports.map((report) => (
          <Card
            key={report.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleGenerateReport(report.id)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  {report.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <Badge variant="outline" className="mt-1 bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-0">
                    {report.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{report.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

