import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import type { InvoiceTemplateConfig } from '@/lib/invoice-template-types'
import { DEFAULT_CONFIG } from '@/lib/invoice-template-types'

const LOGO_SRC = '/images/shadotech-logo%20(1).webp'

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b]
}

function toAddressLine(parts: Array<string | undefined | null>): string {
  return parts
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join(', ')
}

async function loadLogoAsDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src)
    if (!res.ok) return null
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    return await new Promise<string | null>((resolve) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            URL.revokeObjectURL(objectUrl)
            resolve(null)
            return
          }
          ctx.drawImage(image, 0, 0)
          const pngData = canvas.toDataURL('image/png')
          URL.revokeObjectURL(objectUrl)
          resolve(pngData)
        } catch {
          URL.revokeObjectURL(objectUrl)
          resolve(null)
        }
      }
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        resolve(null)
      }
      image.src = objectUrl
    })
  } catch {
    return null
  }
}

export async function generateInvoicePDF(
  invoice: any,
  config: InvoiceTemplateConfig = DEFAULT_CONFIG
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 20

  const headerRgb = hexToRgb(config.headerBgColor)
  const accentRgb = hexToRgb(config.accentColor)

  // ── LOGO ─────────────────────────────────────────────────────────────────────
  let logoDataUrl: string | null = null
  if (config.showLogo) {
    logoDataUrl = await loadLogoAsDataUrl(LOGO_SRC)
  }

  // ── HEADER BAND ─────────────────────────────────────────────────────────────
  doc.setFillColor(...headerRgb)
  doc.rect(0, 0, W, 40, 'F')

  // Logo (if loaded) — small square in top-left
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', M, 7, 14, 14)
    } catch {
      // Logo embed failed; skip silently
    }
  }

  const textStartX = logoDataUrl ? M + 17 : M

  // Company name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text(config.companyName.toUpperCase(), textStartX, 17)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(config.companyTagline, textStartX, 25)

  // INVOICE label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(...accentRgb)
  doc.text(config.labels.invoiceTitle, W - M, 20, { align: 'right' })

  // Invoice number
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text(invoice.invoiceNumber, W - M, 29, { align: 'right' })

  // ── BILL TO + SHIP TO + INVOICE META ─────────────────────────────────────────
  let y = 54

  const billToLine = toAddressLine([
    invoice.billToStreet || invoice.customerStreet || invoice.street,
    invoice.billToCity || invoice.customerCity || invoice.city,
    invoice.billToState || invoice.customerTown || invoice.state || invoice.town,
    invoice.billToPostcode || invoice.customerPostcode || invoice.postcode,
    invoice.billToCountry || invoice.customerCountry || invoice.country,
  ]) || '—'
  const shipToLine = toAddressLine([
    invoice.shipToStreet,
    invoice.shipToCity,
    invoice.shipToState,
    invoice.shipToPostcode,
    invoice.shipToCountry,
  ]) || '—'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(config.labels.billTo.toUpperCase(), M, y - 5)
  doc.text((config.labels.shipTo || 'Ship To').toUpperCase(), M + 70, y - 5)

  const metaLabelX = W - M - 58
  doc.text(config.labels.invoiceDate.toUpperCase(), metaLabelX, y - 5)
  doc.text(config.labels.dueDate.toUpperCase(), metaLabelX, y + 3)
  if (config.showQuoteRef && invoice.quoteId) {
    doc.text(config.labels.quoteRef.toUpperCase(), metaLabelX, y + 11)
  }

  // Bill To content
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text(invoice.customerName, M, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  let byOffset = 6
  if (invoice.sideMark) {
    doc.text(invoice.sideMark, M, y + byOffset)
    byOffset += 5
  }
  doc.text(doc.splitTextToSize(billToLine, 62), M, y + byOffset)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(doc.splitTextToSize(shipToLine, 62), M + 70, y)

  // Meta values (right-aligned)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  const metaValueX = W - M
  try {
    doc.text(format(new Date(invoice.createdAt), 'MMM dd, yyyy'), metaValueX, y - 5, { align: 'right' })
  } catch {
    doc.text('—', metaValueX, y - 5, { align: 'right' })
  }
  try {
    doc.text(
      invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : '—',
      metaValueX,
      y + 3,
      { align: 'right' }
    )
  } catch {
    doc.text('—', metaValueX, y + 3, { align: 'right' })
  }
  if (config.showQuoteRef && invoice.quoteId) {
    doc.text(String(invoice.quoteId), metaValueX, y + 11, { align: 'right' })
  }

  // ── DIVIDER ──────────────────────────────────────────────────────────────────
  y = 80
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(M, y, W - M, y)
  y += 6

  // ── LINE ITEMS TABLE ─────────────────────────────────────────────────────────
  const { labels, showDimensions } = config

  if (invoice.items?.length > 0) {
    // Build columns dynamically based on showDimensions
    const head = showDimensions
      ? [labels.colNo, labels.colDescription, labels.colDimensions, labels.colQty, labels.colUnitPrice, labels.colTotal]
      : [labels.colNo, labels.colDescription, labels.colQty, labels.colUnitPrice, labels.colTotal]

    const body = invoice.items.map((item: any, i: number) => {
      const descParts = [item.productName]
      if (item.category) {
        descParts.push(item.subcategory ? `${item.category} · ${item.subcategory}` : item.category)
      }
      if (item.description) descParts.push(item.description)
      const dimStr = item.width && item.length ? `${item.width}" × ${item.length}"` : '–'
      return showDimensions
        ? [String(i + 1), descParts.join('\n'), dimStr, String(item.quantity ?? 1), fmt(item.unitPrice || item.totalPrice), fmt(item.totalPrice)]
        : [String(i + 1), descParts.join('\n'), String(item.quantity ?? 1), fmt(item.unitPrice || item.totalPrice), fmt(item.totalPrice)]
    })

    const columnStyles: { [key: string]: object } = showDimensions
      ? {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 72 },
          2: { cellWidth: 28, halign: 'center' },
          3: { cellWidth: 12, halign: 'center' },
          4: { cellWidth: 28, halign: 'right' },
          5: { cellWidth: 27, halign: 'right', fontStyle: 'bold' },
        }
      : {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 100 },
          2: { cellWidth: 12, halign: 'center' },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 27, halign: 'right', fontStyle: 'bold' },
        }

    autoTable(doc, {
      startY: y,
      head: [head],
      body,
      headStyles: {
        fillColor: headerRgb,
        textColor: [148, 163, 184],
        fontStyle: 'bold',
        fontSize: 7,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles,
      margin: { left: M, right: M },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.2,
    })
    y = (doc as any).lastAutoTable.finalY + 10
  } else {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(invoice.notes || 'See invoice details', M, y)
    y += 10
  }

  // ── TOTALS ───────────────────────────────────────────────────────────────────
  const totX1 = W - M - 65
  const totX2 = W - M

  const addTotalRow = (
    label: string,
    value: string,
    yPos: number,
    opts?: { bold?: boolean; labelColor?: [number, number, number]; valueColor?: [number, number, number] }
  ) => {
    const { bold = false, labelColor = [148, 163, 184], valueColor = [30, 41, 59] } = opts ?? {}
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...labelColor)
    doc.text(label, totX1, yPos)
    doc.setTextColor(...valueColor)
    doc.text(value, totX2, yPos, { align: 'right' })
  }

  if (invoice.subtotal != null) {
    addTotalRow(labels.subtotal, fmt(invoice.subtotal), y)
    y += 7
  }
  if (invoice.taxAmount != null && invoice.taxAmount > 0) {
    addTotalRow(
      `${labels.tax}${invoice.taxRate ? ` (${invoice.taxRate}%)` : ''}`,
      fmt(invoice.taxAmount),
      y
    )
    y += 7
  }

  // Custom rows
  for (const row of config.customRows) {
    const sign = row.type === 'subtract' ? '−' : '+'
    addTotalRow(row.label, `${sign}${fmt(row.amount)}`, y, {
      valueColor: row.type === 'subtract' ? [220, 38, 38] : [30, 41, 59],
    })
    y += 7
  }

  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(totX1 - 2, y, totX2, y)
  y += 5

  // Grand total (invoice.totalAmount + custom row adjustments)
  const customAdj = config.customRows.reduce(
    (acc, r) => acc + (r.type === 'add' ? r.amount : -r.amount),
    0
  )
  const grandTotal = (invoice.totalAmount ?? 0) + customAdj
  const paidAmount = invoice.paidAmount ?? 0
  const balanceDue = Math.max(0, grandTotal - paidAmount)

  addTotalRow(labels.total, fmt(grandTotal), y, { bold: true, valueColor: [15, 23, 42] })
  y += 8

  addTotalRow(labels.amountPaid, `−${fmt(paidAmount)}`, y, { valueColor: [22, 163, 74] })
  y += 8

  // Balance Due highlight box
  doc.setFillColor(239, 246, 255)
  doc.setDrawColor(...accentRgb)
  doc.setLineWidth(0.4)
  doc.roundedRect(totX1 - 4, y - 4, totX2 - totX1 + 8, 13, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(labels.balanceDue.toUpperCase(), totX1, y + 4)

  doc.setFontSize(11)
  doc.setTextColor(...accentRgb)
  doc.text(fmt(balanceDue), totX2, y + 4.5, { align: 'right' })
  y += 20

  // ── NOTES ────────────────────────────────────────────────────────────────────
  if (invoice.notes) {
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(M, y, W - M, y)
    y += 7

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(labels.notes.toUpperCase(), M, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(71, 85, 105)
    const noteLines = doc.splitTextToSize(invoice.notes, W - 2 * M)
    doc.text(noteLines, M, y)
    y += noteLines.length * 5 + 5
  }

  // ── TERMS ────────────────────────────────────────────────────────────────────
  if (config.showTerms && config.termsText) {
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(M, y, W - M, y)
    y += 7

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(labels.terms.toUpperCase(), M, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    const termLines = doc.splitTextToSize(config.termsText, W - 2 * M)
    doc.text(termLines, M, y)
  }

  // ── FOOTER BAND ──────────────────────────────────────────────────────────────
  doc.setFillColor(...headerRgb)
  doc.rect(0, H - 18, W, 18, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(config.footerText, W / 2, H - 9, { align: 'center' })
  doc.setFontSize(7)
  doc.setTextColor(71, 85, 105)
  doc.text(config.companyName, W / 2, H - 4, { align: 'center' })

  doc.save(`${invoice.invoiceNumber}.pdf`)
}
