'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { hasPermission } from '@/lib/permissions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calendar,
  Eye,
  ExternalLink,
  Link2,
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { format } from 'date-fns'

// Mock data
const mockSales = [
  {
    id: 'sale_1',
    date: new Date('2024-02-20'),
    customerName: 'James Smith',
    customerId: 'cust_001',
    invoiceNumber: 'INV-2024-001',
    amount: 4871.25,
    status: 'PAID',
    paymentMethod: 'Credit Card',
  },
  {
    id: 'sale_2',
    date: new Date('2024-02-19'),
    customerName: 'Molly Thomson',
    customerId: 'cust_002',
    invoiceNumber: 'INV-2024-002',
    amount: 13531.25,
    status: 'PAID',
    paymentMethod: 'ACH',
  },
  {
    id: 'sale_3',
    date: new Date('2024-02-18'),
    customerName: 'Robert Wilson',
    customerId: 'cust_003',
    invoiceNumber: 'INV-2024-003',
    amount: 3464.00,
    status: 'PARTIALLY_PAID',
    paymentMethod: 'Check',
  },
  {
    id: 'sale_4',
    date: new Date('2024-02-17'),
    customerName: 'Emily Brown',
    customerId: 'cust_004',
    invoiceNumber: 'INV-2024-004',
    amount: 9634.25,
    status: 'PAID',
    paymentMethod: 'Credit Card',
  },
]

const mockOutstandingBalances = [
  {
    customerId: 'cust_001',
    customerName: 'James Smith',
    sideMark: 'SH-R12345',
    totalOutstanding: 2871.25,
    invoices: [
      { invoiceNumber: 'INV-2024-001', amount: 2000.00, dueDate: new Date('2024-02-15'), daysOverdue: 5 },
      { invoiceNumber: 'INV-2024-005', amount: 871.25, dueDate: new Date('2024-02-25'), daysOverdue: 0 },
    ],
  },
  {
    customerId: 'cust_003',
    customerName: 'Robert Wilson',
    sideMark: 'SH-C23456',
    totalOutstanding: 3464.00,
    invoices: [
      { invoiceNumber: 'INV-2024-003', amount: 3464.00, dueDate: new Date('2024-01-10'), daysOverdue: 41 },
    ],
  },
  {
    customerId: 'cust_005',
    customerName: 'John Doe',
    sideMark: 'SH-R34567',
    totalOutstanding: 5234.50,
    invoices: [
      { invoiceNumber: 'INV-2024-006', amount: 5234.50, dueDate: new Date('2024-02-28'), daysOverdue: 0 },
    ],
  },
]

const expenseCategories = [
  'Materials',
  'Labor',
  'Marketing',
  'Office Supplies',
  'Utilities',
  'Rent',
  'Insurance',
  'Other',
]

const paymentMethods = [
  'Credit Card',
  'ACH',
  'Check',
  'Cash',
  'Other',
]

export default function AccountingPage() {
  const { user, token } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<any[]>([])
  const [expensesLoading, setExpensesLoading] = useState(true)
  const [expensesError, setExpensesError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sales, setSales] = useState(mockSales)
  const [outstandingBalances] = useState(mockOutstandingBalances)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [qbLoading, setQbLoading] = useState(false)
  const [qbConnecting, setQbConnecting] = useState(false)
  const [qbStatus, setQbStatus] = useState<{
    connected: boolean
    configured: boolean
    baseUrl: string
    companyId: string
    minorVersion: string
    missing: { companyId: boolean; accessToken: boolean }
  } | null>(null)
  
  useEffect(() => {
    if (user && !hasPermission(user, 'view_accounting')) {
      router.push('/dashboard')
    }
  }, [user, router])

  if (!user || !hasPermission(user, 'view_accounting')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    )
  }
  
  const [expenseForm, setExpenseForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    description: '',
    amount: '',
    vendor: '',
    paymentMethod: '',
  })

  const [salesFilters, setSalesFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  })

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    if (!token) {
      setExpensesLoading(false)
      return
    }
    try {
      setExpensesLoading(true)
      setExpensesError(null)
      const res = await fetch('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load expenses')
      }
      const data = await res.json()
      // Convert date strings to Date objects
      const expensesWithDates = (data.expenses || []).map((expense: any) => ({
        ...expense,
        id: expense._id || expense.id,
        date: expense.date ? new Date(expense.date) : new Date(),
      }))
      setExpenses(expensesWithDates)
    } catch (e) {
      setExpensesError(e instanceof Error ? e.message : 'Failed to load expenses')
      setExpenses([])
    } finally {
      setExpensesLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const fetchQuickBooksStatus = useCallback(async () => {
    if (!token) return
    try {
      setQbLoading(true)
      const res = await fetch('/api/accounting/quickbooks/status', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to fetch QuickBooks status')
      }
      const data = await res.json()
      setQbStatus(data.status || null)
    } catch (e) {
      toast({
        title: 'QuickBooks',
        description: e instanceof Error ? e.message : 'Failed to fetch QuickBooks status',
        variant: 'destructive',
      })
      setQbStatus(null)
    } finally {
      setQbLoading(false)
    }
  }, [token, toast])

  const handleQuickBooksSync = async () => {
    if (!token) return
    try {
      setQbConnecting(true)
      const res = await fetch('/api/accounting/quickbooks/account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'QuickBooks account sync failed')
      }
      toast({
        title: 'QuickBooks',
        description: 'QuickBooks test account synced successfully.',
        variant: 'success',
      })
      fetchQuickBooksStatus()
    } catch (e) {
      toast({
        title: 'QuickBooks',
        description: e instanceof Error ? e.message : 'QuickBooks account sync failed',
        variant: 'destructive',
      })
    } finally {
      setQbConnecting(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'integrations') {
      fetchQuickBooksStatus()
    }
  }, [activeTab, fetchQuickBooksStatus])

  // Calculate totals
  const totals = useMemo(() => {
    const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0)
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const totalOutstanding = outstandingBalances.reduce((sum, bal) => sum + bal.totalOutstanding, 0)
    const netProfit = totalSales - totalExpenses

    return {
      totalSales,
      totalExpenses,
      netProfit,
      totalOutstanding,
    }
  }, [sales, expenses, outstandingBalances])

  // Filter sales
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = !salesFilters.search ||
        sale.customerName.toLowerCase().includes(salesFilters.search.toLowerCase()) ||
        sale.invoiceNumber.toLowerCase().includes(salesFilters.search.toLowerCase())
      const matchesStatus = salesFilters.status === 'all' || sale.status === salesFilters.status
      const matchesDateFrom = !salesFilters.dateFrom || new Date(sale.date) >= new Date(salesFilters.dateFrom)
      const matchesDateTo = !salesFilters.dateTo || new Date(sale.date) <= new Date(salesFilters.dateTo)
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo
    })
  }, [sales, salesFilters])

  const handleAddExpense = async () => {
    if (!expenseForm.category || !expenseForm.amount || !expenseForm.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    if (!token) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: expenseForm.date,
          category: expenseForm.category,
          description: expenseForm.description,
          amount: parseFloat(expenseForm.amount),
          vendor: expenseForm.vendor || undefined,
          paymentMethod: expenseForm.paymentMethod || 'Credit Card',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create expense')
      }

      toast({
        title: 'Success',
        description: 'Expense added successfully',
        variant: 'success',
      })

      setExpenseForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        category: '',
        description: '',
        amount: '',
        vendor: '',
        paymentMethod: '',
      })
      setExpenseDialogOpen(false)
      fetchExpenses()
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to create expense',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Accounting</h2>
          <p className="text-sm text-muted-foreground">
            Manage expenses, track sales, and view outstanding balances
          </p>
        </div>
        <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
              <DialogDescription>
                Record a new business expense
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Enter expense description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={expenseForm.paymentMethod} onValueChange={(v) => setExpenseForm({ ...expenseForm, paymentMethod: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Vendor</Label>
                <Input
                  value={expenseForm.vendor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                  placeholder="Vendor name (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExpenseDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleAddExpense} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Expense'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding Balances</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-l-4" style={{ borderLeftColor: '#16A34A' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Sales
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totals.totalSales)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4" style={{ borderLeftColor: '#DC2626' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totals.totalExpenses)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4" style={{ borderLeftColor: '#D97706' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Net Profit
                </CardTitle>
                <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totals.netProfit)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Outstanding
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totals.totalOutstanding)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sales.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{sale.customerName}</p>
                        <p className="text-xs text-muted-foreground">{sale.invoiceNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(sale.amount)}</p>
                        <p className="text-xs text-muted-foreground">{format(sale.date, 'MMM dd')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between border-b dark:border-gray-700 pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">{expense.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(expense.amount)}</p>
                        <p className="text-xs text-muted-foreground">{format(expense.date, 'MMM dd')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Sales</CardTitle>
              <CardDescription>
                View and filter all sales transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search sales..."
                    value={salesFilters.search}
                    onChange={(e) => setSalesFilters({ ...salesFilters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <Select value={salesFilters.status} onValueChange={(v) => setSalesFilters({ ...salesFilters, status: v })}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  placeholder="From"
                  value={salesFilters.dateFrom}
                  onChange={(e) => setSalesFilters({ ...salesFilters, dateFrom: e.target.value })}
                  className="w-40"
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={salesFilters.dateTo}
                  onChange={(e) => setSalesFilters({ ...salesFilters, dateTo: e.target.value })}
                  className="w-40"
                />
              </div>

              {/* Sales Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="text-muted-foreground">
                          {format(sale.date, 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Link href={`/customers/${sale.customerId}`} className="hover:underline">
                            {sale.customerName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/invoices/${sale.invoiceNumber}`} className="hover:underline">
                            {sale.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(sale.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-0">
                            {sale.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{sale.paymentMethod}</TableCell>
                        <TableCell>
                          <Link href={`/invoices/${sale.invoiceNumber}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
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
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>
                Track all business expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : expensesError ? (
                <div className="text-center py-12">
                  <p className="text-red-600 dark:text-red-400">{expensesError}</p>
                  <Button
                    variant="outline"
                    onClick={fetchExpenses}
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No expenses found</p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id || expense._id}>
                          <TableCell className="text-muted-foreground">
                            {format(expense.date, 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-0">
                              {expense.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>{expense.vendor || '-'}</TableCell>
                          <TableCell>{expense.paymentMethod}</TableCell>
                          <TableCell className="text-right font-medium text-red-600 dark:text-red-400">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outstanding Balances Tab */}
        <TabsContent value="outstanding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Balances</CardTitle>
              <CardDescription>
                View customers with outstanding invoice balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Side Mark</TableHead>
                      <TableHead>Total Outstanding</TableHead>
                      <TableHead>Invoices</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outstandingBalances.map((balance) => (
                      <TableRow key={balance.customerId}>
                        <TableCell>
                          <Link href={`/customers/${balance.customerId}`} className="font-medium hover:underline">
                            {balance.customerName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {balance.sideMark}
                        </TableCell>
                        <TableCell className="font-medium text-orange-600">
                          {formatCurrency(balance.totalOutstanding)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {balance.invoices.map((inv, idx) => (
                              <div key={idx} className="text-sm">
                                <Link href={`/invoices/${inv.invoiceNumber}`} className="hover:underline">
                                  {inv.invoiceNumber}
                                </Link>
                                {' '}
                                <span className="text-muted-foreground">
                                  ({formatCurrency(inv.amount)})
                                  {inv.daysOverdue > 0 && (
                                    <Badge variant="outline" className="ml-2 bg-red-500/10 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-0">
                                      {inv.daysOverdue} days overdue
                                    </Badge>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/customers/${balance.customerId}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
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
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QuickBooks Online Integration</CardTitle>
              <CardDescription>
                Connect your QuickBooks Online account to sync accounting data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Link2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">QuickBooks Online</p>
                    <p className="text-sm text-muted-foreground">
                      Sync expenses, sales, and invoices with QuickBooks
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      qbStatus?.connected
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                    )}
                  >
                    {qbLoading ? 'Checking...' : qbStatus?.connected ? 'Connected' : 'Not Connected'}
                  </Badge>
                  <Button variant="outline" onClick={handleQuickBooksSync} disabled={qbConnecting || qbLoading}>
                    {qbConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      'Sync Test Account'
                    )}
                  </Button>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> QuickBooks Online requests are sent from server-side accounting APIs.
                </p>
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  <p>Base URL: {qbStatus?.baseUrl || 'N/A'}</p>
                  <p>Company ID: {qbStatus?.companyId || 'N/A'}</p>
                  <p>Minor Version: {qbStatus?.minorVersion || '75'}</p>
                  {qbStatus?.missing?.companyId && <p className="text-amber-600 dark:text-amber-400">Missing QUICKBOOKS_COMPANY_ID</p>}
                  {qbStatus?.missing?.accessToken && <p className="text-amber-600 dark:text-amber-400">Missing QUICKBOOKS_ACCESS_TOKEN</p>}
                </div>
                <ul className="text-sm text-muted-foreground mt-3 list-disc list-inside space-y-1">
                  <li>Sync test account payload to QuickBooks</li>
                  <li>Sync sales and invoice data</li>
                  <li>Reconcile accounts</li>
                  <li>Generate financial reports</li>
                </ul>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={fetchQuickBooksStatus} disabled={qbLoading}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

