import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import AddOn from '@/lib/models/AddOn'
import { verifyAuth } from '@/lib/auth'

function format(item: any) {
  return {
    id: item._id.toString(),
    name: item.name,
    price: item.price,
    description: item.description ?? '',
  }
}

// PATCH — update name, price, or description
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await connectDB()

    const { name, price, description } = await request.json()
    const update: Record<string, unknown> = {}

    if (name !== undefined) update.name = name.trim()
    if (price !== undefined) {
      const parsed = parseFloat(price)
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json({ error: 'price must be a non-negative number' }, { status: 400 })
      }
      update.price = parsed
    }
    if (description !== undefined) update.description = description.trim()

    const addOn = await AddOn.findByIdAndUpdate(params.id, update, { new: true }).lean()
    if (!addOn) return NextResponse.json({ error: 'Add-on not found' }, { status: 404 })

    return NextResponse.json({ addOn: format(addOn) })
  } catch (error) {
    console.error('[/api/addons/[id]] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — remove an add-on
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await connectDB()

    const addOn = await AddOn.findByIdAndDelete(params.id)
    if (!addOn) return NextResponse.json({ error: 'Add-on not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/addons/[id]] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
