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
import { Plus, Eye, FileText } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

interface Quote {
  id: string
  quoteNumber: string
  status: string
  totalAmount: number
  createdAt: Date
  expiryDate?: Date
}

// Mock quotes
const mockQuotes: Quote[] = [
  {
    id: '1',
    quoteNumber: 'QT-2024-001',
    status: 'SENT',
    totalAmount: 4500,
    createdAt: new Date('2024-01-15'),
    expiryDate: new Date('2024-02-15'),
  },
  {
    id: '2',
    quoteNumber: 'QT-2024-002',
    status: 'WON',
    totalAmount: 3200,
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    quoteNumber: 'QT-2023-089',
    status: 'EXPIRED',
    totalAmount: 5800,
    createdAt: new Date('2023-12-01'),
    expiryDate: new Date('2024-01-01'),
  },
]

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  SENT: 'bg-blue-500/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  VIEWED: 'bg-purple-500/10 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  NEGOTIATION: 'bg-yellow-500/10 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  POSTPONED: 'bg-orange-500/10 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  ACCEPTED: 'bg-emerald-500/10 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  WON: 'bg-green-500/10 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  LOST: 'bg-red-500/10 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  EXPIRED: 'bg-gray-500/10 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
}

interface QuotesTabProps {
  customerId: string
}

export function QuotesTab({ customerId }: QuotesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Quotes ({mockQuotes.length})</h3>
        <Link href={`/quotes/new?customerId=${customerId}`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Quote
          </Button>
        </Link>
      </div>

      {mockQuotes.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockQuotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-medium">
                  <Link 
                    href={`/quotes/${quote.id}`}
                    className="hover:underline"
                  >
                    {quote.quoteNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={cn('border-0', statusStyles[quote.status])}
                  >
                    {quote.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(quote.totalAmount)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {quote.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {quote.expiryDate?.toLocaleDateString() || '-'}
                </TableCell>
                <TableCell>
                  <Link href={`/quotes/${quote.id}`}>
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
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">No quotes yet</p>
          <Link href={`/quotes/new?customerId=${customerId}`}>
            <Button variant="outline" className="mt-4">
              Create First Quote
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

