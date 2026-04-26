'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { ShoppingCart, FileText, Receipt, CreditCard, TrendingUp, DollarSign, Eye, ArrowRight, Package } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { LineChart } from '@/components/dashboard/LineChart'
import { VerticalBarChart } from '@/components/dashboard/VerticalBarChart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Mock data
const mockOrders = [
  { id: 'ORD-1001', number: 'ORD-1001', status: 'PENDING', total: 8200, date: new Date('2025-01-20'), items: 5 },
  { id: 'ORD-1002', number: 'ORD-1002', status: 'PROCESSING', total: 12400, date: new Date('2025-01-15'), items: 8 },
  { id: 'ORD-1003', number: 'ORD-1003', status: 'COMPLETED', total: 5600, date: new Date('2025-01-10'), items: 3 },
  { id: 'ORD-1004', number: 'ORD-1004', status: 'PENDING', total: 9800, date: new Date('2025-01-25'), items: 6 },
  { id: 'ORD-1005', number: 'ORD-1005', status: 'PROCESSING', total: 15200, date: new Date('2025-01-18'), items: 10 },
]

const mockInvoices = [
  { id: 'INV-2001', number: 'INV-2001', status: 'UNPAID', total: 8200, paid: 0, due: 8200, dueDate: new Date('2025-02-10'), createdAt: new Date('2025-01-20') },
  { id: 'INV-2002', number: 'INV-2002', status: 'PARTIALLY_PAID', total: 12400, paid: 6000, due: 6400, dueDate: new Date('2025-02-15'), createdAt: new Date('2025-01-15') },
  { id: 'INV-2003', number: 'INV-2003', status: 'PAID', total: 5600, paid: 5600, due: 0, dueDate: new Date('2025-01-15'), createdAt: new Date('2025-01-10') },
  { id: 'INV-2004', number: 'INV-2004', status: 'UNPAID', total: 9800, paid: 0, due: 9800, dueDate: new Date('2025-02-20'), createdAt: new Date('2025-01-25') },
]

const mockPayments = [
  { id: 'PAY-3001', number: 'PAY-3001', amount: 6000, date: new Date('2025-01-20'), method: 'Credit Card', invoice: 'INV-2002' },
  { id: 'PAY-3002', number: 'PAY-3002', amount: 5600, date: new Date('2025-01-10'), method: 'ACH', invoice: 'INV-2003' },
  { id: 'PAY-3003', number: 'PAY-3003', amount: 2000, date: new Date('2025-01-25'), method: 'Credit Card', invoice: 'INV-2002' },
]

// Mock data for graphs
const orderGraphData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  thisYear: [5, 8, 12, 10, 15, 18, 22],
  lastYear: [3, 6, 9, 11, 13, 16, 20],
}

const bestSellingProducts = [
  { label: 'Roller Shades', value: 45 },
  { label: 'Roman Shades', value: 32 },
  { label: 'Duo Shades', value: 28 },
  { label: 'Plantation Shutters', value: 22 },
  { label: 'Patio Screens', value: 18 },
  { label: 'Motorized Shades', value: 15 },
]

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  PROCESSING: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  COMPLETED: 'bg-green-500/10 text-green-700 dark:text-green-400',
  CANCELLED: 'bg-red-500/10 text-red-700 dark:text-red-400',
  UNPAID: 'bg-red-500/10 text-red-700 dark:text-red-400',
  PARTIALLY_PAID: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  PAID: 'bg-green-500/10 text-green-700 dark:text-green-400',
}

export default function DealerDashboardPage() {
  const { user } = useAuthStore()

  const totalOrders = mockOrders.length
  const pendingOrders = mockOrders.filter(o => o.status === 'PENDING').length
  const processingOrders = mockOrders.filter(o => o.status === 'PROCESSING').length
  const totalInvoices = mockInvoices.length
  const totalDue = mockInvoices.reduce((sum, inv) => sum + (inv.due || 0), 0)
  const totalSpent = mockPayments.reduce((sum, pay) => sum + pay.amount, 0)
  const totalOrderValue = mockOrders.reduce((sum, order) => sum + order.total, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome, {user?.firstName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Manage your orders, invoices, and payments
          </p>
        </div>
        <Link href="/dealer/orders/new">
          <Button className="shadow-md hover:shadow-lg transition-shadow">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Place New Order
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="rounded-xl p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-sm"
          style={{ borderLeftWidth: 4, borderLeftColor: '#92400E' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">Total Orders</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-gray-900 dark:text-white">{totalOrders}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {pendingOrders} pending, {processingOrders} processing
          </p>
        </div>

        <div
          className="rounded-xl p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-sm"
          style={{ borderLeftWidth: 4, borderLeftColor: '#D97706' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">Order Value</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-gray-900 dark:text-white">{formatCurrency(totalOrderValue)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Total order value
          </p>
        </div>

        <div
          className="rounded-xl p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-sm"
          style={{ borderLeftWidth: 4, borderLeftColor: '#16A34A' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">Total Paid</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-gray-900 dark:text-white">{formatCurrency(totalSpent)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {mockPayments.length} successful payments
          </p>
        </div>

        <div
          className="rounded-xl p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-sm"
          style={{ borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">Outstanding</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-gray-900 dark:text-white">{formatCurrency(totalDue)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {mockInvoices.filter(inv => inv.due > 0).length} unpaid invoices
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders Over Time Chart */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Orders Over Time</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Track your order trends</p>
          </CardHeader>
          <CardContent>
            <LineChart title="Orders" tabs={['This Year', 'Last Year']} />
          </CardContent>
        </Card>

        {/* Best Selling Products Chart */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Best Selling Products</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Top products by order volume</p>
          </CardHeader>
          <CardContent>
            <VerticalBarChart title="Products" data={bestSellingProducts} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Track your order status</p>
          </div>
          <Link href="/dealer/orders">
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              View all
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-gray-800">
                  <TableHead className="h-10">Order #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockOrders.slice(0, 5).map((order) => (
                  <TableRow key={order.id} className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <TableCell className="font-semibold text-gray-900 dark:text-white">
                      {order.number}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${statusColors[order.status]} border-0`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {order.items} items
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(order.date, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dealer/orders/${order.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invoices and Payments */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Invoices */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Recent Invoices</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Your billing statements</p>
            </div>
            <Link href="/dealer/invoices">
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                View all
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-800">
                    <TableHead className="h-10">Invoice #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.slice(0, 5).map((invoice) => (
                    <TableRow key={invoice.id} className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">
                        {invoice.number}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusColors[invoice.status]} border-0`}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell className={invoice.due > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-muted-foreground'}>
                        {formatCurrency(invoice.due)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dealer/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Recent Payments</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Payment history</p>
            </div>
            <Link href="/dealer/payments">
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                View all
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-800">
                    <TableHead className="h-10">Payment #</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPayments.slice(0, 5).map((payment) => (
                    <TableRow key={payment.id} className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">
                        {payment.number}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {payment.method}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(payment.date, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {payment.invoice}
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
  )
}

