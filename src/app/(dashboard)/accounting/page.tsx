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
  Receipt,
  Users,
  FileText,
  Car,
  Briefcase,
  ClipboardList,
  ChevronRight,
  UserCheck,
  Wrench,
  Mail,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle2,
  Landmark,
  BookOpen,
  RefreshCw,
  ListOrdered,
  BarChart3,
  Building2,
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
  const [vendors, setVendors] = useState<{ id: string; name: string; email: string; phone: string }[]>([])
  const [addVendorOpen, setAddVendorOpen] = useState(false)
  const [newVendorForm, setNewVendorForm] = useState({ name: '', email: '', phone: '', address: '' })
  const [savingVendor, setSavingVendor] = useState(false)
  const [sales] = useState(mockSales)
  const [outstandingBalances] = useState(mockOutstandingBalances)
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [stView, setStView] = useState<'overview' | 'returns' | 'categories' | 'settings'>('overview')

  // Banking / Plaid state
  const [bankConnected, setBankConnected] = useState(false)
  const [bankAccounts] = useState<{id:string;name:string;type:string;balance:number;lastSync:string}[]>([])
  const [bankTxSearch, setBankTxSearch] = useState('')

  // Rules state
  const [rulesView, setRulesView] = useState<'bank' | 'integration'>('bank')
  const [rulesSearch, setRulesSearch] = useState('')
  const [showRulesDropdown, setShowRulesDropdown] = useState(false)
  const mockRules = [
    { id:1, priority:1, name:'(Suggested) DHL as Offic...', appliedTo:'210 AMEX PLATINUM 5200', conditions:'Description contains "DHL"', settings:'Set Category to "594 Office expenses:Shipping & post..."', autoAdd:false, status:'Disabled' },
    { id:2, priority:2, name:'(Suggested) AT&T Wireles...', appliedTo:'210 AMEX PLATINUM 5200', conditions:'Description contains "AT&T Wireless"', settings:'Set Category to "538.5 Utilities:Phone service", Set Pa...', autoAdd:false, status:'Disabled' },
    { id:3, priority:3, name:'(Suggested) Annual Mem...', appliedTo:'210 AMEX PLATINUM 5200', conditions:'Description contains "Annual Membership Fee"', settings:'Set Category to "568 General business expenses:Mem..."', autoAdd:false, status:'Disabled' },
    { id:4, priority:4, name:'(Suggested) Fiverr as Co...', appliedTo:'210 AMEX PLATINUM 5200', conditions:'Description contains "Fiverr"', settings:'Set Category to "544 Contract labor", Set Payee to "Fi..."', autoAdd:false, status:'Disabled' },
    { id:5, priority:5, name:'(Suggested) Dollar Tree a...', appliedTo:'210 AMEX PLATINUM 5200', conditions:'Description contains "Dollar Tree"', settings:'Set Category to "518 Office expenses:Office supplies",...', autoAdd:false, status:'Disabled' },
    { id:6, priority:6, name:'(Suggested) Home Depot...', appliedTo:'210 AMEX PLATINUM 5200', conditions:'Description contains "Home Depot"', settings:'Set Category to "515 Repairs & maintenance", Set Pay...', autoAdd:false, status:'Disabled' },
  ]

  // Chart of accounts state
  const mockAccounts = [
    { number:'1000', name:'Checking Account', type:'Bank', subtype:'Checking', balance: 12450.00, action:'View register' },
    { number:'1010', name:'Savings Account', type:'Bank', subtype:'Savings', balance: 8320.50, action:'View register' },
    { number:'2000', name:'Accounts Payable', type:'Accounts Payable', subtype:'', balance: -3200.00, action:'View register' },
    { number:'3000', name:'Retained Earnings', type:'Equity', subtype:'Retained Earnings', balance: 45600.00, action:'View register' },
    { number:'4000', name:'Sales', type:'Income', subtype:'Service/Fee Income', balance: 98430.00, action:'View register' },
    { number:'5000', name:'Cost of Goods Sold', type:'Cost of Goods Sold', subtype:'', balance: 23100.00, action:'View register' },
    { number:'6000', name:'Office Expenses', type:'Expense', subtype:'Office/General Admin Expenses', balance: 4200.00, action:'View register' },
    { number:'6100', name:'Utilities', type:'Expense', subtype:'Utilities', balance: 1840.00, action:'View register' },
    { number:'6200', name:'Insurance', type:'Expense', subtype:'Insurance', balance: 2400.00, action:'View register' },
  ]

  // Recurring transactions
  const mockRecurring = [
    { id:1, template:'Monthly Rent', type:'Expense', customer:'—', interval:'Monthly', nextDate:'2026-05-01', amount:3500, status:'Active' },
    { id:2, template:'Office Supplies', type:'Expense', customer:'—', interval:'Monthly', nextDate:'2026-05-15', amount:150, status:'Active' },
    { id:3, template:'Insurance Premium', type:'Expense', customer:'—', interval:'Quarterly', nextDate:'2026-07-01', amount:2400, status:'Paused' },
  ]

  // Fixed assets
  const mockAssets = [
    { name:'Delivery Van', date:'2023-01-15', cost:32000, depreciation:'Straight-line 5yr', accum:6400, bookValue:25600, status:'Active' },
    { name:'Cutting Machine', date:'2022-06-01', cost:15000, depreciation:'Straight-line 7yr', accum:3000, bookValue:12000, status:'Active' },
    { name:'Company Laptop ×3', date:'2024-03-10', cost:4500, depreciation:'Straight-line 3yr', accum:500, bookValue:4000, status:'Active' },
  ]
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

  // New transaction dialogs
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)
  const [deposit, setDeposit] = useState({ date: format(new Date(), 'yyyy-MM-dd'), depositTo: '', memo: '' })
  const [depositLines, setDepositLines] = useState([
    { name: '', account: '', memo: '', payment: '' },
    { name: '', account: '', memo: '', payment: '' },
  ])
  const [transferOpen, setTransferOpen] = useState(false)
  const [transfer, setTransfer] = useState({ from: '', to: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), memo: '' })
  const [journalOpen, setJournalOpen] = useState(false)
  const [journal, setJournal] = useState({ date: format(new Date(), 'yyyy-MM-dd'), journalNo: '' })
  const [journalLines, setJournalLines] = useState(
    Array.from({ length: 8 }, () => ({ account: '', debits: '', credits: '', description: '', name: '', location: '' }))
  )
  const [invAdjOpen, setInvAdjOpen] = useState(false)
  const [invAdj, setInvAdj] = useState({ date: format(new Date(), 'yyyy-MM-dd'), refNo: '1', location: '', reason: 'Damaged Goods', account: '509 Inventory Shrinkage', memo: '' })
  const [invAdjLines, setInvAdjLines] = useState([
    { product: '', sku: '', description: '', qtyOnHand: '', newQty: '', changeInQty: '' },
    { product: '', sku: '', description: '', qtyOnHand: '', newQty: '', changeInQty: '' },
  ])
  
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
    payee: '',
    customerId: '',
    paymentAccount: '',
    refNo: '',
    poNumber: '',
    sideMark: '',
    paymentMethod: '',
  })

  // Customer list for Payee dropdown
  const [payeeCustomers, setPayeeCustomers] = useState<{ id: string; name: string; sideMark: string }[]>([])
  useEffect(() => {
    if (!token) return
    fetch('/api/customers?limit=500', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { customers: [] })
      .then(data => {
        const list = (data.customers || []).map((c: any) => ({
          id: c._id || c.id,
          name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.companyName || c.email || 'Unknown',
          sideMark: c.sideMark || '',
        }))
        setPayeeCustomers(list)
      })
  }, [token])

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

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  useEffect(() => {
    if (!token) return
    fetch('/api/vendors', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { vendors: [] })
      .then(d => setVendors(d.vendors || []))
      .catch(() => {})
  }, [token])

  const handleAddVendor = async () => {
    if (!newVendorForm.name.trim()) return
    setSavingVendor(true)
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newVendorForm),
      })
      if (res.ok) {
        const d = await res.json()
        const v = d.vendor
        setVendors(prev => [...prev, { id: v.id, name: v.name, email: v.email || '', phone: v.phone || '' }])
        setExpenseForm(f => ({ ...f, payee: v.name }))
        setNewVendorForm({ name: '', email: '', phone: '', address: '' })
        setAddVendorOpen(false)
        toast({ title: 'Vendor added', description: v.name })
      }
    } catch { toast({ title: 'Error', description: 'Failed to add vendor', variant: 'destructive' }) }
    finally { setSavingVendor(false) }
  }

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
          payee: expenseForm.payee || undefined,
          customerId: expenseForm.customerId || undefined,
          paymentAccount: expenseForm.paymentAccount || undefined,
          refNo: expenseForm.refNo || undefined,
          poNumber: expenseForm.poNumber || undefined,
          sideMark: expenseForm.sideMark || undefined,
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
        payee: '',
        customerId: '',
        paymentAccount: '',
        refNo: '',
        poNumber: '',
        sideMark: '',
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
        {/* New transaction dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button onClick={() => setShowNewMenu(v => !v)}>
              <Plus className="mr-2 h-4 w-4" />
              New
              <ChevronRight className="ml-2 h-4 w-4 rotate-90" />
            </Button>
            {showNewMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50 py-1">
                {[
                  { label: 'Add Expense',                action: () => { setExpenseDialogOpen(true); setShowNewMenu(false) } },
                  { label: 'Bank Deposit',               action: () => { setDepositOpen(true);     setShowNewMenu(false) } },
                  { label: 'Transfer',                   action: () => { setTransferOpen(true);    setShowNewMenu(false) } },
                  { label: 'Journal Entry',              action: () => { setJournalOpen(true);     setShowNewMenu(false) } },
                  { label: 'Inventory QTY Adjustment',   action: () => { setInvAdjOpen(true);      setShowNewMenu(false) } },
                ].map(({ label, action }) => (
                  <button key={label} onClick={action}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
          <DialogTrigger asChild className="hidden" />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
              <DialogDescription>Record a new business expense</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-1">

              {/* Row 1: Date + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category <span className="text-red-500">*</span></Label>
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

              {/* Row 2: Payee + Payment Account */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Vendor / Payee</Label>
                    <button
                      type="button"
                      onClick={() => setAddVendorOpen(true)}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      + Add new vendor
                    </button>
                  </div>
                  <Select
                    value={expenseForm.payee || '__none__'}
                    onValueChange={(v) => {
                      if (v === '__none__') {
                        setExpenseForm({ ...expenseForm, payee: '', customerId: '' })
                      } else if (v === '__custom__') {
                        setExpenseForm({ ...expenseForm, payee: '', customerId: '' })
                      } else {
                        setExpenseForm({ ...expenseForm, payee: v, customerId: '' })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {vendors.length > 0 && vendors.map(v => (
                        <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                      ))}
                      {payeeCustomers.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Customers</div>
                          {payeeCustomers.map(c => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {expenseForm.payee === '' && (
                    <Input
                      value={expenseForm.payee}
                      onChange={(e) => setExpenseForm({ ...expenseForm, payee: e.target.value })}
                      placeholder="Or type payee name manually"
                      className="mt-1.5"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Account</Label>
                  <Select value={expenseForm.paymentAccount} onValueChange={(v) => setExpenseForm({ ...expenseForm, paymentAccount: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Checking Account">Checking Account</SelectItem>
                      <SelectItem value="Savings Account">Savings Account</SelectItem>
                      <SelectItem value="Credit Card - Visa">Credit Card – Visa</SelectItem>
                      <SelectItem value="Credit Card - Amex">Credit Card – Amex</SelectItem>
                      <SelectItem value="Credit Card - Mastercard">Credit Card – Mastercard</SelectItem>
                      <SelectItem value="PayPal">PayPal</SelectItem>
                      <SelectItem value="Petty Cash">Petty Cash</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Side Mark — auto-filled, editable */}
              <div className="space-y-1.5">
                <Label>Side Mark</Label>
                <Input
                  value={expenseForm.sideMark}
                  onChange={(e) => setExpenseForm({ ...expenseForm, sideMark: e.target.value })}
                  placeholder="Auto-filled from customer, or enter manually"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label>Description <span className="text-red-500">*</span></Label>
                <Textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Enter expense description"
                  rows={2}
                />
              </div>

              {/* Row 3: Amount + Payment Method */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Amount <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
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

              {/* Row 4: Ref No. + P.O. Number */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Ref No.</Label>
                  <Input
                    value={expenseForm.refNo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, refNo: e.target.value })}
                    placeholder="Reference number"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>P.O. Number</Label>
                  <Input
                    value={expenseForm.poNumber}
                    onChange={(e) => setExpenseForm({ ...expenseForm, poNumber: e.target.value })}
                    placeholder="Purchase order number"
                  />
                </div>
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

      {/* Nav Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
        {([
          { value: 'overview',          label: 'Overview',          icon: DollarSign },
          { value: 'sales',             label: 'Sales',             icon: TrendingUp },
          { value: 'expenses',          label: 'Expenses',          icon: TrendingDown },
          { value: 'vendors',           label: 'Vendors',           icon: Users },
          { value: 'outstanding',       label: 'Outstanding',       icon: CreditCard },
          { value: 'banking',           label: 'Bank Txns',         icon: Landmark },
          { value: 'receipts',          label: 'Receipts',          icon: Receipt },
          { value: 'reconcile',         label: 'Reconcile',         icon: RefreshCw },
          { value: 'rules',             label: 'Rules',             icon: ListOrdered },
          { value: 'sales-tax',         label: 'Sales Tax',         icon: FileText },
          { value: 'chart-of-accounts', label: 'Chart Accounts',    icon: BookOpen },
          { value: 'recurring',         label: 'Recurring',         icon: Calendar },
          { value: 'fixed-assets',      label: 'Fixed Assets',      icon: BarChart3 },
          { value: 'team',              label: 'Team',              icon: Users },
          { value: 'accountant',        label: 'My Accountant',     icon: UserCheck },
          { value: 'integrations',      label: 'Integrations',      icon: Building2 },
        ] as const).map(({ value, label, icon: Icon }) => (
          <button key={value} onClick={() => setActiveTab(value)}
            className={cn(
              'flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all',
              activeTab === value
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shadow-sm'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            )}>
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-[11px] font-medium leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div>

        {/* Overview Tab */}
        {activeTab === 'overview' && <div className="space-y-6">
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
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{expense.category}</span>
                          {(expense.payee || expense.vendor) && (
                            <span className="text-xs text-muted-foreground">· {expense.payee || expense.vendor}</span>
                          )}
                          {expense.sideMark && (
                            <span className="text-xs font-mono text-amber-600">{expense.sideMark}</span>
                          )}
                        </div>
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
        </div>}

        {/* Sales Tab */}
        {activeTab === 'sales' && <div className="space-y-6">
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
        </div>}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Expenses</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Track all business expenses and vendor payments</p>
            </div>
          </div>

          {/* Overview stat blocks */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total This Month', value: formatCurrency(expenses.reduce((s, e) => s + (e.amount || 0), 0)), icon: DollarSign, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
              { label: 'Transactions', value: String(expenses.length), icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Unique Vendors', value: String(new Set(expenses.map(e => e.payee || e.vendor).filter(Boolean)).size), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Avg. per Expense', value: expenses.length ? formatCurrency(expenses.reduce((s, e) => s + (e.amount || 0), 0) / expenses.length) : '$0.00', icon: TrendingDown, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex items-center gap-3">
                <div className={`rounded-lg p-2.5 ${stat.bg} shrink-0`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Category blocks grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Expense Transactions', desc: 'All recorded expense entries', icon: Receipt, href: '#transactions', color: 'border-amber-200 dark:border-amber-800', iconBg: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600 dark:text-amber-400', count: expenses.length },
              { label: 'Vendors', desc: 'Manage your vendor list', icon: Users, href: '#vendors', color: 'border-blue-200 dark:border-blue-800', iconBg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400', count: new Set(expenses.map(e => e.payee || e.vendor).filter(Boolean)).size },
              { label: 'Bills', desc: 'Unpaid vendor bills', icon: FileText, href: '#bills', color: 'border-gray-200 dark:border-gray-700', iconBg: 'bg-gray-50 dark:bg-gray-800/50', iconColor: 'text-gray-600 dark:text-gray-400', count: 0 },
              { label: 'Bill Payments', desc: 'Payments made on bills', icon: CreditCard, href: '#bill-payments', color: 'border-green-200 dark:border-green-800', iconBg: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600 dark:text-green-400', count: 0 },
              { label: 'Mileage', desc: 'Vehicle & travel expenses', icon: Car, href: '#mileage', color: 'border-indigo-200 dark:border-indigo-800', iconBg: 'bg-indigo-50 dark:bg-indigo-900/20', iconColor: 'text-indigo-600 dark:text-indigo-400', count: expenses.filter(e => e.category === 'Mileage' || e.category === 'Vehicle').length },
              { label: 'Contractors', desc: '1099 contractor payments', icon: Wrench, href: '#contractors', color: 'border-orange-200 dark:border-orange-800', iconBg: 'bg-orange-50 dark:bg-orange-900/20', iconColor: 'text-orange-600 dark:text-orange-400', count: expenses.filter(e => e.category === 'Contractor').length },
              { label: '1099s', desc: 'Tax reporting forms', icon: Briefcase, href: '#1099s', color: 'border-rose-200 dark:border-rose-800', iconBg: 'bg-rose-50 dark:bg-rose-900/20', iconColor: 'text-rose-600 dark:text-rose-400', count: 0 },
            ].map(block => (
              <div key={block.label} className={`rounded-xl border ${block.color} bg-white dark:bg-gray-900 p-4 hover:shadow-md transition-shadow cursor-pointer group`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`rounded-lg p-2 ${block.iconBg}`}>
                    <block.icon className={`h-5 w-5 ${block.iconColor}`} />
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{block.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{block.desc}</p>
                {block.count > 0 && (
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mt-2">{block.count}</p>
                )}
              </div>
            ))}
          </div>

          {/* Expense Transactions table */}
          <div id="transactions" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Expense Transactions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{expenses.length} total entries</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              {expensesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : expensesError ? (
                <div className="text-center py-10">
                  <p className="text-red-600 dark:text-red-400 text-sm">{expensesError}</p>
                  <Button variant="outline" onClick={fetchExpenses} className="mt-3" size="sm">Retry</Button>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-10">
                  <Receipt className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No expenses recorded yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Payee</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs">Side Mark</TableHead>
                      <TableHead className="text-xs">Account</TableHead>
                      <TableHead className="text-xs">Ref No.</TableHead>
                      <TableHead className="text-xs">P.O. #</TableHead>
                      <TableHead className="text-xs">Method</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id || expense._id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap text-sm">{format(expense.date, 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium text-sm">{expense.payee || expense.vendor || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-0 whitespace-nowrap text-xs">
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm">{expense.description}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{expense.sideMark || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">{expense.paymentAccount || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{expense.refNo || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{expense.poNumber || '—'}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{expense.paymentMethod}</TableCell>
                        <TableCell className="text-right font-semibold text-red-600 dark:text-red-400 whitespace-nowrap text-sm">{formatCurrency(expense.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>}

        {/* Vendors Tab */}
        {activeTab === 'vendors' && <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Vendors</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Manage suppliers and payees used in expenses</p>
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5" onClick={() => setAddVendorOpen(true)}>
              <Plus className="h-4 w-4" />Add Vendor
            </Button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Vendors</p>
              <p className="text-2xl font-bold mt-1">{vendors.length}</p>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Paid (YTD)</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(expenses.filter(e => vendors.some(v => v.name === (e.payee || e.vendor))).reduce((s, e) => s + e.amount, 0))}</p>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Expenses</p>
              <p className="text-2xl font-bold mt-1">{expenses.filter(e => vendors.some(v => v.name === (e.payee || e.vendor))).length}</p>
            </CardContent></Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Total Expenses</TableHead>
                    <TableHead className="text-right"># Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        No vendors yet — add one above
                      </TableCell>
                    </TableRow>
                  ) : vendors.map(v => {
                    const vExpenses = expenses.filter(e => (e.payee || e.vendor) === v.name)
                    const total = vExpenses.reduce((s, e) => s + e.amount, 0)
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {v.email ? <a href={`mailto:${v.email}`} className="hover:text-foreground">{v.email}</a> : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{v.phone || '—'}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">{formatCurrency(total)}</TableCell>
                        <TableCell className="text-right">{vExpenses.length}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>}

        {/* Outstanding Balances Tab */}
        {activeTab === 'outstanding' && <div className="space-y-6">
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
        </div>}

        {/* Team Tab */}
        {activeTab === 'team' && <div className="space-y-6">
          {/* Employees Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-500" />
                    Employees
                  </CardTitle>
                  <CardDescription>Manage your W-2 employees and their information</CardDescription>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b dark:border-gray-700">
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hire Date</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                          <p className="text-sm">No employees added yet</p>
                          <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add your first employee
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Contractors Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-amber-500" />
                    Contractors
                  </CardTitle>
                  <CardDescription>Manage 1099 contractors and their payment details</CardDescription>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contractor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b dark:border-gray-700">
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Specialty</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rate</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">1099 Required</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                          <Briefcase className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                          <p className="text-sm">No contractors added yet</p>
                          <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add your first contractor
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>}

        {/* Sales Tax Tab */}
        {activeTab === 'sales-tax' && <div className="space-y-6">
          <div className="space-y-6">
                <div className="flex items-center gap-1 border-b dark:border-gray-700">
                  {(['overview', 'returns', 'categories', 'settings'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setStView(v)}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                        stView === v
                          ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                          : 'border-transparent text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {v === 'overview' ? 'Overview' : v === 'returns' ? 'Sales Tax Returns' : v === 'categories' ? 'Sales Tax Categories' : 'Sales Tax Settings'}
                    </button>
                  ))}
                </div>

                {stView === 'overview' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Sales Tax at a glance</h3>
                    {/* Row 1 — 3 main cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Sales Tax Due */}
                      <Card className="border dark:border-gray-700">
                        <CardContent className="p-5 flex flex-col justify-between min-h-[160px]">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sales Tax Due</p>
                            <span className="text-[11px] text-muted-foreground">As of today</span>
                          </div>
                          <div className="text-center py-4">
                            <p className="text-xs text-muted-foreground mb-1">Payment due</p>
                            <p className="text-3xl font-light text-gray-500 dark:text-gray-400">$0</p>
                          </div>
                          <button className="text-xs text-amber-600 dark:text-amber-400 hover:underline text-left">View due returns</button>
                        </CardContent>
                      </Card>

                      {/* Unpaid Sales Tax Returns */}
                      <Card className="border dark:border-gray-700">
                        <CardContent className="p-5 flex flex-col justify-between min-h-[160px]">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Unpaid Sales Tax Returns</p>
                            <span className="text-[11px] text-muted-foreground">As of today</span>
                          </div>
                          <div className="flex items-center justify-between py-3 border rounded-lg px-3 bg-amber-50 dark:bg-amber-900/20">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              <div>
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Overdue</p>
                                <p className="text-[11px] text-muted-foreground">0 returns</p>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">$0.00</p>
                          </div>
                          <button className="text-xs text-amber-600 dark:text-amber-400 hover:underline text-left">View all sales tax returns</button>
                        </CardContent>
                      </Card>

                      {/* Sales Tax Accruing */}
                      <Card className="border dark:border-gray-700">
                        <CardContent className="p-5 flex flex-col justify-between min-h-[160px]">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sales Tax Accruing</p>
                            <span className="text-[11px] text-muted-foreground">As of today</span>
                          </div>
                          <div className="text-center py-4">
                            <p className="text-xs text-muted-foreground mb-1">Sales tax from open periods</p>
                            <p className="text-3xl font-light text-gray-500 dark:text-gray-400">$0.00</p>
                          </div>
                          <button className="text-xs text-amber-600 dark:text-amber-400 hover:underline text-left">View open periods</button>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Row 2 — Economic Nexus + Sales Tax Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Economic Nexus */}
                      <Card className="border dark:border-gray-700">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Economic Nexus</p>
                            <span className="text-[11px] text-muted-foreground">As of today</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-4">You must register with a state when you meet their sales tax threshold.</p>
                          <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                              </div>
                              <span className="text-sm">Registered</span>
                            </div>
                            <span className="text-sm font-semibold">0</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <span className="text-xs text-muted-foreground">Tax agencies setup</span>
                            <button className="text-xs text-amber-600 dark:text-amber-400 hover:underline">Manage</button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Sales Tax Categories */}
                      <Card className="border dark:border-gray-700">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Sales Tax Categories</p>
                            <span className="text-[11px] text-muted-foreground">As of today</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">Total uncategorized products/services</p>
                          <p className="text-2xl font-semibold mb-4">0</p>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                              Categorized: 0
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
                              Uncategorized: 0
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {stView === 'returns' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sales Tax Returns</CardTitle>
                      <CardDescription>View and manage your sales tax filing history</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b dark:border-gray-700">
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Period</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agency</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due Date</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tax Due</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">
                              No sales tax returns found
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {stView === 'categories' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">Sales Tax Categories</CardTitle>
                          <CardDescription>Assign tax categories to your products and services</CardDescription>
                        </div>
                        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Category
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b dark:border-gray-700">
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category Name</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tax Rate</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Products</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { name: 'Taxable – standard rate', desc: 'Standard taxable goods and services', rate: '8.25%', products: 0 },
                            { name: 'Non-taxable', desc: 'Exempt from sales tax', rate: '0%', products: 0 },
                            { name: 'Out of scope', desc: 'Not subject to sales tax laws', rate: '—', products: 0 },
                          ].map((cat) => (
                            <TableRow key={cat.name}>
                              <TableCell className="font-medium text-sm">{cat.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{cat.desc}</TableCell>
                              <TableCell className="text-sm">{cat.rate}</TableCell>
                              <TableCell className="text-sm">{cat.products}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" className="h-7 text-xs">
                                  <Edit className="mr-1 h-3 w-3" />
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {stView === 'settings' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sales Tax Settings</CardTitle>
                      <CardDescription>Configure your sales tax rates, agencies, and filing preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Default Tax Rate (%)</Label>
                          <Input placeholder="e.g. 8.25" type="number" step="0.01" />
                          <p className="text-xs text-muted-foreground">Applied to all taxable products unless overridden</p>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Tax Agency Name</Label>
                          <Input placeholder="e.g. Texas Comptroller" />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Filing Frequency</Label>
                          <Select>
                            <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="annually">Annually</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Business Tax ID / EIN</Label>
                          <Input placeholder="XX-XXXXXXX" />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-white">Save Settings</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
          </div>
        </div>}

        {/* ── Banking / Bank Transactions Tab ── */}
        {activeTab === 'banking' && <div className="space-y-6">
          {!bankConnected ? (
            <Card className="border-2 border-dashed dark:border-gray-700">
              <CardContent className="py-16 text-center space-y-5">
                <div className="h-16 w-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto">
                  <CreditCard className="h-8 w-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Connect your bank or credit card</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    Securely connect via <strong>Plaid</strong> to automatically import transactions. Your credentials are never stored — Plaid handles the secure connection.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2" onClick={() => setBankConnected(true)}>
                    <Link2 className="h-4 w-4" />
                    Connect with Plaid
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Connect manually
                  </Button>
                </div>
                <div className="flex items-center gap-6 justify-center pt-2">
                  {['Chase', 'Bank of America', 'Wells Fargo', 'American Express', 'Citi'].map(b => (
                    <span key={b} className="text-xs text-muted-foreground font-medium">{b}</span>
                  ))}
                  <span className="text-xs text-muted-foreground">+ 12,000 more</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Connected accounts */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Connected Accounts</h3>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setBankConnected(false)}>
                  <Plus className="h-4 w-4" />
                  Add account
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bankAccounts.length === 0 && (
                  <Card className="col-span-3">
                    <CardContent className="py-8 text-center text-muted-foreground text-sm">
                      No accounts connected yet. Click "Add account" to connect via Plaid.
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Transaction table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Bank Transactions</CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={bankTxSearch} onChange={e => setBankTxSearch(e.target.value)} placeholder="Search transactions..." className="pl-9 w-64 h-8 text-sm" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b dark:border-gray-700">
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Amount</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                          No transactions yet. Connect a bank account to start importing.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>}

        {/* ── Receipts Tab ── */}
        {activeTab === 'receipts' && <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-amber-500" />
                    Receipts
                  </CardTitle>
                  <CardDescription>Upload and manage expense receipts</CardDescription>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                  <Plus className="h-4 w-4" />
                  Upload Receipt
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed dark:border-gray-700 rounded-xl p-10 text-center mb-6 cursor-pointer hover:bg-muted/30 transition-colors">
                <Receipt className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium">Drag and drop receipts here</p>
                <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, PDF — Max 20 MB</p>
                <Button variant="outline" size="sm" className="mt-3">Browse files</Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-b dark:border-gray-700">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vendor</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No receipts uploaded yet</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>}

        {/* ── Reconcile Tab ── */}
        {activeTab === 'reconcile' && <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-amber-500" />
                Reconcile
              </CardTitle>
              <CardDescription>Match your books to your bank or credit card statements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account to reconcile</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking Account</SelectItem>
                      <SelectItem value="savings">Savings Account</SelectItem>
                      <SelectItem value="amex">AMEX Platinum</SelectItem>
                      <SelectItem value="visa">Visa Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statement ending date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Beginning balance</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Ending balance</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">Start reconciling</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Reconciliation History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-b dark:border-gray-700">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Statement Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Ending Balance</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reconciled On</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">No reconciliation history yet</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>}

        {/* ── Rules Tab ── */}
        {activeTab === 'rules' && <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Rules</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={rulesSearch} onChange={e => setRulesSearch(e.target.value)} placeholder="Search by name or conditions" className="pl-9 w-64 h-9 text-sm" />
              </div>
              <div className="relative">
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white gap-0 pr-0 rounded-r-none"
                  onClick={() => toast({ title: 'New rule', description: 'Rule creation form coming soon.' })}
                >
                  New rule
                </Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white px-2 rounded-l-none border-l border-amber-400"
                  onClick={() => setShowRulesDropdown(v => !v)}
                >
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </Button>
                {showRulesDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg z-20">
                    <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-lg" onClick={() => setShowRulesDropdown(false)}>Export rules</button>
                    <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-b-lg" onClick={() => setShowRulesDropdown(false)}>Import rules</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bank / Integration toggle */}
          <div className="flex gap-0.5">
            <button
              onClick={() => setRulesView('bank')}
              className={`px-5 py-2 text-sm font-medium rounded-l-md border transition-colors ${rulesView === 'bank' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Bank rules
            </button>
            <button
              onClick={() => setRulesView('integration')}
              className={`px-5 py-2 text-sm font-medium rounded-r-md border-t border-b border-r transition-colors ${rulesView === 'integration' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Integration rules
            </button>
          </div>

          {/* Rules table */}
          <div className="rounded-xl border overflow-hidden bg-white dark:bg-gray-900">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="w-8"><input type="checkbox" className="h-4 w-4 rounded" /></TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-20">Priority</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rule Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Applied To</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conditions</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Settings</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Auto-Add</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRules
                  .filter(r => !rulesSearch || r.name.toLowerCase().includes(rulesSearch.toLowerCase()) || r.conditions.toLowerCase().includes(rulesSearch.toLowerCase()))
                  .map((rule) => (
                  <TableRow key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell className="text-muted-foreground cursor-grab">
                      <span className="text-lg leading-none tracking-tighter">⠿⠿</span>
                    </TableCell>
                    <TableCell><input type="checkbox" className="h-4 w-4 rounded" /></TableCell>
                    <TableCell className="text-sm">{rule.priority}</TableCell>
                    <TableCell className="text-sm font-medium max-w-[180px] truncate">{rule.name}</TableCell>
                    <TableCell>
                      <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 whitespace-nowrap">
                        {rule.appliedTo}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{rule.conditions}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[220px] truncate">{rule.settings}</TableCell>
                    <TableCell className="text-sm">{rule.autoAdd ? 'Yes' : '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs text-muted-foreground border-gray-300 dark:border-gray-600">{rule.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">Edit</button>
                        <span className="text-muted-foreground">|</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground cursor-pointer" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>}

        {/* ── Chart of Accounts Tab ── */}
        {activeTab === 'chart-of-accounts' && <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Chart of Accounts</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Manage your company's accounts structure</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <FileText className="h-4 w-4" />
                Export
              </Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5">
                <Plus className="h-4 w-4" />
                New account
              </Button>
            </div>
          </div>
          <div className="rounded-xl border overflow-hidden bg-white dark:bg-gray-900">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Number</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detail Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Balance</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAccounts.map((acc) => (
                  <TableRow key={acc.number} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell className="text-sm font-mono text-muted-foreground">{acc.number}</TableCell>
                    <TableCell className="text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">{acc.name}</TableCell>
                    <TableCell className="text-sm">{acc.type}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{acc.subtype || '—'}</TableCell>
                    <TableCell className={`text-sm text-right font-medium ${acc.balance < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                      {acc.balance < 0 ? `(${formatCurrency(Math.abs(acc.balance))})` : formatCurrency(acc.balance)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{acc.action}</button>
                        <span className="text-muted-foreground">|</span>
                        <button className="text-xs text-muted-foreground hover:text-foreground">Edit</button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>}

        {/* ── Recurring Transactions Tab ── */}
        {activeTab === 'recurring' && <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Recurring Transactions</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Schedule transactions to repeat automatically</p>
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5">
              <Plus className="h-4 w-4" />
              New recurring
            </Button>
          </div>
          <div className="rounded-xl border overflow-hidden bg-white dark:bg-gray-900">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Template Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer/Vendor</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Interval</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Amount</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRecurring.map((rec) => (
                  <TableRow key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell className="text-sm font-medium">{rec.template}</TableCell>
                    <TableCell className="text-sm">{rec.type}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{rec.customer}</TableCell>
                    <TableCell className="text-sm">{rec.interval}</TableCell>
                    <TableCell className="text-sm">{rec.nextDate}</TableCell>
                    <TableCell className="text-sm text-right font-medium">{formatCurrency(rec.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${rec.status === 'Active' ? 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'text-amber-600 border-amber-200 bg-amber-50'}`}>
                        {rec.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                        <button className="text-xs text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>}

        {/* ── My Accountant Tab ── */}
        {activeTab === 'accountant' && <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-amber-500" />
                My Accountant
              </CardTitle>
              <CardDescription>Give your accountant access to your books</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border dark:border-gray-700 bg-amber-50 dark:bg-amber-900/10 p-5 flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium">Invite your accountant</p>
                  <p className="text-sm text-muted-foreground mt-1">Send an invitation to your accountant and they'll have secure access to your financial data without needing your password.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Accountant's email address</Label>
                  <Input placeholder="accountant@firm.com" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Accountant's name (optional)</Label>
                  <Input placeholder="e.g. John Smith" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Access level</Label>
                <Select defaultValue="accountant">
                  <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accountant">Accountant (Read + Journal entries)</SelectItem>
                    <SelectItem value="read">Read Only</SelectItem>
                    <SelectItem value="full">Full Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2" onClick={() => toast({ title: 'Invitation sent', description: 'Your accountant will receive an email with access instructions.' })}>
                  <Mail className="h-4 w-4" />
                  Send Invitation
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Current Accountant Access</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-b dark:border-gray-700">
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Access Level</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No accountants invited yet</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>}

        {/* ── Fixed Assets Tab ── */}
        {activeTab === 'fixed-assets' && <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Fixed Assets</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Track and depreciate long-term company assets</p>
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5">
              <Plus className="h-4 w-4" />
              Add asset
            </Button>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Assets', value: formatCurrency(mockAssets.reduce((s,a)=>s+a.cost,0)), sub: 'original cost' },
              { label: 'Total Accumulated Depreciation', value: formatCurrency(mockAssets.reduce((s,a)=>s+a.accum,0)), sub: 'to date' },
              { label: 'Net Book Value', value: formatCurrency(mockAssets.reduce((s,a)=>s+a.bookValue,0)), sub: 'current value' },
            ].map(stat => (
              <Card key={stat.label} className="border dark:border-gray-700">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-xl border overflow-hidden bg-white dark:bg-gray-900">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800">
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Asset Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Purchase Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Original Cost</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Depreciation Method</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Accum. Depr.</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Book Value</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAssets.map((asset) => (
                  <TableRow key={asset.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell className="text-sm font-medium">{asset.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{asset.date}</TableCell>
                    <TableCell className="text-sm text-right">{formatCurrency(asset.cost)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{asset.depreciation}</TableCell>
                    <TableCell className="text-sm text-right text-red-600 dark:text-red-400">({formatCurrency(asset.accum)})</TableCell>
                    <TableCell className="text-sm text-right font-semibold">{formatCurrency(asset.bookValue)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">{asset.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                        <button className="text-xs text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && <div className="space-y-6">
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
        </div>}
      </div>{/* end content */}

      {/* ── Bank Deposit Dialog ── */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="w-[96vw] max-w-[860px] max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-900">
            <DialogTitle className="text-base font-semibold">Bank Deposit</DialogTitle>
          </div>
          {/* header fields */}
          <div className="bg-gray-50 dark:bg-gray-900/60 border-b px-6 py-4 grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Deposit To</Label>
              <Select value={deposit.depositTo} onValueChange={v => setDeposit({ ...deposit, depositTo: v })}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1000 – Checking Account</SelectItem>
                  <SelectItem value="1010">1010 – Savings Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Date</Label>
              <Input type="date" value={deposit.date} onChange={e => setDeposit({ ...deposit, date: e.target.value })} />
            </div>
          </div>
          {/* lines table */}
          <div className="px-6 pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select the payments included in this deposit</p>
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {['#', 'Received From', 'Account', 'Memo', 'Payment'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {depositLines.map((ln, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-1.5 text-gray-400 w-8">{i + 1}</td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm" value={ln.name} onChange={e => { const l=[...depositLines]; l[i]={...l[i],name:e.target.value}; setDepositLines(l) }} /></td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm" value={ln.account} onChange={e => { const l=[...depositLines]; l[i]={...l[i],account:e.target.value}; setDepositLines(l) }} /></td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm" value={ln.memo} onChange={e => { const l=[...depositLines]; l[i]={...l[i],memo:e.target.value}; setDepositLines(l) }} /></td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm text-right" value={ln.payment} onChange={e => { const l=[...depositLines]; l[i]={...l[i],payment:e.target.value}; setDepositLines(l) }} /></td>
                      <td className="px-2"><button onClick={() => setDepositLines(depositLines.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <td colSpan={4} className="px-3 py-2 text-sm font-semibold text-right">Total</td>
                    <td className="px-3 py-2 text-sm font-semibold text-right">
                      ${depositLines.reduce((s,l)=>s+(parseFloat(l.payment)||0),0).toFixed(2)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setDepositLines([...depositLines,{name:'',account:'',memo:'',payment:''}])}>
              <Plus className="mr-1 h-3.5 w-3.5" />Add lines
            </Button>
          </div>
          {/* memo */}
          <div className="px-6 pb-4 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Memo</Label>
              <Textarea rows={3} value={deposit.memo} onChange={e => setDeposit({ ...deposit, memo: e.target.value })} />
            </div>
          </div>
          <div className="sticky bottom-0 z-10 flex justify-between items-center px-6 py-3 border-t bg-white dark:bg-gray-900">
            <Button variant="ghost" onClick={() => setDepositOpen(false)}>Cancel</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDepositOpen(false)}>Save</Button>
              <Button onClick={() => setDepositOpen(false)}>Save and new</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Transfer Dialog ── */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="w-[96vw] max-w-[680px] max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-900">
            <DialogTitle className="text-base font-semibold">Transfer</DialogTitle>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/60 border-b px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Transfer Funds From</Label>
                <Select value={transfer.from} onValueChange={v => setTransfer({ ...transfer, from: v })}>
                  <SelectTrigger><SelectValue placeholder="Transfer Funds From" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1000 – Checking Account</SelectItem>
                    <SelectItem value="1010">1010 – Savings Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 invisible">Balance</Label>
                <p className="text-sm text-gray-500 pt-2">Balance</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Transfer Funds To</Label>
                <Select value={transfer.to} onValueChange={v => setTransfer({ ...transfer, to: v })}>
                  <SelectTrigger><SelectValue placeholder="Transfer Funds To" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1000 – Checking Account</SelectItem>
                    <SelectItem value="1010">1010 – Savings Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 invisible">Balance</Label>
                <p className="text-sm text-gray-500 pt-2">Balance</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Transfer Amount</Label>
                <Input type="number" step="0.01" value={transfer.amount} onChange={e => setTransfer({ ...transfer, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Date</Label>
                <Input type="date" value={transfer.date} onChange={e => setTransfer({ ...transfer, date: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Memo</Label>
              <Textarea rows={4} value={transfer.memo} onChange={e => setTransfer({ ...transfer, memo: e.target.value })} />
            </div>
          </div>
          <div className="sticky bottom-0 z-10 flex justify-between items-center px-6 py-3 border-t bg-white dark:bg-gray-900">
            <Button variant="ghost" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button onClick={() => setTransferOpen(false)}>Save and new</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Journal Entry Dialog ── */}
      <Dialog open={journalOpen} onOpenChange={setJournalOpen}>
        <DialogContent className="w-[96vw] max-w-[1100px] max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-900">
            <DialogTitle className="text-base font-semibold">Journal Entry</DialogTitle>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/60 border-b px-6 py-4 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Journal date</Label>
              <Input type="date" value={journal.date} onChange={e => setJournal({ ...journal, date: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Journal no.</Label>
              <Input value={journal.journalNo} onChange={e => setJournal({ ...journal, journalNo: e.target.value })} placeholder="e.g. Adj. Trial at 2029" />
            </div>
          </div>
          <div className="px-6 pt-4 pb-2">
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="w-8 px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Account</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Debits</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Credits</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {journalLines.map((ln, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-2 py-1 text-gray-400 text-center">{i + 1}</td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm" value={ln.account} onChange={e => { const l=[...journalLines]; l[i]={...l[i],account:e.target.value}; setJournalLines(l) }} /></td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm text-right w-24" value={ln.debits} onChange={e => { const l=[...journalLines]; l[i]={...l[i],debits:e.target.value}; setJournalLines(l) }} /></td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm text-right w-24" value={ln.credits} onChange={e => { const l=[...journalLines]; l[i]={...l[i],credits:e.target.value}; setJournalLines(l) }} /></td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm" value={ln.description} onChange={e => { const l=[...journalLines]; l[i]={...l[i],description:e.target.value}; setJournalLines(l) }} /></td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm" value={ln.name} onChange={e => { const l=[...journalLines]; l[i]={...l[i],name:e.target.value}; setJournalLines(l) }} /></td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm" value={ln.location} onChange={e => { const l=[...journalLines]; l[i]={...l[i],location:e.target.value}; setJournalLines(l) }} /></td>
                      <td className="px-2"><button onClick={() => setJournalLines(journalLines.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <td colSpan={2} className="px-3 py-2 text-sm font-semibold text-right">Total</td>
                    <td className="px-3 py-2 text-sm font-semibold text-right">
                      ${journalLines.reduce((s,l)=>s+(parseFloat(l.debits)||0),0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-sm font-semibold text-right">
                      ${journalLines.reduce((s,l)=>s+(parseFloat(l.credits)||0),0).toFixed(2)}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setJournalLines([...journalLines,{account:'',debits:'',credits:'',description:'',name:'',location:''}])}>
                <Plus className="mr-1 h-3.5 w-3.5" />Add lines
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setJournalLines(Array.from({ length: 8 }, () => ({ account:'',debits:'',credits:'',description:'',name:'',location:'' })))}>
                Clear all lines
              </Button>
            </div>
          </div>
          <div className="px-6 pb-4 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Memo</Label>
              <Textarea rows={3} />
            </div>
          </div>
          <div className="sticky bottom-0 z-10 flex justify-between items-center px-6 py-3 border-t bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => setJournalOpen(false)}>Cancel</Button>
              <span className="text-xs text-amber-600 dark:text-amber-400 cursor-pointer hover:underline">Make recurring</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setJournalOpen(false)}>Save</Button>
              <Button onClick={() => setJournalOpen(false)}>Save and new</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Inventory QTY Adjustment Dialog ── */}
      <Dialog open={invAdjOpen} onOpenChange={setInvAdjOpen}>
        <DialogContent className="w-[96vw] max-w-[1000px] max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-900">
            <DialogTitle className="text-base font-semibold">Inventory quantity adjustment #{invAdj.refNo}</DialogTitle>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/60 border-b px-6 py-4 grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Adjustment date</Label>
              <Input type="date" value={invAdj.date} onChange={e => setInvAdj({ ...invAdj, date: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Reference number</Label>
              <Input value={invAdj.refNo} onChange={e => setInvAdj({ ...invAdj, refNo: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Location</Label>
              <Select value={invAdj.location} onValueChange={v => setInvAdj({ ...invAdj, location: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Warehouse</SelectItem>
                  <SelectItem value="showroom">Showroom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Adjustment reason</Label>
              <Select value={invAdj.reason} onValueChange={v => setInvAdj({ ...invAdj, reason: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Damaged Goods">Damaged Goods</SelectItem>
                  <SelectItem value="Lost/Stolen">Lost / Stolen</SelectItem>
                  <SelectItem value="Count Correction">Count Correction</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Inventory adjustment account</Label>
              <Select value={invAdj.account} onValueChange={v => setInvAdj({ ...invAdj, account: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="509 Inventory Shrinkage">509 Inventory Shrinkage</SelectItem>
                  <SelectItem value="5000 Cost of Goods Sold">5000 Cost of Goods Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="px-6 pt-4 pb-2">
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="w-8 px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Product / Variant</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">QTY On Hand</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">New QTY</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Change in QTY</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {invAdjLines.map((ln, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="px-2 py-1 text-gray-400 text-center">{i + 1}</td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm" value={ln.product} onChange={e => { const l=[...invAdjLines]; l[i]={...l[i],product:e.target.value}; setInvAdjLines(l) }} /></td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm w-24" value={ln.sku} onChange={e => { const l=[...invAdjLines]; l[i]={...l[i],sku:e.target.value}; setInvAdjLines(l) }} /></td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm" value={ln.description} onChange={e => { const l=[...invAdjLines]; l[i]={...l[i],description:e.target.value}; setInvAdjLines(l) }} /></td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm text-right w-24" value={ln.qtyOnHand} onChange={e => { const l=[...invAdjLines]; l[i]={...l[i],qtyOnHand:e.target.value}; setInvAdjLines(l) }} /></td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm text-right w-24" value={ln.newQty} onChange={e => {
                        const l=[...invAdjLines]
                        const newQty = e.target.value
                        const change = (parseFloat(newQty)||0) - (parseFloat(l[i].qtyOnHand)||0)
                        l[i]={...l[i],newQty,changeInQty:isNaN(change)?'':String(change)}
                        setInvAdjLines(l)
                      }} /></td>
                      <td className="px-1 py-1"><Input className="h-7 text-sm text-right w-24 bg-gray-50 dark:bg-gray-800" readOnly value={ln.changeInQty} /></td>
                      <td className="px-2"><button onClick={() => setInvAdjLines(invAdjLines.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setInvAdjLines([...invAdjLines,{product:'',sku:'',description:'',qtyOnHand:'',newQty:'',changeInQty:''}])}>
                <Plus className="mr-1 h-3.5 w-3.5" />Add lines
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInvAdjLines([{product:'',sku:'',description:'',qtyOnHand:'',newQty:'',changeInQty:''},{product:'',sku:'',description:'',qtyOnHand:'',newQty:'',changeInQty:''}])}>
                Clear all lines
              </Button>
            </div>
          </div>
          <div className="px-6 pb-4">
            <Label className="text-xs text-gray-500">Memo</Label>
            <Textarea rows={3} className="mt-1" value={invAdj.memo} onChange={e => setInvAdj({ ...invAdj, memo: e.target.value })} />
          </div>
          <div className="sticky bottom-0 z-10 flex justify-between items-center px-6 py-3 border-t bg-white dark:bg-gray-900">
            <Button variant="ghost" onClick={() => setInvAdjOpen(false)}>Cancel</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setInvAdjOpen(false)}>Save</Button>
              <Button onClick={() => setInvAdjOpen(false)}>Save and close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Vendor Dialog */}
      <Dialog open={addVendorOpen} onOpenChange={setAddVendorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Vendor</DialogTitle>
            <DialogDescription>Add a new vendor or supplier to use in expenses</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Vendor Name <span className="text-red-500">*</span></Label>
              <Input
                value={newVendorForm.name}
                onChange={e => setNewVendorForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Office Depot, FedEx…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newVendorForm.email}
                  onChange={e => setNewVendorForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="vendor@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={newVendorForm.phone}
                  onChange={e => setNewVendorForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(555) 000-0000"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                value={newVendorForm.address}
                onChange={e => setNewVendorForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Street, City, State"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddVendorOpen(false)} disabled={savingVendor}>Cancel</Button>
            <Button onClick={handleAddVendor} disabled={savingVendor || !newVendorForm.name.trim()}>
              {savingVendor ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Add Vendor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

