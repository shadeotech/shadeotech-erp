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

export default function ReportsPage() {
  const router = useRouter()
  const { quotes } = useQuotesStore()
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')

  const handleGenerateReport = (reportId: ReportType) => {
    setSelectedReport(reportId)
  }

  const handleBack = () => {
    setSelectedReport(null)
    setDateFrom('')
    setDateTo('')
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
  const warrantyRegistrations = useMemo(() => {
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

    return filtered
  }, [warrantyRegistrations, dateFrom, dateTo, search])

  if (selectedReport) {
    return (
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
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Warranties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{filteredWarranties.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registered products under warranty
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-green-600">
                    {filteredWarranties.filter(w => w.status === 'Active').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently active warranties
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Expiring Soon</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-orange-600">
                    {filteredWarranties.filter(w => w.status === 'Expiring Soon').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Within next 6 months
                  </p>
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
                <CardTitle>Warranty Registrations</CardTitle>
                <CardDescription>
                  Complete list of all registered product warranties with customer information
                </CardDescription>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWarranties.length > 0 ? (
                        filteredWarranties.map((warranty) => (
                          <TableRow key={warranty.id}>
                            <TableCell className="font-medium">
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
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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

