'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import type { InvoiceTemplateConfig, CustomRow } from '@/lib/invoice-template-types'

const LOGO_SRC = '/images/shadotech-logo%20(1).webp'

interface InvoiceDocumentProps {
  invoice: any
  config: InvoiceTemplateConfig
}

interface ComputedTotals {
  subtotal: number
  taxAmount: number
  grandTotal: number
  balanceDue: number
  customRows: CustomRow[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function toAddressLines(parts: Array<string | undefined | null>): string[] {
  const line = parts
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join(', ')
  return line ? [line] : ['—']
}

function getBillToLines(invoice: any): string[] {
  return toAddressLines([
    invoice.billToStreet || invoice.customerStreet || invoice.street,
    invoice.billToCity || invoice.customerCity || invoice.city,
    invoice.billToState || invoice.customerTown || invoice.state || invoice.town,
    invoice.billToPostcode || invoice.customerPostcode || invoice.postcode,
    invoice.billToCountry || invoice.customerCountry || invoice.country,
  ])
}

function getShipToLines(invoice: any): string[] {
  return toAddressLines([
    invoice.shipToStreet,
    invoice.shipToCity,
    invoice.shipToState,
    invoice.shipToPostcode,
    invoice.shipToCountry,
  ])
}

function useComputedTotals(invoice: any, config: InvoiceTemplateConfig): ComputedTotals {
  return useMemo(() => {
    const subtotal = invoice.subtotal ?? invoice.totalAmount
    const taxAmount = invoice.taxAmount ?? 0
    const customAdditions = config.customRows
      .filter((r) => r.type === 'add')
      .reduce((s, r) => s + r.amount, 0)
    const customDeductions = config.customRows
      .filter((r) => r.type === 'subtract')
      .reduce((s, r) => s + r.amount, 0)
    const grandTotal = invoice.totalAmount + customAdditions - customDeductions
    const balanceDue = Math.max(0, grandTotal - invoice.paidAmount)
    return { subtotal, taxAmount, grandTotal, balanceDue, customRows: config.customRows }
  }, [invoice, config.customRows])
}

function safeFmt(dateStr: string) {
  try {
    return format(new Date(dateStr), 'MMM dd, yyyy')
  } catch {
    return '—'
  }
}

// ── Template 1: Minimal Corporate ─────────────────────────────────────────────

function MinimalTemplate({ invoice, config }: InvoiceDocumentProps) {
  const totals = useComputedTotals(invoice, config)
  const lbl = config.labels
  const shipToLabel = lbl.shipTo || 'Ship To'
  const billToLines = getBillToLines(invoice)
  const shipToLines = getShipToLines(invoice)

  return (
    <div className="bg-white font-sans text-sm p-10 min-h-[740px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          {config.showLogo && (
            <img
              src={LOGO_SRC}
              alt={config.companyName}
              className="h-14 w-auto object-contain"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          <div>
            <p className="font-black text-lg text-slate-900 tracking-tight">{config.companyName}</p>
            {config.companyTagline && (
              <p className="text-[11px] text-slate-400 mt-0.5">{config.companyTagline}</p>
            )}
            {config.companyAddress && (
              <p className="text-[11px] text-slate-400 mt-0.5">{config.companyAddress}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p
            className="text-4xl font-black tracking-widest leading-none"
            style={{ color: config.accentColor }}
          >
            {lbl.invoiceTitle}
          </p>
          <p className="text-slate-700 font-semibold mt-1 text-base">{invoice.invoiceNumber}</p>
        </div>
      </div>

      <div className="border-t-2 border-slate-900 mb-6" />

      {/* Bill To + Ship To + Meta */}
      <div className="grid grid-cols-2 gap-8 mb-7">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            {lbl.billTo}
          </p>
          <p className="font-bold text-slate-900 text-base">{invoice.customerName}</p>
          {invoice.sideMark && (
            <p className="text-slate-500 text-[13px] mt-0.5">{invoice.sideMark}</p>
          )}
          <div className="mt-2 space-y-0.5">
            {billToLines.map((line, idx) => (
              <p key={`bill-${idx}`} className="text-slate-500 text-[12px]">{line}</p>
            ))}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2">
            {shipToLabel}
          </p>
          <div className="space-y-0.5">
            {shipToLines.map((line, idx) => (
              <p key={`ship-${idx}`} className="text-slate-500 text-[12px]">{line}</p>
            ))}
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="flex justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {lbl.invoiceDate}
            </span>
            <span className="text-slate-700 font-medium text-xs">{safeFmt(invoice.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {lbl.dueDate}
            </span>
            <span className="text-slate-700 font-medium text-xs">
              {invoice.dueDate ? safeFmt(invoice.dueDate) : '—'}
            </span>
          </div>
          {config.showQuoteRef && invoice.quoteId && (
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {lbl.quoteRef}
              </span>
              <span className="text-slate-700 font-medium text-xs">{invoice.quoteId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      {invoice.items?.length > 0 && (
        <div className="mb-7">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="pb-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide w-7">
                  {lbl.colNo}
                </th>
                <th className="pb-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {lbl.colDescription}
                </th>
                {config.showDimensions && (
                  <th className="pb-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide w-24">
                    {lbl.colDimensions}
                  </th>
                )}
                <th className="pb-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide w-10">
                  {lbl.colQty}
                </th>
                <th className="pb-2 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wide w-24">
                  {lbl.colUnitPrice}
                </th>
                <th className="pb-2 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wide w-22">
                  {lbl.colTotal}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, i: number) => (
                <tr key={item.id || i} className="border-b border-slate-100">
                  <td className="py-3 text-slate-400 text-center text-xs">{i + 1}</td>
                  <td className="py-3">
                    <p className="font-semibold text-slate-900">{item.productName}</p>
                    {item.category && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.category}
                        {item.subcategory ? ` · ${item.subcategory}` : ''}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">{item.description}</p>
                    )}
                  </td>
                  {config.showDimensions && (
                    <td className="py-3 text-center text-slate-500 text-[11px]">
                      {item.width && item.length ? `${item.width}" × ${item.length}"` : '–'}
                    </td>
                  )}
                  <td className="py-3 text-center text-slate-700">{item.quantity ?? 1}</td>
                  <td className="py-3 text-right text-slate-500">
                    {formatCurrency(item.unitPrice || item.totalPrice)}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end mb-7">
        <div className="w-60 space-y-2">
          {totals.subtotal !== invoice.totalAmount && (
            <div className="flex justify-between">
              <span className="text-slate-500">{lbl.subtotal}</span>
              <span className="text-slate-700">{formatCurrency(totals.subtotal)}</span>
            </div>
          )}
          {totals.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">
                {lbl.tax}
                {invoice.taxRate ? ` (${invoice.taxRate}%)` : ''}
              </span>
              <span className="text-slate-700">{formatCurrency(totals.taxAmount)}</span>
            </div>
          )}
          {totals.customRows.map((row) => (
            <div key={row.id} className="flex justify-between">
              <span className="text-slate-500">{row.label}</span>
              <span className={row.type === 'subtract' ? 'text-green-600' : 'text-slate-700'}>
                {row.type === 'subtract' ? '−' : ''}{formatCurrency(row.amount)}
              </span>
            </div>
          ))}
          <div className="border-t-2 border-slate-900 pt-2">
            <div className="flex justify-between font-bold text-base">
              <span className="text-slate-900">{lbl.total}</span>
              <span className="text-slate-900">{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{lbl.amountPaid}</span>
            <span className="text-green-600 font-medium">−{formatCurrency(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between items-center border-t-2 border-slate-900 pt-2">
            <span className="font-black text-slate-900 text-sm uppercase tracking-wide">
              {lbl.balanceDue}
            </span>
            <span className="font-black text-xl" style={{ color: config.accentColor }}>
              {formatCurrency(totals.balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="border-t border-slate-200 pt-5 mb-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            {lbl.notes}
          </p>
          <p className="text-[13px] text-slate-600 leading-relaxed">{invoice.notes}</p>
        </div>
      )}

      {/* Terms */}
      {config.showTerms && config.termsText && (
        <div className="border-t border-slate-200 pt-5 mb-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            {lbl.terms}
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">{config.termsText}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-slate-200 pt-5 text-center">
        <p className="text-[13px] text-slate-400">{config.footerText}</p>
      </div>
    </div>
  )
}

// ── Template 2: Modern ─────────────────────────────────────────────────────────

function ModernTemplate({ invoice, config }: InvoiceDocumentProps) {
  const totals = useComputedTotals(invoice, config)
  const lbl = config.labels
  const shipToLabel = lbl.shipTo || 'Ship To'
  const billToLines = getBillToLines(invoice)
  const shipToLines = getShipToLines(invoice)

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Header Band */}
      <div
        className="px-8 py-5 flex justify-between items-center"
        style={{ backgroundColor: config.headerBgColor }}
      >
        <div className="flex items-center gap-4">
          {config.showLogo && (
            <img
              src={LOGO_SRC}
              alt={config.companyName}
              className="h-12 w-auto object-contain"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          <div>
            <p className="text-white font-bold text-lg leading-none">{config.companyName}</p>
            {config.companyTagline && (
              <p className="text-slate-400 text-[11px] mt-1">{config.companyTagline}</p>
            )}
            {config.companyAddress && (
              <p className="text-slate-400 text-[11px] mt-0.5">{config.companyAddress}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p
            className="font-black text-3xl tracking-widest leading-none"
            style={{ color: config.accentColor }}
          >
            {lbl.invoiceTitle}
          </p>
          <p className="text-slate-300 text-sm font-semibold mt-1">{invoice.invoiceNumber}</p>
        </div>
      </div>

      <div className="px-8 py-6 space-y-5">
        {/* Bill To + Ship To + Meta */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              {lbl.billTo}
            </p>
            <p className="font-semibold text-slate-900 text-base">{invoice.customerName}</p>
            {invoice.sideMark && (
              <p className="text-slate-500 text-sm mt-0.5">{invoice.sideMark}</p>
            )}
            <div className="mt-2 space-y-0.5">
              {billToLines.map((line, idx) => (
                <p key={`bill-${idx}`} className="text-slate-500 text-[12px]">{line}</p>
              ))}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2">
              {shipToLabel}
            </p>
            <div className="space-y-0.5">
              {shipToLines.map((line, idx) => (
                <p key={`ship-${idx}`} className="text-slate-500 text-[12px]">{line}</p>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {lbl.invoiceDate}
              </span>
              <span className="text-sm text-slate-700">{safeFmt(invoice.createdAt)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {lbl.dueDate}
              </span>
              <span className="text-sm text-slate-700">
                {invoice.dueDate ? safeFmt(invoice.dueDate) : '—'}
              </span>
            </div>
            {config.showQuoteRef && invoice.quoteId && (
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {lbl.quoteRef}
                </span>
                <span className="text-sm text-slate-700">{invoice.quoteId}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Line Items */}
        {invoice.items?.length > 0 && (
          <div className="rounded-lg overflow-hidden border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: config.headerBgColor }}>
                  <th className="p-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 w-8">
                    {lbl.colNo}
                  </th>
                  <th className="p-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {lbl.colDescription}
                  </th>
                  {config.showDimensions && (
                    <th className="p-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 w-24">
                      {lbl.colDimensions}
                    </th>
                  )}
                  <th className="p-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 w-10">
                    {lbl.colQty}
                  </th>
                  <th className="p-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 w-24">
                    {lbl.colUnitPrice}
                  </th>
                  <th className="p-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 w-24">
                    {lbl.colTotal}
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any, i: number) => (
                  <tr
                    key={item.id || i}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                  >
                    <td className="p-3 text-center text-slate-400 text-xs">{i + 1}</td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">{item.productName}</p>
                      {item.category && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.category}
                          {item.subcategory ? ` · ${item.subcategory}` : ''}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">{item.description}</p>
                      )}
                    </td>
                    {config.showDimensions && (
                      <td className="p-3 text-center text-slate-500 text-xs">
                        {item.width && item.length ? `${item.width}" × ${item.length}"` : '–'}
                      </td>
                    )}
                    <td className="p-3 text-center text-slate-700">{item.quantity ?? 1}</td>
                    <td className="p-3 text-right text-slate-500">
                      {formatCurrency(item.unitPrice || item.totalPrice)}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100" />

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2.5">
            {totals.subtotal !== invoice.totalAmount && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{lbl.subtotal}</span>
                <span className="text-slate-700">{formatCurrency(totals.subtotal)}</span>
              </div>
            )}
            {totals.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  {lbl.tax}
                  {invoice.taxRate ? ` (${invoice.taxRate}%)` : ''}
                </span>
                <span className="text-slate-700">{formatCurrency(totals.taxAmount)}</span>
              </div>
            )}
            {totals.customRows.map((row) => (
              <div key={row.id} className="flex justify-between text-sm">
                <span className="text-slate-400">{row.label}</span>
                <span className={row.type === 'subtract' ? 'text-green-600' : 'text-slate-700'}>
                  {row.type === 'subtract' ? '−' : ''}{formatCurrency(row.amount)}
                </span>
              </div>
            ))}
            <div className="border-t border-slate-200 pt-2.5">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-slate-700 text-sm">{lbl.total}</span>
                <span className="font-bold text-slate-900 text-base">
                  {formatCurrency(totals.grandTotal)}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">{lbl.amountPaid}</span>
              <span className="text-green-600 font-medium">
                −{formatCurrency(invoice.paidAmount)}
              </span>
            </div>
            <div
              className="rounded-lg px-4 py-3 flex justify-between items-center"
              style={{
                backgroundColor: `${config.accentColor}18`,
                border: `1px solid ${config.accentColor}40`,
              }}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {lbl.balanceDue}
              </span>
              <span className="font-black text-xl" style={{ color: config.accentColor }}>
                {formatCurrency(totals.balanceDue)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <>
            <div className="border-t border-slate-100" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                {lbl.notes}
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">{invoice.notes}</p>
            </div>
          </>
        )}

        {/* Terms */}
        {config.showTerms && config.termsText && (
          <>
            <div className="border-t border-slate-100" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                {lbl.terms}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">{config.termsText}</p>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-400">{config.footerText}</p>
        </div>
      </div>
    </div>
  )
}

// ── Template 3: Classic Detailed ───────────────────────────────────────────────

function ClassicTemplate({ invoice, config }: InvoiceDocumentProps) {
  const totals = useComputedTotals(invoice, config)
  const lbl = config.labels
  const shipToLabel = lbl.shipTo || 'Ship To'
  const billToLines = getBillToLines(invoice)
  const shipToLines = getShipToLines(invoice)

  return (
    <div className="bg-white border-2 border-slate-300 rounded-lg overflow-hidden font-sans text-sm">
      {/* Colored Header */}
      <div className="px-8 py-5 flex justify-between items-start" style={{ backgroundColor: config.headerBgColor }}>
        <div className="flex items-center gap-4">
          {config.showLogo && (
            <img
              src={LOGO_SRC}
              alt={config.companyName}
              className="h-14 w-auto object-contain"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          <div>
            <p className="font-black text-xl text-white">{config.companyName}</p>
            {config.companyTagline && (
              <p className="text-slate-300 text-xs mt-0.5">{config.companyTagline}</p>
            )}
            {config.companyAddress && (
              <p className="text-slate-300 text-[11px] mt-0.5">{config.companyAddress}</p>
            )}
          </div>
        </div>
        <div
          className="text-right border-2 border-white/20 rounded-lg px-5 py-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
        >
          <p className="text-2xl font-black text-white tracking-wider">{lbl.invoiceTitle}</p>
          <p className="text-[13px] font-mono text-slate-300 mt-1">{invoice.invoiceNumber}</p>
        </div>
      </div>

      {/* Customer + Meta Grid */}
      <div className="grid grid-cols-2 border-b-2 border-slate-200">
        <div className="px-8 py-5 border-r-2 border-slate-200">
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: config.accentColor }}
          >
            {lbl.billTo}
          </p>
          <p className="font-bold text-slate-900">{invoice.customerName}</p>
          {invoice.sideMark && <p className="text-slate-600 mt-0.5">{invoice.sideMark}</p>}
          <div className="mt-2 space-y-0.5">
            {billToLines.map((line, idx) => (
              <p key={`bill-${idx}`} className="text-slate-500 text-[12px]">{line}</p>
            ))}
          </div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mt-4 mb-2"
            style={{ color: config.accentColor }}
          >
            {shipToLabel}
          </p>
          <div className="space-y-0.5">
            {shipToLines.map((line, idx) => (
              <p key={`ship-${idx}`} className="text-slate-500 text-[12px]">{line}</p>
            ))}
          </div>
        </div>
        <div className="px-8 py-5">
          <table className="w-full">
            <tbody className="text-[13px]">
              <tr>
                <td className="py-1.5 text-slate-500 font-medium text-xs uppercase tracking-wide">
                  {lbl.invoiceDate}
                </td>
                <td className="py-1.5 text-right text-slate-900 font-semibold">
                  {safeFmt(invoice.createdAt)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 text-slate-500 font-medium text-xs uppercase tracking-wide">
                  {lbl.dueDate}
                </td>
                <td className="py-1.5 text-right text-slate-900 font-semibold">
                  {invoice.dueDate ? safeFmt(invoice.dueDate) : '—'}
                </td>
              </tr>
              {config.showQuoteRef && invoice.quoteId && (
                <tr>
                  <td className="py-1.5 text-slate-500 font-medium text-xs uppercase tracking-wide">
                    {lbl.quoteRef}
                  </td>
                  <td className="py-1.5 text-right text-slate-900 font-semibold">
                    {invoice.quoteId}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Line Items */}
      {invoice.items?.length > 0 && (
        <div className="border-b-2 border-slate-200">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ backgroundColor: `${config.accentColor}18` }}>
                <th
                  className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wide border-r border-slate-200 w-8"
                  style={{ color: config.accentColor }}
                >
                  {lbl.colNo}
                </th>
                <th
                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide border-r border-slate-200"
                  style={{ color: config.accentColor }}
                >
                  {lbl.colDescription}
                </th>
                {config.showDimensions && (
                  <th
                    className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wide border-r border-slate-200 w-24"
                    style={{ color: config.accentColor }}
                  >
                    {lbl.colDimensions}
                  </th>
                )}
                <th
                  className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wide border-r border-slate-200 w-10"
                  style={{ color: config.accentColor }}
                >
                  {lbl.colQty}
                </th>
                <th
                  className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide border-r border-slate-200 w-28"
                  style={{ color: config.accentColor }}
                >
                  {lbl.colUnitPrice}
                </th>
                <th
                  className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide w-24"
                  style={{ color: config.accentColor }}
                >
                  {lbl.colTotal}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, i: number) => (
                <tr
                  key={item.id || i}
                  className={`border-t border-slate-100 ${i % 2 !== 0 ? 'bg-slate-50/50' : ''}`}
                >
                  <td className="px-4 py-3 text-center text-slate-400 text-xs border-r border-slate-100">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100">
                    <p className="font-semibold text-slate-900">{item.productName}</p>
                    {item.category && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.category}
                        {item.subcategory ? ` · ${item.subcategory}` : ''}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">{item.description}</p>
                    )}
                  </td>
                  {config.showDimensions && (
                    <td className="px-4 py-3 text-center text-slate-500 text-xs border-r border-slate-100">
                      {item.width && item.length ? `${item.width}" × ${item.length}"` : '–'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-center text-slate-700 border-r border-slate-100">
                    {item.quantity ?? 1}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 border-r border-slate-100">
                    {formatCurrency(item.unitPrice || item.totalPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end border-b-2 border-slate-200 px-8 py-5">
        <div className="w-72">
          <table className="w-full text-sm">
            <tbody>
              {totals.subtotal !== invoice.totalAmount && (
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">{lbl.subtotal}</td>
                  <td className="py-2 text-right text-slate-700 font-medium">
                    {formatCurrency(totals.subtotal)}
                  </td>
                </tr>
              )}
              {totals.taxAmount > 0 && (
                <tr className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">
                    {lbl.tax}
                    {invoice.taxRate ? ` (${invoice.taxRate}%)` : ''}
                  </td>
                  <td className="py-2 text-right text-slate-700 font-medium">
                    {formatCurrency(totals.taxAmount)}
                  </td>
                </tr>
              )}
              {totals.customRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="py-2 text-slate-500">{row.label}</td>
                  <td
                    className={`py-2 text-right font-medium ${
                      row.type === 'subtract' ? 'text-green-600' : 'text-slate-700'
                    }`}
                  >
                    {row.type === 'subtract' ? '−' : ''}{formatCurrency(row.amount)}
                  </td>
                </tr>
              ))}
              <tr className="border-b-2 border-slate-300">
                <td className="py-2 font-bold text-slate-900">{lbl.total}</td>
                <td className="py-2 text-right font-bold text-slate-900">
                  {formatCurrency(totals.grandTotal)}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-500">{lbl.amountPaid}</td>
                <td className="py-2 text-right text-green-600 font-medium">
                  −{formatCurrency(invoice.paidAmount)}
                </td>
              </tr>
              <tr>
                <td className="pt-3 pb-1">
                  <span
                    className="font-black text-sm uppercase tracking-wide"
                    style={{ color: config.accentColor }}
                  >
                    {lbl.balanceDue}
                  </span>
                </td>
                <td className="pt-3 pb-1 text-right">
                  <span className="font-black text-xl" style={{ color: config.accentColor }}>
                    {formatCurrency(totals.balanceDue)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes + Terms */}
      {(invoice.notes || (config.showTerms && config.termsText)) && (
        <div className="px-8 py-5 grid grid-cols-2 gap-6 border-b-2 border-slate-200">
          {invoice.notes && (
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: config.accentColor }}
              >
                {lbl.notes}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">{invoice.notes}</p>
            </div>
          )}
          {config.showTerms && config.termsText && (
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: config.accentColor }}
              >
                {lbl.terms}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">{config.termsText}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div
        className="px-8 py-3 text-center text-xs"
        style={{ backgroundColor: config.headerBgColor, color: 'rgba(255,255,255,0.6)' }}
      >
        {config.footerText}
      </div>
    </div>
  )
}

// ── Estimate-Style Template ────────────────────────────────────────────────────
function EstimateStyleTemplate({ invoice, config }: InvoiceDocumentProps) {
  const totals = useComputedTotals(invoice, config)
  const lbl = config.labels
  const billToLines = getBillToLines(invoice)
  const shipToLines = getShipToLines(invoice)
  const hasBillTo = billToLines.some((l) => l !== '—')
  const hasShipTo = invoice.shipToStreet && shipToLines.some((l) => l !== '—')

  return (
    <div className="bg-white text-gray-900 p-8 text-[13px]">
      {/* Header: company info left, logo right */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold mb-3">{lbl.invoiceTitle || 'INVOICE'}</h2>
          <div className="text-xs leading-relaxed text-gray-700">
            {config.companyAddress && <p>Address: {config.companyAddress}</p>}
            <p>Tel: 469-499-3322</p>
            <p>Email: info@shadeotech.com</p>
            <p>Web: www.shadeotech.com</p>
          </div>
        </div>
        <div className="text-right text-xs leading-relaxed text-gray-700 flex flex-col items-end gap-2">
          {config.showLogo && (
            <img src={LOGO_SRC} alt="Logo" className="h-20 w-auto object-contain mb-1"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
          <div>
            {invoice.invoiceNumber && <p><span className="font-semibold">Invoice #:</span> {invoice.invoiceNumber}</p>}
            {config.showQuoteRef && invoice.quoteId && <p><span className="font-semibold">{lbl.quoteRef}:</span> {invoice.quoteId}</p>}
            <p><span className="font-semibold">Date:</span> {safeFmt(invoice.createdAt)}</p>
            {invoice.dueDate && <p><span className="font-semibold">Due:</span> {safeFmt(invoice.dueDate)}</p>}
          </div>
        </div>
      </div>

      {/* Bill To / Ship To — always shown */}
      <div className="flex gap-8 mb-6 text-xs">
        <div className="flex-1">
          <p className="font-bold text-gray-900 mb-1 border-b border-gray-300 pb-1">{lbl.billTo}</p>
          <p className="text-gray-700">{invoice.customerName}</p>
          {billToLines.map((l, i) => <p key={i} className="text-gray-700">{l}</p>)}
          {invoice.sideMark && <p className="text-gray-500 mt-0.5">Side Mark: {invoice.sideMark}</p>}
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 mb-1 border-b border-gray-300 pb-1">{lbl.shipTo}</p>
          <p className="text-gray-700">{invoice.customerName}</p>
          {(hasShipTo ? shipToLines : billToLines).map((l, i) => (
            <p key={i} className="text-gray-700">{l}</p>
          ))}
          {invoice.sideMark && <p className="text-gray-500 mt-0.5">Side Mark: {invoice.sideMark}</p>}
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-y-2 border-gray-800">
            <th className="py-2 px-2 text-left font-bold w-8">{lbl.colNo}</th>
            <th className="py-2 px-2 text-left font-bold">{lbl.colDescription}</th>
            <th className="py-2 px-2 text-center font-bold w-12">{lbl.colQty}</th>
            <th className="py-2 px-2 text-right font-bold w-[90px]">{lbl.colUnitPrice}</th>
            <th className="py-2 px-2 text-right font-bold w-[90px]">{lbl.colTotal}</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items ?? []).map((item: any, index: number) => (
            <tr key={index} className="border-b border-gray-200 align-top">
              <td className="py-2 px-2 font-semibold">{index + 1}</td>
              <td className="py-2 px-2">
                <p className="font-bold text-xs">{item.productName || item.description}</p>
                {item.category && <p className="text-[11px] text-gray-600">• {item.category}{item.subcategory ? ` — ${item.subcategory}` : ''}</p>}
                {item.description && item.productName && <p className="text-[11px] text-gray-600">• {item.description}</p>}
              </td>
              <td className="py-2 px-2 text-center">{item.quantity}</td>
              <td className="py-2 px-2 text-right">{formatCurrency(item.unitPrice)}</td>
              <td className="py-2 px-2 text-right">{formatCurrency(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-y-2 border-gray-800 font-bold">
            <td className="py-2 px-2" colSpan={2} />
            <td className="py-2 px-2 text-center">{(invoice.items ?? []).reduce((s: number, i: any) => s + (i.quantity || 1), 0)}</td>
            <td className="py-2 px-2" />
            <td className="py-2 px-2 text-right">Grand: {formatCurrency(totals.grandTotal)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Totals */}
      <div className="flex justify-end mt-4">
        <div className="w-64 text-xs space-y-1">
          <div className="flex justify-between">
            <span>{lbl.subtotal}:</span>
            <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{lbl.tax} ({invoice.taxRate ?? 0}%):</span>
            <span className="font-semibold">{formatCurrency(totals.taxAmount)}</span>
          </div>
          {totals.customRows.map((r) => (
            <div key={r.id} className="flex justify-between">
              <span>{r.label}:</span>
              <span className="font-semibold">{r.type === 'subtract' ? '-' : ''}{formatCurrency(r.amount)}</span>
            </div>
          ))}
          <div className="border-t border-gray-800 pt-1 flex justify-between font-bold text-sm">
            <span>{lbl.total}:</span>
            <span>{formatCurrency(totals.grandTotal)}</span>
          </div>
          {invoice.paidAmount > 0 && (
            <>
              <div className="flex justify-between text-green-700">
                <span>{lbl.amountPaid}:</span>
                <span className="font-semibold">-{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{lbl.balanceDue}:</span>
                <span>{formatCurrency(totals.balanceDue)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-4 text-xs text-gray-600">
          <p className="font-bold text-gray-800 mb-1">{lbl.notes}:</p>
          <p className="whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Terms & Conditions */}
      {config.showTerms && config.termsText && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-600">
          <p className="font-bold text-gray-800 mb-2">{lbl.terms}:</p>
          <ol className="space-y-1 list-none pl-0">
            {config.termsText.split('\n').filter(Boolean).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Footer */}
      {config.footerText && (
        <p className="mt-6 text-center text-xs text-gray-400">{config.footerText}</p>
      )}
    </div>
  )
}

// ── Main Dispatcher ────────────────────────────────────────────────────────────

export function InvoiceDocument({ invoice, config }: InvoiceDocumentProps) {
  if (!invoice) return null
  switch (config.template) {
    case 'minimal':
      return <MinimalTemplate invoice={invoice} config={config} />
    case 'classic':
      return <ClassicTemplate invoice={invoice} config={config} />
    case 'estimate-style':
      return <EstimateStyleTemplate invoice={invoice} config={config} />
    case 'modern':
    default:
      return <ModernTemplate invoice={invoice} config={config} />
  }
}
