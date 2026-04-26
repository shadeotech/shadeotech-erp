'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { QuoteTable } from '@/components/quotes/QuoteTable'
import { mockAutomations } from './mockAutomations'
import { formatCurrency } from '@/lib/utils'
import { useSalesStore } from '@/stores/salesStore'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Search, MoreHorizontal, Eye, Send, FileText, Plus, Settings, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreateInvoiceModal } from '@/components/invoices/CreateInvoiceModal'

const statusStyles: Record<string, string> = {
  Unpaid: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  'Partially Paid': 'bg-yellow-500/10 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  Paid: 'bg-green-500/10 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  Overdue: 'bg-red-500/10 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState('Quotes')
  const [viewAsCustomer, setViewAsCustomer] = useState(false)
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false)
  const { quotes, invoices, payments, initializeData } = useSalesStore()

  useEffect(() => {
    initializeData()
  }, [initializeData])

  const tabs = ['Quotes', 'Invoices', 'Payments', 'Automations', 'Customer Portal']

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm pb-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-gray-900 dark:text-white border-gray-900 dark:border-white font-medium'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes Tab */}
      {activeTab === 'Quotes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Quotes</h2>
              <p className="text-sm text-muted-foreground">
                Manage and track your quotes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/quotes/pipeline">
                <Button variant="outline">Pipeline View</Button>
              </Link>
              <Link href="/quotes/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Quote
                </Button>
              </Link>
            </div>
          </div>
          <QuoteTable />
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'Invoices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Invoices</h2>
              <p className="text-sm text-muted-foreground">
                Manage your invoices and track payments
              </p>
            </div>
            <Button onClick={() => setCreateInvoiceOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search invoices..." className="pl-10" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
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

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>{invoice.customerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {invoice.sideMark}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('border-0', statusStyles[invoice.status])}
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(invoice.paidAmount)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {formatCurrency(invoice.dueAmount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/invoices/${invoice.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              Send Reminder
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {/* Payments Tab */}
      {activeTab === 'Payments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Payments</h2>
              <p className="text-sm text-muted-foreground">
                Track and manage all payments
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search payments..." className="pl-10" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="ACH">ACH</SelectItem>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Zelle">Zelle</SelectItem>
                <SelectItem value="Financing">Financing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.paymentNumber}
                      </TableCell>
                      <TableCell>
                        <div>{payment.customerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {payment.sideMark}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.invoiceNumber || '-'}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(payment.date).toLocaleDateString()}
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

      {/* Automations Tab */}
      {activeTab === 'Automations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Automations</h2>
              <p className="text-sm text-muted-foreground">
                Configure automated workflows and reminders
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {mockAutomations.map((automation) => (
              <Card key={automation.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {automation.name}
                        </h3>
                        {automation.enabled && automation.triggeredCount > 0 && (
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                            Automation Triggered ({automation.triggeredCount}x)
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <div>
                          <span className="font-medium">Trigger:</span>{' '}
                          {automation.triggerCondition === 'after_days'
                            ? `After ${automation.delay} days`
                            : automation.triggerCondition === 'when_overdue'
                            ? 'When overdue'
                            : automation.triggerCondition}
                        </div>
                        <div>
                          <span className="font-medium">Message Type:</span>{' '}
                          {automation.messageType.toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium">Message Preview:</span>
                          <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-900 dark:text-white">
                            {automation.messageTemplate}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`automation-${automation.id}`}
                          checked={automation.enabled}
                          onCheckedChange={(checked) => {
                            // Update automation state
                            console.log(`Automation ${automation.id} ${checked ? 'enabled' : 'disabled'}`)
                          }}
                        />
                        <Label htmlFor={`automation-${automation.id}`} className="cursor-pointer">
                          {automation.enabled ? 'Enabled' : 'Disabled'}
                        </Label>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Customer Portal Tab */}
      {activeTab === 'Customer Portal' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Customer Portal</h2>
              <p className="text-sm text-muted-foreground">
                Preview how customers view their quotes, invoices, and payments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="view-as-customer"
                  checked={viewAsCustomer}
                  onCheckedChange={setViewAsCustomer}
                />
                <Label htmlFor="view-as-customer" className="cursor-pointer">
                  View as Customer
                </Label>
              </div>
            </div>
          </div>

          {viewAsCustomer ? (
            <div className="space-y-6">
              <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Customer Preview Mode - Width and Length details are hidden
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Customer's Quotes */}
              <div>
                <h3 className="text-md font-semibold mb-4">My Quotes</h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quote ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Expiry Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Q-1001</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                              Sent
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(4200)}</TableCell>
                          <TableCell>Dec 30, 2025</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer's Invoices */}
              <div>
                <h3 className="text-md font-semibold mb-4">My Invoices</h3>
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
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.slice(0, 2).map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">
                                {invoice.invoiceNumber}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn('border-0', statusStyles[invoice.status])}
                                >
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                              <TableCell className="text-green-600">
                                {formatCurrency(invoice.paidAmount)}
                              </TableCell>
                              <TableCell className="text-red-600">
                                {formatCurrency(invoice.dueAmount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer's Payments */}
              <div>
                <h3 className="text-md font-semibold mb-4">My Payments</h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment #</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.slice(0, 2).map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                              {payment.paymentNumber}
                            </TableCell>
                            <TableCell>{payment.invoiceNumber || '-'}</TableCell>
                            <TableCell className="text-green-600">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell>
                              {new Date(payment.date).toLocaleDateString()}
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
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <User className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Customer Portal Preview
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Toggle "View as Customer" to see how customers view their quotes, invoices, and payments.
                </p>
                <p className="text-xs text-gray-500">
                  In customer view, width and length details in quotes are hidden, and all views are read-only.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <CreateInvoiceModal
        open={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
      />
    </div>
  )
}

