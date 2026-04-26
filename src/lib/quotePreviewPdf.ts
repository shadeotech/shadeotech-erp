import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Returns the vertical zones (relative to `container`) that must not be split
 * across pages — every <tr> in the element.
 */
function collectNoBreakZones(container: HTMLElement): { top: number; bottom: number }[] {
  const base = container.getBoundingClientRect()
  const zones: { top: number; bottom: number }[] = []
  container.querySelectorAll('tr').forEach((row) => {
    const r = row.getBoundingClientRect()
    zones.push({ top: r.top - base.top, bottom: r.bottom - base.top })
  })
  return zones.sort((a, b) => a.top - b.top)
}

async function captureElement(elementId: string): Promise<{ pdf: jsPDF }> {
  const el = document.getElementById(elementId)
  if (!el) throw new Error(`Element #${elementId} not found`)

  const captureScale = 2
  const canvas = await html2canvas(el, {
    useCORS: true,
    scale: captureScale,
    backgroundColor: '#ffffff',
    logging: false,
  } as any)

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'letter' })

  const pdfW = pdf.internal.pageSize.getWidth()
  const pdfH = pdf.internal.pageSize.getHeight()

  const domWidth = el.offsetWidth
  const domHeight = el.scrollHeight
  const domToPdf = pdfW / domWidth

  const canvasPixelsPerDomY = canvas.height / domHeight
  const pageHeightPx = (pdfH / pdfW) * canvas.width

  // Build page slices in canvas pixels, avoiding cuts inside table rows (<tr>)
  const zonesPx = collectNoBreakZones(el).map((z) => ({
    top: z.top * canvasPixelsPerDomY,
    bottom: z.bottom * canvasPixelsPerDomY,
  }))
  const slicesPx: Array<{ start: number; end: number }> = []
  let cursorPx = 0

  while (cursorPx < canvas.height) {
    let nextCutPx = Math.min(cursorPx + pageHeightPx, canvas.height)
    if (nextCutPx < canvas.height) {
      for (const z of zonesPx) {
        if (z.top < nextCutPx && z.bottom > nextCutPx) {
          // Move cut to row start when possible; only split if row itself is taller than a page.
          if (z.top > cursorPx) {
            nextCutPx = z.top
          }
          break
        }
      }
    }

    // Safety guard against zero/negative-height slices.
    if (nextCutPx <= cursorPx) {
      nextCutPx = Math.min(cursorPx + pageHeightPx, canvas.height)
      if (nextCutPx <= cursorPx) break
    }

    slicesPx.push({ start: cursorPx, end: nextCutPx })
    cursorPx = nextCutPx
  }

  // Slice the captured canvas per page instead of shifting one huge image.
  let isFirstPage = true

  for (let i = 0; i < slicesPx.length; i++) {
    const slice = slicesPx[i]
    // Keep source pixel ranges contiguous to avoid seam gaps/overlaps between pages.
    const sourceStart = Math.floor(slice.start)
    const sourceEnd =
      i === slicesPx.length - 1
        ? canvas.height
        : Math.floor(slice.end)
    const sourceHeight = Math.max(1, sourceEnd - sourceStart)

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sourceHeight
    const ctx = pageCanvas.getContext('2d')
    if (!ctx) throw new Error('Unable to build PDF page canvas')

    ctx.drawImage(
      canvas,
      0,
      sourceStart,
      canvas.width,
      sourceHeight,
      0,
      0,
      canvas.width,
      sourceHeight
    )

    const pageImg = pageCanvas.toDataURL('image/png')
    const segmentDomHeight = sourceHeight / canvasPixelsPerDomY
    // Clamp to page height to prevent overflow clipping at page boundaries.
    const segmentPdfHeight = Math.min(pdfH, segmentDomHeight * domToPdf)

    if (!isFirstPage) pdf.addPage()
    pdf.addImage(pageImg, 'PNG', 0, 0, pdfW, segmentPdfHeight)
    isFirstPage = false
  }

  return { pdf }
}

/** Returns base64 string (no data URI prefix) suitable for email attachment */
export async function captureElementAsPdfBase64(elementId: string): Promise<string> {
  const { pdf } = await captureElement(elementId)
  const dataUri = pdf.output('datauristring')
  return dataUri.split(',')[1]
}

/** Triggers a browser download of the PDF */
export async function downloadElementAsPdf(elementId: string, filename: string): Promise<void> {
  const { pdf } = await captureElement(elementId)
  pdf.save(filename)
}
