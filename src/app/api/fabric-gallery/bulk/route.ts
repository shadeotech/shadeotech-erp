import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import FabricGallery from '@/lib/models/FabricGallery'
import { verifyAuth } from '@/lib/auth'

const CSV_HEADERS = [
  'category',
  'subcategory',
  'color',
  'collection',
  'pricingCollectionId',
  'opacity',
  'width',
  'minWidth',
  'maxWidth',
  'rollLength',
  'inStock',
  'rollsAvailable',
]

const CSV_TEMPLATE_ROWS = [
  'Duo Shades,Light Filtering,White,Infra,duo_light_filtering,10%,126",24",126",22 yd/roll,true,5',
  'Duo Shades,Blackout,Midnight,Geneva,duo_blackout,,,,,,,0',
  'Roller Shades,Light Filtering,Sand,,roller_light_filtering,,,,,,,3',
]

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      result.push(current); current = ''
    } else {
      current += c
    }
  }
  result.push(current)
  return result
}

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = (values[idx] ?? '').trim() })
    rows.push(row)
  }
  return rows
}

// GET — download the CSV template
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const csv = [CSV_HEADERS.join(','), ...CSV_TEMPLATE_ROWS].join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="fabric-upload-template.csv"',
    },
  })
}

// POST — bulk insert fabrics from uploaded CSV
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await connectDB()

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const text = await file.text()
    const rows = parseCSV(text)
    if (rows.length === 0) return NextResponse.json({ error: 'No data rows found in CSV' }, { status: 400 })

    let inserted = 0
    const errors: { row: number; error: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2
      const { category, subcategory, color, collection, pricingcollectionid, opacity, width, minwidth, maxwidth, rolllength, instock, rollsavailable } = row

      if (!category || !subcategory || !color) {
        errors.push({ row: rowNum, error: 'category, subcategory, and color are required' })
        continue
      }

      try {
        await FabricGallery.create({
          category: category.trim(),
          subcategory: subcategory.trim(),
          color: color.trim(),
          collection: collection?.trim() || undefined,
          pricingCollectionId: pricingcollectionid?.trim() || undefined,
          opacity: opacity?.trim() || undefined,
          width: width?.trim() || undefined,
          minWidth: minwidth?.trim() || undefined,
          maxWidth: maxwidth?.trim() || undefined,
          rollLength: rolllength?.trim() || undefined,
          imageFilename: 'placeholder.jpg',
          inStock: instock?.toLowerCase() !== 'false',
          rollsAvailable: Number(rollsavailable) || 0,
        })
        inserted++
      } catch (err) {
        errors.push({ row: rowNum, error: err instanceof Error ? err.message : 'Insert failed' })
      }
    }

    return NextResponse.json({ inserted, errors, total: rows.length })
  } catch (error) {
    console.error('[/api/fabric-gallery/bulk] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
