'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Download, Loader2, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { downloadElementAsPdf } from '@/lib/quotePreviewPdf'
import QuotePreviewContent from '@/components/quotes/QuotePreviewContent'
import { useAuthStore } from '@/stores/authStore'
import { format } from 'date-fns'
import type { Quote } from '@/stores/quotesStore'

const DEALER_STATUS_LABELS: Record<string, string> = {
  SENT: 'Pending Review',
  WON: 'Accepted',
  LOST: 'Rejected',
  DRAFT: 'Draft',
  NEGOTIATION: 'In Negotiation',
  POSTPONED: 'Postponed',
  EXPIRED: 'Expired',
}

const statusStyles: Record<string, string> = {
  SENT: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  WON: 'bg-green-500/10 text-green-600 dark:text-green-400',
  LOST: 'bg-red-500/10 text-red-600 dark:text-red-400',
  DRAFT: 'bg-gray-500/10 text-gray-600 dark:text-gray-300',
  NEGOTIATION: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  POSTPONED: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  EXPIRED: 'bg-gray-500/10 text-gray-500 dark:text-gray-400',
}

export default function DealerOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { token, user } = useAuthStore()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    if (!token || !id) { setLoading(false); return }
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/quotes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 404 || res.status === 403) { setNotFound(true); return }
        if (res.ok) {
          const data = await res.json()
          setQuote(data.quote)
        } else {
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [token, id])

  const handleDownloadPdf = async () => {
    if (!quote || downloadingPdf) return
    setDownloadingPdf(true)
    try {
      await downloadElementAsPdf('dealer-order-pdf-ghost', `Order-${quote.quoteNumber}.pdf`)
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !quote) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/dealer/orders')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Order Not Found</h3>
            <p className="text-sm text-muted-foreground mt-1">This order does not exist or you don&apos;t have access to it.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayStatus = DEALER_STATUS_LABELS[quote.status] ?? quote.status

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dealer/orders')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Order {quote.quoteNumber}
            </h1>
            {quote.sideMark && (
              <p className="text-xs text-muted-foreground mt-0.5">{quote.sideMark}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant="outline" className={`border-0 ${statusStyles[quote.status] ?? ''}`}>
            {displayStatus}
          </Badge>
          <Button onClick={handleDownloadPdf} variant="outline" className="gap-2" disabled={downloadingPdf}>
            {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloadingPdf ? 'Generating…' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="font-medium mt-0.5">
              {quote.createdAt ? format(new Date(quote.createdAt), 'MMM dd, yyyy') : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Expires</p>
            <p className="font-medium mt-0.5">
              {quote.expiryDate ? format(new Date(quote.expiryDate), 'MMM dd, yyyy') : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Items</p>
            <p className="font-medium mt-0.5">{quote.items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold mt-0.5 text-lg">{formatCurrency(quote.totalAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Products</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No items
                    </TableCell>
                  </TableRow>
                ) : (
                  quote.items.map((item, idx) => (
                    <TableRow key={item.id || idx}>
                      <TableCell>
                        <p className="font-medium">{item.productName}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="p-4 border-t space-y-1.5">
            {quote.addOns && quote.addOns.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground font-medium mb-1">Add-ons</p>
                {quote.addOns.map((ao, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{ao.name}</span>
                    <span>{formatCurrency(ao.total)}</span>
                  </div>
                ))}
                <Separator className="my-2" />
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({quote.taxRate}%)</span>
                <span>{formatCurrency(quote.taxAmount)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatCurrency(quote.totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {quote.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Hidden ghost div for PDF capture */}
      <div
        id="dealer-order-pdf-ghost"
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '816px', background: 'white', zIndex: -1 }}
        aria-hidden="true"
      >
        <QuotePreviewContent quote={quote} customerDetails={null} excludeMeasurements={true} />
      </div>
    </div>
  )
}
