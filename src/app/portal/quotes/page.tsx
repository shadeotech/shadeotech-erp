'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Download, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import { downloadElementAsPdf } from '@/lib/quotePreviewPdf'
import QuotePreviewContent from '@/components/quotes/QuotePreviewContent'
import type { Quote } from '@/stores/quotesStore'

interface QuoteRow {
  id: string
  quoteNumber: string
  status: string
  totalAmount: number
  expiryDate?: string
  createdAt: string
}

export default function CustomerQuotesPage() {
  const { token, user } = useAuthStore()
  const router = useRouter()
  const { toast } = useToast()
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [pdfQuote, setPdfQuote] = useState<Quote | null>(null)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    const fetchQuotes = async () => {
      try {
        const res = await fetch('/api/quotes', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setQuotes(data.quotes ?? [])
        }
      } catch {
        setQuotes([])
      } finally {
        setLoading(false)
      }
    }
    fetchQuotes()
  }, [token])

  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const handleAccept = async (quoteId: string) => {
    if (!token || acceptingId) return
    setAcceptingId(quoteId)
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'accept' }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.contractId) {
          toast({
            title: 'Quote accepted',
            description: 'Please review and sign your contract to proceed with the 50% deposit.',
          })
          router.push('/portal/contracts')
          return
        }
        setQuotes((prev) =>
          prev.map((q) => q.id === quoteId ? { ...q, status: 'WON' } : q)
        )
      }
    } catch {
      // silently fail
    } finally {
      setAcceptingId(null)
    }
  }

  const handleReject = async (quoteId: string) => {
    if (!token || rejectingId) return
    setRejectingId(quoteId)
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'reject' }),
      })
      if (res.ok) {
        setQuotes((prev) =>
          prev.map((q) => q.id === quoteId ? { ...q, status: 'LOST' } : q)
        )
      }
    } catch {
      // silently fail
    } finally {
      setRejectingId(null)
    }
  }

  const handleDownloadPdf = async (quoteId: string) => {
    if (!token || downloadingId) return
    setDownloadingId(quoteId)
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      const fullQuote: Quote = data.quote
      setPdfQuote(fullQuote)
      // Wait for React to render the ghost div
      await new Promise((r) => setTimeout(r, 300))
      await downloadElementAsPdf('portal-list-pdf-ghost', `Quote-${fullQuote.quoteNumber}.pdf`)
    } catch {
      // silently fail
    } finally {
      setDownloadingId(null)
      setPdfQuote(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Estimates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your estimates
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimate #</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading quotes…
                    </TableCell>
                  </TableRow>
                ) : quotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No quotes yet
                    </TableCell>
                  </TableRow>
                ) : (
                  quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">
                        <Link href={`/portal/quotes/${quote.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                          {quote.quoteNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(quote.totalAmount)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {quote.createdAt ? format(new Date(quote.createdAt), 'MMM dd, yyyy') : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {quote.expiryDate ? format(new Date(quote.expiryDate), 'MMM dd, yyyy') : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {quote.status === 'SENT' ? (
                            <>
                              <Button
                                size="sm"
                                disabled={acceptingId === quote.id || rejectingId === quote.id}
                                onClick={() => handleAccept(quote.id)}
                              >
                                {acceptingId === quote.id
                                  ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  : <CheckCircle2 className="h-4 w-4 mr-1" />
                                }
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={acceptingId === quote.id || rejectingId === quote.id}
                                onClick={() => handleReject(quote.id)}
                              >
                                {rejectingId === quote.id
                                  ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  : <XCircle className="h-4 w-4 mr-1" />
                                }
                                Reject
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={downloadingId === quote.id}
                                onClick={() => handleDownloadPdf(quote.id)}
                              >
                                {downloadingId === quote.id
                                  ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  : <Download className="h-4 w-4 mr-1" />
                                }
                                PDF
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={downloadingId === quote.id}
                              onClick={() => handleDownloadPdf(quote.id)}
                            >
                              {downloadingId === quote.id
                                ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                : <Download className="h-4 w-4 mr-1" />
                              }
                              PDF
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Hidden offscreen div for PDF capture */}
      {pdfQuote && (
        <div
          id="portal-list-pdf-ghost"
          style={{ position: 'absolute', left: '-9999px', top: 0, width: '816px', background: 'white', zIndex: -1 }}
          aria-hidden="true"
        >
          <QuotePreviewContent quote={pdfQuote} customerDetails={null} excludeMeasurements={true} />
        </div>
      )}
    </div>
  )
}
