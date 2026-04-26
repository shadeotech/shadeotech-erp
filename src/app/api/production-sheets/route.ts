import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import ProductionSheet from '@/lib/models/ProductionSheet'
import { verifyAuth } from '@/lib/auth'
import User from '@/lib/models/User'


function toApi(sheet: any) {
  return {
    id: sheet._id.toString(),
    _id: sheet._id.toString(),
    name: sheet.name,
    productType: sheet.productType,
    operation: sheet.operation,
    columns: sheet.columns || [],
    rows: sheet.rows || [],
    createdAt: sheet.createdAt,
    updatedAt: sheet.updatedAt,
  }
}

const DEFAULT_COLUMNS = ['Serial', 'QTY', 'Area', 'Width', 'Height', 'Cord', 'POS', 'SHADES', 'Fascia', 'Tube', 'Bottom Rail', 'Fabric W', 'Fabric H']

const SEED_SHEET = {
  name: 'TRI SHADES (SHADEO Fascia & Clutch) MANUAL',
  productType: 'TRI Shades',
  operation: 'MANUAL' as const,
  columns: DEFAULT_COLUMNS,
  rows: [
    { Serial: '1', QTY: '1', Area: '###', Width: '###', Height: '100', Cord: '66 2/3', POS: 'RIGHT', SHADES: '99 3/4', Fascia: '99 7/16', Tube: '98 11/16', 'Bottom Rail': '98 13/16', 'Fabric W': '98 3/4', 'Fabric H': '100 15/16' },
    { Serial: '2', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '3', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '4', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '5', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '6', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '7', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '8', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '9', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '10', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '11', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '12', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '13', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '14', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '15', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '16', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '17', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '18', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '19', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
    { Serial: '20', QTY: '1', Area: '', Width: '', Height: '', Cord: '0', POS: 'RIGHT', SHADES: '- 1/4', Fascia: '9/16', Tube: '-1 5/16', 'Bottom Rail': '-1 3/16', 'Fabric W': '-1 1/4', 'Fabric H': '15/16' },
  ],
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const user = await User.findById(auth.userId).select('role').lean()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let sheets = await ProductionSheet.find({}).sort({ name: 1 }).lean()

    if (sheets.length === 0) {
      await ProductionSheet.create(SEED_SHEET)
      sheets = await ProductionSheet.find({}).sort({ name: 1 }).lean()
    }

    return NextResponse.json({ productionSheets: sheets.map(toApi) })
  } catch (error) {
    console.error('[/api/production-sheets] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const user = await User.findById(auth.userId).select('role').lean()
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { name, productType, operation, columns, rows } = body

    if (!name || !productType || !operation) {
      return NextResponse.json({ error: 'name, productType, and operation are required' }, { status: 400 })
    }

    const sheet = await ProductionSheet.create({
      name: String(name).trim(),
      productType: String(productType).trim(),
      operation: operation === 'MOTORIZED' ? 'MOTORIZED' : 'MANUAL',
      columns: Array.isArray(columns) ? columns : DEFAULT_COLUMNS,
      rows: Array.isArray(rows) ? rows : [],
    })

    return NextResponse.json({ productionSheet: toApi(sheet.toObject()) }, { status: 201 })
  } catch (error) {
    console.error('[/api/production-sheets] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
