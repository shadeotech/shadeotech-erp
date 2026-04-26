import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import ProductionSheet from '@/lib/models/ProductionSheet'
import { verifyAuth } from '@/lib/auth'
import User from '@/lib/models/User'
import mongoose from 'mongoose'

async function requireAdmin(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return null
  await connectDB()
  const user = await User.findById(auth.userId).select('role').lean()
  if (!user || user.role !== 'ADMIN') return null
  return auth
}

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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(_request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const user = await User.findById(auth.userId).select('role').lean()
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const sheet = await ProductionSheet.findById(params.id).lean()
    if (!sheet) return NextResponse.json({ error: 'Production sheet not found' }, { status: 404 })

    return NextResponse.json({ productionSheet: toApi(sheet) })
  } catch (error) {
    console.error('[/api/production-sheets/:id] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, productType, operation, columns, rows } = body

    const update: Record<string, unknown> = {}
    if (name !== undefined) update.name = String(name).trim()
    if (productType !== undefined) update.productType = String(productType).trim()
    if (operation !== undefined) update.operation = operation === 'MOTORIZED' ? 'MOTORIZED' : 'MANUAL'
    if (columns !== undefined) update.columns = Array.isArray(columns) ? columns : []
    if (rows !== undefined) update.rows = Array.isArray(rows) ? rows : []

    const sheet = await ProductionSheet.findByIdAndUpdate(
      params.id,
      { $set: update },
      { new: true }
    ).lean()

    if (!sheet) return NextResponse.json({ error: 'Production sheet not found' }, { status: 404 })

    return NextResponse.json({ productionSheet: toApi(sheet) })
  } catch (error) {
    console.error('[/api/production-sheets/:id] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin(_request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const sheet = await ProductionSheet.findByIdAndDelete(params.id)
    if (!sheet) return NextResponse.json({ error: 'Production sheet not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/production-sheets/:id] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
