import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import FabricGallery from '@/lib/models/FabricGallery'
import { verifyAuth } from '@/lib/auth'

function toApi(doc: any) {
  const stockStatus = doc.stockStatus ?? (doc.inStock === false ? 'back_order' : 'in_stock')
  return {
    id: doc._id.toString(),
    category: doc.category ?? '',
    subcategory: doc.subcategory ?? '',
    mountType: doc.mountType,
    mountTypeStockStatus: doc.mountTypeStockStatus,
    opacity: doc.opacity,
    color: doc.color ?? '',
    collection: doc.collection ?? '',
    pricingCollectionId: doc.pricingCollectionId ?? '',
    imageFilename: doc.imageFilename ?? 'placeholder.jpg',
    imageUrl: doc.imageUrl ?? null,
    cloudinaryPublicId: doc.cloudinaryPublicId ?? null,
    width: doc.width,
    minWidth: doc.minWidth,
    maxWidth: doc.maxWidth,
    rollLength: doc.rollLength,
    fabricWidth: doc.fabricWidth ?? null,
    stockStatus,
    expectedArrival: doc.expectedArrival ?? null,
    inStock: stockStatus === 'in_stock',
    rollsAvailable: doc.rollsAvailable ?? 0,
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const id = params.id
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    await connectDB()

    const body = await request.json()
    const updates: Record<string, unknown> = {}
    if (body.category !== undefined) updates.category = String(body.category).trim()
    if (body.subcategory !== undefined) updates.subcategory = String(body.subcategory).trim()
    if (body.color !== undefined) updates.color = String(body.color).trim()
    if (body.collection !== undefined) updates.collection = body.collection ? String(body.collection).trim() : ''
    if (body.pricingCollectionId !== undefined) updates.pricingCollectionId = body.pricingCollectionId ? String(body.pricingCollectionId).trim() : ''
    if (body.opacity !== undefined) updates.opacity = body.opacity ? String(body.opacity).trim() : undefined
    if (body.width !== undefined) updates.width = body.width ? String(body.width).trim() : undefined
    if (body.minWidth !== undefined) updates.minWidth = body.minWidth ? String(body.minWidth).trim() : undefined
    if (body.maxWidth !== undefined) updates.maxWidth = body.maxWidth ? String(body.maxWidth).trim() : undefined
    if (body.rollLength !== undefined) updates.rollLength = body.rollLength ? String(body.rollLength).trim() : undefined
    if (body.fabricWidth !== undefined) updates.fabricWidth = body.fabricWidth !== null && body.fabricWidth !== '' ? Number(body.fabricWidth) : undefined
    if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : undefined
    if (body.cloudinaryPublicId !== undefined) updates.cloudinaryPublicId = body.cloudinaryPublicId ? String(body.cloudinaryPublicId).trim() : undefined
    if (body.imageFilename !== undefined) updates.imageFilename = body.imageFilename ? String(body.imageFilename).trim() : 'placeholder.jpg'
    if (body.stockStatus !== undefined) {
      updates.stockStatus = body.stockStatus
      updates.inStock = body.stockStatus === 'in_stock'
      updates.expectedArrival = body.stockStatus === 'back_order' && body.expectedArrival ? String(body.expectedArrival).trim() : undefined
    }
    if (body.rollsAvailable !== undefined) updates.rollsAvailable = Number(body.rollsAvailable) || 0

    const doc = await FabricGallery.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean()
    if (!doc) {
      return NextResponse.json({ error: 'Fabric not found' }, { status: 404 })
    }

    return NextResponse.json({ fabric: toApi(doc) })
  } catch (error) {
    console.error('[/api/fabric-gallery] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(_request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const id = params.id
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    await connectDB()

    const doc = await FabricGallery.findByIdAndDelete(id)
    if (!doc) {
      return NextResponse.json({ error: 'Fabric not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/fabric-gallery] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
