'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, Receipt } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  totalAmount: number
  paidAmount: number
  dueDate?: Date
  createdAt: Date
}

// Mock invoices
const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    status: 'PARTIALLY_PAID',
    totalAmount: 4500,
    paidAmount: 2250,
    dueDate: new Date('2024-02-01'),
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    status: 'PAID',
    totalAmount: 3200,
    paidAmount: 3200,
    createdAt: new Date('2024-01-10'),
  },
]

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  SENT: 'bg-blue-500/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  PARTIALLY_PAID: 'bg-yellow-500/10 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  PAID: 'bg-green-500/10 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  OVERDUE: 'bg-red-500/10 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  CANCELLED: 'bg-gray-500/10 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
}

interface InvoicesTabProps {
  customerId: string
}

export function InvoicesTab({ customerId }: InvoicesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Invoices ({mockInvoices.length})</h3>
      </div>

      {mockInvoices.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  <Link 
                    href={`/invoices/${invoice.id}`}
                    className="hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn('border-0', statusStyles[invoice.status])}
                  >
                    {invoice.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                <TableCell className="text-green-600">
                  {formatCurrency(invoice.paidAmount)}
                </TableCell>
                <TableCell className="text-red-600">
                  {formatCurrency(invoice.totalAmount - invoice.paidAmount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invoice.dueDate?.toLocaleDateString() || '-'}
                </TableCell>
                <TableCell>
                  <Link href={`/invoices/${invoice.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="py-8 text-center">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">No invoices yet</p>
        </div>
      )}
    </div>
  )
}

