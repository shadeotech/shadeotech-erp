'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Send, FileText, Copy, Loader2, Package, ExternalLink } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { downloadQuotePdf } from '@/lib/quotePdf'
import { useQuotesStore, type Quote } from '@/stores/quotesStore'
import { useAuthStore } from '@/stores/authStore'
import { canPerformActions } from '@/lib/permissions'
import { useToast } from '@/components/ui/use-toast'

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  SENT: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  NEGOTIATION: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  POSTPONED: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300',
  WON: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  LOST: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  EXPIRED: 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  NEGOTIATION: 'Negotiating',
  POSTPONED: 'Postponed',
  WON: 'Confirmed',
  LOST: 'Archived',
  EXPIRED: 'Expired',
}

interface QuoteTableProps {
  quotesOverride?: Quote[]
}

export function QuoteTable({ quotesOverride }: QuoteTableProps) {
  const router = useRouter()
  const { quotes, duplicateQuote, updateStatus } = useQuotesStore()
  const { user, token } = useAuthStore()
  const { toast } = useToast()
  const [duplicateLoadingId, setDuplicateLoadingId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const data = quotesOverride ?? quotes
  const canPerformActionsOnSales = canPerformActions(user, 'sales')

  const handleDownloadPdf = (quote: Quote) => {
    const downloadedBy = user
      ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
      : undefined
    downloadQuotePdf(quote, downloadedBy)
  }

  const handleDuplicate = async (quote: Quote) => {
    if (!token) return
    setDuplicateLoadingId(quote.id)
    try {
      const newId = await duplicateQuote(quote.id, token)
      router.push(`/quotes/${newId}`)
    } catch (err) {
      console.error('Duplicate failed:', err)
    } finally {
      setDuplicateLoadingId(null)
    }
  }

  const handleSendToProduction = async (quote: Quote) => {
    if (!token || sendingId) return
    setSendingId(quote.id)
    try {
      const res = await fetch(`/api/quotes/${quote.id}/send-to-production`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast({
        title: 'Sent to Pending Approval',
        description: `Order ${data.orderNumber} created and awaiting review.`,
      })
      updateStatus(quote.id, 'WON')
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to send to production',
        variant: 'destructive',
      })
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estimate #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((quote) => (
            <TableRow key={quote.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/quotes/${quote.id}`}
                    className="font-medium hover:underline"
                  >
                    {quote.quoteNumber}
                  </Link>
                  {(quote as any).dealerId && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-200">
                      Dealer Order
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Link 
                  href={`/customers/${quote.customerId}`}
                  className="hover:underline"
                >
                  <div>{quote.customerName}</div>
                  <div className="text-xs text-muted-foreground">
                    {quote.sideMark}
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn('border-0', statusStyles[quote.status])}
                >
                  {(quote as any).dealerId && quote.status === 'SENT' ? 'Received' : (STATUS_LABELS[quote.status] ?? quote.status)}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(quote.totalAmount)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(quote.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {quote.expiryDate 
                  ? new Date(quote.expiryDate).toLocaleDateString()
                  : '-'}
              </TableCell>
              <TableCell>
                {canPerformActionsOnSales ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/quotes/${quote.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/quotes/${quote.id}?preview=1`} target="_blank">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Preview Estimate
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Send className="mr-2 h-4 w-4" />
                        Send Estimate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadPdf(quote)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(quote)}
                        disabled={!!duplicateLoadingId}
                      >
                        {duplicateLoadingId === quote.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        {duplicateLoadingId === quote.id ? 'Duplicating…' : 'Duplicate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSendToProduction(quote)}
                        disabled={sendingId === quote.id}
                        className="text-amber-700 dark:text-amber-400 font-medium"
                      >
                        {sendingId === quote.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Package className="mr-2 h-4 w-4" />
                        )}
                        {sendingId === quote.id ? 'Sending…' : 'Send to Pending Approval'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href={`/quotes/${quote.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

