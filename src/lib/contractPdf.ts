import { jsPDF } from 'jspdf'

interface DownloadContractPdfInput {
  contractNumber: string
  quoteNumber: string
  customerName: string
  contractTypeLabel: string
  content: string
  // Customer signature (text fallback + image)
  signature?: string | null
  signedAt?: Date | null
  // Admin signature
  adminSignature?: string | null
  adminSignedAt?: Date | null
  adminSignatureData?: string | null
  // Customer signature image
  customerSignatureData?: string | null
  // Additional contract fields
  installationAddress?: string | null
  customerFullName?: string | null
}

export function downloadContractPdf({
  contractNumber,
  quoteNumber,
  customerName,
  contractTypeLabel,
  content,
  signature,
  signedAt,
  adminSignature,
  adminSignedAt,
  adminSignatureData,
  customerSignatureData,
  installationAddress,
  customerFullName,
}: DownloadContractPdfInput) {
  const doc = new jsPDF()
  let y = 18
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()

  const checkPage = (needed = 10) => {
    if (y > pageHeight - needed) {
      doc.addPage()
      y = 18
    }
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFontSize(20)
  doc.text('CONTRACT', 14, y)
  y += 8

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Shadeotech Management', 14, y)
  y += 10

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.text(`Contract #: ${contractNumber}`, 14, y)
  doc.text(`Quote #: ${quoteNumber}`, 120, y)
  y += 6
  doc.text(`Customer: ${customerName}`, 14, y)
  y += 6
  doc.text(`Type: ${contractTypeLabel}`, 14, y)
  y += 10

  // ── Contract body ────────────────────────────────────────────────────────────
  const cleanedContent = content
    .replace(/<[^>]+>/g, '')
    .replace(/\[IMAGE_PLACEHOLDER\]/g, '')
    .replace(/\r/g, '')
    .trim()

  const lines = doc.splitTextToSize(cleanedContent, pageWidth - 28)
  doc.setFontSize(10)
  lines.forEach((line: string) => {
    checkPage(8)
    doc.text(line, 14, y)
    y += 5
  })

  // ── Signature section ────────────────────────────────────────────────────────
  checkPage(60)
  y += 6

  doc.setDrawColor(200, 200, 200)
  doc.line(14, y, pageWidth - 14, y)
  y += 6

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Signatures', 14, y)
  doc.setFont('helvetica', 'normal')
  y += 8

  // Admin signature block
  doc.setFontSize(10)
  doc.text('Admin / Company Representative:', 14, y)
  y += 5
  if (adminSignatureData) {
    checkPage(28)
    try {
      doc.addImage(adminSignatureData, 'PNG', 14, y, 70, 20)
      y += 24
    } catch {
      if (adminSignature) { doc.text(`Signed by: ${adminSignature}`, 14, y); y += 5 }
    }
  } else if (adminSignature) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'italic')
    doc.text(adminSignature, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    y += 7
  }
  if (adminSignedAt) {
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Signed: ${new Date(adminSignedAt).toLocaleString()}`, 14, y)
    doc.setTextColor(0, 0, 0)
    y += 5
  }

  y += 4
  checkPage(50)

  // Customer details
  doc.setFontSize(10)
  doc.text('Customer:', 14, y)
  y += 5
  if (customerFullName) {
    doc.text(`Legal Name: ${customerFullName}`, 14, y)
    y += 5
  }
  if (installationAddress) {
    doc.text(`Installation Address: ${installationAddress}`, 14, y)
    y += 5
  }
  if (signedAt) {
    doc.text(`Date of Signing: ${new Date(signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, y)
    y += 5
  }
  y += 3

  // Customer signature
  if (customerSignatureData) {
    checkPage(28)
    try {
      doc.addImage(customerSignatureData, 'PNG', 14, y, 70, 20)
      y += 24
    } catch {
      if (signature) { doc.text(`Signed by: ${signature}`, 14, y); y += 5 }
    }
  } else if (signature) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'italic')
    doc.text(signature, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    y += 7
  }
  if (signedAt) {
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Signed: ${new Date(signedAt).toLocaleString()}`, 14, y)
    doc.setTextColor(0, 0, 0)
    y += 5
  }

  doc.save(`Contract-${contractNumber}.pdf`)
}
