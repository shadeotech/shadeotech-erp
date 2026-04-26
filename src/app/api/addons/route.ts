import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import AddOn from '@/lib/models/AddOn'
import { verifyAuth } from '@/lib/auth'

const SEED_ADDONS = [
  { name: 'Fabric Wrap', price: 30, description: 'Fabric wrap option' },
  { name: 'Rechargeable Motor', price: 175, description: 'Rechargeable motor option' },
  { name: 'Hard Wired Motor', price: 175, description: 'Hard wired motor option' },
  { name: 'For Uni Shades Only Motor', price: 900, description: 'Motor option for Uni Shades only' },
  { name: 'Cordless', price: 70, description: 'Cordless option' },
  { name: 'Blinds Removal', price: 20, description: 'Blinds removal service' },
  { name: 'Blinds Disposal', price: 10, description: 'Blinds disposal service' },
  { name: 'Remote', price: 50, description: 'Remote control' },
  { name: 'Charger', price: 35, description: 'Charger accessory' },
  { name: 'Solar Panel', price: 75, description: 'Solar panel option' },
  { name: 'Smart Hub', price: 120, description: 'Smart hub for automation' },
  { name: 'Distribution Box', price: 250, description: 'Distribution box for AC 12V/24V' },
]

function format(item: any) {
  return {
    id: item._id.toString(),
    name: item.name,
    price: item.price,
    description: item.description ?? '',
  }
}

// GET — list all add-ons; auto-seeds defaults on first run
export async function GET() {
  try {
    await connectDB()

    let addOns = await AddOn.find({}).sort({ createdAt: 1 }).lean()

    // Upsert any missing seed add-ons by name (safe even if collection already has data)
    const existingNames = new Set(addOns.map((a: any) => a.name.toLowerCase()))
    const missing = SEED_ADDONS.filter((s) => !existingNames.has(s.name.toLowerCase()))
    if (missing.length > 0) {
      await AddOn.insertMany(missing)
      addOns = await AddOn.find({}).sort({ createdAt: 1 }).lean()
    }

    return NextResponse.json({ addOns: addOns.map(format) })
  } catch (error) {
    console.error('[/api/addons] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create a new add-on (admin only)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await connectDB()

    const { name, price, description } = await request.json()

    if (!name || price === undefined || price === null) {
      return NextResponse.json({ error: 'name and price are required' }, { status: 400 })
    }

    const parsed = parseFloat(price)
    if (isNaN(parsed) || parsed < 0) {
      return NextResponse.json({ error: 'price must be a non-negative number' }, { status: 400 })
    }

    const addOn = await AddOn.create({ name: name.trim(), price: parsed, description: description?.trim() ?? '' })

    return NextResponse.json({ addOn: format(addOn) }, { status: 201 })
  } catch (error) {
    console.error('[/api/addons] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
