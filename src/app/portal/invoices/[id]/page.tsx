'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Loader2, Download, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { generateInvoicePDF } from '@/lib/generateInvoicePDF'
import { DEFAULT_CONFIG, type InvoiceTemplateConfig } from '@/lib/invoice-template-types'
import { InvoiceDocument } from '@/components/invoices/InvoiceDocument'

const statusColors: Record<string, string> = {
  Unpaid: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'Partially Paid': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  Paid: 'bg-green-500/10 text-green-700 dark:text-green-400',
  Overdue: 'bg-red-500/10 text-red-700 dark:text-red-400',
  Draft: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
}

export default function PortalInvoiceDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const { token } = useAuthStore()
  const [invoice, setInvoice] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceTemplateConfig>(DEFAULT_CONFIG)

  // Load admin-saved invoice template from DB (public endpoint)
  useEffect(() => {
    fetch('/api/settings/company')
      .then((r) => r.json())
      .then((data) => {
        if (data.invoiceTemplateConfig) {
          setInvoiceConfig({ ...DEFAULT_CONFIG, ...data.invoiceTemplateConfig })
        }
      })
      .catch(() => {})
  }, [])

  const fetchInvoice = useCallback(async () => {
    if (!token || !id) return
    try {
      setLoading(true)
      const res = await fetch(`/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setInvoice(null)
        return
      }
      const data = await res.json()
      setInvoice(data.invoice)
    } catch {
      setInvoice(null)
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  const handleDownload = async () => {
    if (!invoice) return
    try {
      setDownloading(true)
      await generateInvoicePDF(invoice, invoiceConfig)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Invoice not found.</p>
        <Link href="/portal/invoices">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/portal/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{invoice.invoiceNumber}</h1>
              <Badge
                variant="outline"
                className={statusColors[invoice.status] ?? 'bg-gray-500/10 text-gray-700 dark:text-gray-300'}
              >
                {invoice.status}
              </Badge>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={handleDownload} disabled={downloading}>
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Preparing PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <InvoiceDocument invoice={invoice} config={invoiceConfig} />
        </CardContent>
      </Card>
    </div>
  )
}

