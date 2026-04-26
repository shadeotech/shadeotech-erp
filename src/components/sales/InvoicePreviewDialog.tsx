'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Settings2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InvoiceDocument } from '@/components/invoices/InvoiceDocument'
import { InvoiceCustomizerPanel } from '@/components/invoices/InvoiceCustomizerPanel'
import { useInvoiceTemplateStore } from '@/stores/invoiceTemplateStore'
import { generateInvoicePDF } from '@/lib/generateInvoicePDF'

interface InvoicePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: any
}

export function InvoicePreviewDialog({ open, onOpenChange, invoice }: InvoicePreviewDialogProps) {
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const { config } = useInvoiceTemplateStore()

  if (!invoice) return null

  const handleDownload = async () => {
    await generateInvoicePDF(invoice, config)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[92vh] flex flex-col p-0 gap-0 transition-all duration-200',
          customizerOpen ? 'max-w-5xl' : 'max-w-3xl'
        )}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-5 pb-0 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-base">Invoice Preview</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {invoice.invoiceNumber} · {invoice.customerName}
              </DialogDescription>
            </div>
            <Button
              variant={customizerOpen ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setCustomizerOpen(!customizerOpen)}
            >
              {customizerOpen ? (
                <><X className="h-3.5 w-3.5 mr-1.5" />Close Editor</>
              ) : (
                <><Settings2 className="h-3.5 w-3.5 mr-1.5" />Customize</>
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 mt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Preview Panel */}
          <div className="flex-1 overflow-y-auto p-5">
            <InvoiceDocument invoice={invoice} config={config} />
          </div>

          {/* Customizer Panel */}
          {customizerOpen && (
            <div className="w-72 flex-shrink-0 border-l border-slate-100 dark:border-slate-800 overflow-y-auto">
              <InvoiceCustomizerPanel />
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
