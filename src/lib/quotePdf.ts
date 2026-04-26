import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Quote } from '@/stores/quotesStore'
import { formatCurrency } from './utils'

export function downloadQuotePdf(quote: Quote, downloadedBy?: string) {
  const doc = new jsPDF()

  let y = 20

  doc.setFontSize(22)
  doc.text('QUOTE', 14, y)
  y += 10

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Shadeotech Management', 14, y)
  y += 15

  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Quote #: ${quote.quoteNumber}`, 14, y)
  doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, 120, y)
  y += 6

  if (quote.expiryDate) {
    doc.text(`Valid Until: ${new Date(quote.expiryDate).toLocaleDateString()}`, 120, y)
    y += 6
  }
  y += 8

  doc.setFontSize(11)
  doc.text('Quote For:', 14, y)
  doc.text(quote.customerName, 40, y)
  y += 6

  if (quote.sideMark) {
    doc.text('Side Mark:', 14, y)
    doc.text(quote.sideMark, 40, y)
    y += 6
  }
  y += 10

  const tableData = quote.items.map((item) => [
    item.productName,
    `${item.width} × ${item.length}`,
    String(item.quantity),
    formatCurrency(item.unitPrice),
    formatCurrency(item.totalPrice),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Product', 'Dimensions', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [66, 66, 66], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 35 },
      2: { cellWidth: 15 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35 },
    },
  })

  y = (doc as any).lastAutoTable.finalY + 12

  if (quote.addOns && quote.addOns.length > 0) {
    doc.setFontSize(10)
    doc.text('Add-ons (per fabric):', 14, y)
    y += 5
    quote.addOns.forEach((ao) => {
      doc.setFont('helvetica', 'normal')
      doc.text(`${ao.name}: ${formatCurrency(ao.pricePerFabric)} × ${ao.fabricCount} = ${formatCurrency(ao.total)}`, 18, y)
      y += 5
    })
    y += 4
  }

  doc.setFontSize(10)
  doc.text('Subtotal:', 120, y)
  doc.text(formatCurrency(quote.subtotal), 180, y, { align: 'right' })
  y += 6

  doc.text(`Tax (${quote.taxRate}%):`, 120, y)
  doc.text(formatCurrency(quote.taxAmount), 180, y, { align: 'right' })
  y += 8

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Total:', 120, y)
  doc.text(formatCurrency(quote.totalAmount), 180, y, { align: 'right' })
  y += 12

  if (quote.notes) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Notes:', 14, y)
    y += 6
    const splitNotes = doc.splitTextToSize(quote.notes, 180)
    doc.text(splitNotes, 14, y)
    y += splitNotes.length * 5 + 8
  }

  if (quote.contractType) {
    doc.setFontSize(9)
    const contractLabel =
      quote.contractType === 'INTERIOR'
        ? 'Interior Shades'
        : quote.contractType === 'EXTERIOR'
          ? 'Exterior Shades'
          : 'Interior & Exterior Shades'
    doc.text(`Contract Type: ${contractLabel}`, 14, y)
    y += 8
  }

  // Terms & Conditions
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text('Terms & Conditions:', 14, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  const terms = [
    '1. Due to the nature of custom made products we required a 50% downpayment to start manufacturing. The remaining balance will be due prior to pickup/installation.',
    '2. All Sales are Final and Non Refundable. No changes or cancellation accepted after placing the order.',
    '3. Shadeotech Window Fashions shall not be responsible for delay of product due to any circumstances.',
  ]
  terms.forEach((line) => {
    const split = doc.splitTextToSize(line, 180)
    doc.text(split, 14, y)
    y += split.length * 4.5 + 1
  })
  y += 4

  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('Thank you for considering Shadeotech Management!', 14, y)
  if (downloadedBy) {
    doc.text(`Downloaded by: ${downloadedBy} on ${new Date().toLocaleString()}`, 14, y + 5)
  }

  doc.save(`Quote-${quote.quoteNumber}.pdf`)
}
