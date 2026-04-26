'use client'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CreditCard } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

interface Payment {
  id: string
  paymentNumber: string
  invoiceNumber?: string
  amount: number
  method: string
  status: string
  date: Date
}

// Mock payments
const mockPayments: Payment[] = [
  {
    id: '1',
    paymentNumber: 'PAY-2024-001',
    invoiceNumber: 'INV-2024-001',
    amount: 2250,
    method: 'CREDIT_CARD',
    status: 'COMPLETED',
    date: new Date('2024-01-20'),
  },
  {
    id: '2',
    paymentNumber: 'PAY-2024-002',
    invoiceNumber: 'INV-2024-002',
    amount: 3200,
    method: 'CHECK',
    status: 'COMPLETED',
    date: new Date('2024-01-15'),
  },
]

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-600',
  COMPLETED: 'bg-green-500/10 text-green-600',
  FAILED: 'bg-red-500/10 text-red-600',
  REFUNDED: 'bg-purple-500/10 text-purple-600',
}

const methodLabels: Record<string, string> = {
  CREDIT_CARD: 'Credit Card',
  ACH: 'ACH Transfer',
  CHECK: 'Check',
  FINANCING: 'Financing',
  ZELLE: 'Zelle',
  CASH: 'Cash',
  OTHER: 'Other',
}

interface PaymentsTabProps {
  customerId: string
}

export function PaymentsTab({ customerId }: PaymentsTabProps) {
  const totalPaid = mockPayments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Payments ({mockPayments.length})</h3>
          <p className="text-sm text-muted-foreground">
            Total received: {formatCurrency(totalPaid)}
          </p>
        </div>
      </div>

      {mockPayments.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment #</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">
                  {payment.paymentNumber}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.invoiceNumber || '-'}
                </TableCell>
                <TableCell className="text-green-600 font-medium">
                  {formatCurrency(payment.amount)}
                </TableCell>
                <TableCell>
                  {methodLabels[payment.method] || payment.method}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn('border-0', statusStyles[payment.status])}
                  >
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.date.toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="py-8 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">No payments recorded</p>
        </div>
      )}
    </div>
  )
}

