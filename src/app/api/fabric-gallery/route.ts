import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import FabricGallery from '@/lib/models/FabricGallery'
import { verifyAuth } from '@/lib/auth'
import { initialFabricData } from '@/constants/fabrics'

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

function toSeedDoc(item: (typeof initialFabricData)[0]) {
  return {
    category: item.category,
    subcategory: item.subcategory,
    mountType: item.mountType,
    mountTypeStockStatus: item.mountTypeStockStatus,
    opacity: item.opacity,
    color: item.color,
    collection: item.collection ?? '',
    pricingCollectionId: (item as any).pricingCollectionId ?? '',
    imageFilename: item.imageFilename ?? 'placeholder.jpg',
    width: item.width,
    minWidth: item.minWidth,
    maxWidth: item.maxWidth,
    rollLength: item.rollLength,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const reseed = request.nextUrl.searchParams.get('reseed') === 'true'
    if (reseed && auth.role === 'ADMIN') {
      // Upsert initial fabrics by color+category+collection — does not delete user-added fabrics
      for (const item of initialFabricData) {
        await FabricGallery.updateOne(
          { category: item.category, subcategory: item.subcategory, collection: item.collection ?? '', color: item.color },
          { $setOnInsert: toSeedDoc(item) },
          { upsert: true }
        )
      }
    }

    const filterQuery: Record<string, string> = {}
    const catParam = request.nextUrl.searchParams.get('category')
    const subParam = request.nextUrl.searchParams.get('subcategory')
    const colParam = request.nextUrl.searchParams.get('collection')
    if (catParam) filterQuery.category = catParam
    if (subParam) filterQuery.subcategory = subParam
    if (colParam !== null) filterQuery.collection = colParam

    const isFiltered = catParam || subParam || colParam !== null

    let items = await FabricGallery.find(isFiltered ? filterQuery : {}).sort({ createdAt: 1 }).lean()

    if (!isFiltered && items.length === 0) {
      await FabricGallery.insertMany(initialFabricData.map(toSeedDoc))
      items = await FabricGallery.find({}).sort({ createdAt: 1 }).lean()
    }

    return NextResponse.json({ fabrics: items.map(toApi) })
  } catch (error) {
    console.error('[/api/fabric-gallery] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await connectDB()

    const body = await request.json()
    const {
      category,
      subcategory,
      mountType,
      mountTypeStockStatus,
      opacity,
      color,
      collection,
      pricingCollectionId,
      imageFilename,
      imageUrl,
      cloudinaryPublicId,
      width,
      minWidth,
      maxWidth,
      rollLength,
      fabricWidth,
      stockStatus,
      expectedArrival,
    } = body

    if (!category || !subcategory || !color) {
      return NextResponse.json(
        { error: 'category, subcategory, and color are required' },
        { status: 400 }
      )
    }

    const doc = await FabricGallery.create({
      category: String(category).trim(),
      subcategory: String(subcategory).trim(),
      mountType: mountType ? String(mountType).trim() : undefined,
      mountTypeStockStatus: mountTypeStockStatus || undefined,
      opacity: opacity ? String(opacity).trim() : undefined,
      color: String(color).trim(),
      collection: collection ? String(collection).trim() : undefined,
      pricingCollectionId: pricingCollectionId ? String(pricingCollectionId).trim() : undefined,
      imageFilename: imageFilename ? String(imageFilename).trim() : 'white.jpg',
      imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
      cloudinaryPublicId: cloudinaryPublicId ? String(cloudinaryPublicId).trim() : undefined,
      width: width ? String(width).trim() : undefined,
      minWidth: minWidth ? String(minWidth).trim() : undefined,
      maxWidth: maxWidth ? String(maxWidth).trim() : undefined,
      rollLength: rollLength ? String(rollLength).trim() : undefined,
      fabricWidth: fabricWidth !== undefined && fabricWidth !== null && fabricWidth !== '' ? Number(fabricWidth) : undefined,
      stockStatus: stockStatus || 'in_stock',
      expectedArrival: stockStatus === 'back_order' && expectedArrival ? String(expectedArrival).trim() : undefined,
      inStock: !stockStatus || stockStatus === 'in_stock',
      rollsAvailable: body.rollsAvailable !== undefined ? Number(body.rollsAvailable) || 0 : 0,
    })

    return NextResponse.json({ fabric: toApi(doc.toObject()) }, { status: 201 })
  } catch (error) {
    console.error('[/api/fabric-gallery] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
