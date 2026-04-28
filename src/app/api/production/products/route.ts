import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Product from '@/lib/models/Product'
import FabricGallery from '@/lib/models/FabricGallery'

async function seedFromFabricGallery() {
  const fabrics = await FabricGallery.find({}).select('category subcategory collection').lean() as any[]
  const productMap = new Map<string, Map<string, Set<string>>>()

  for (const f of fabrics) {
    if (!f.category) continue
    if (!productMap.has(f.category)) productMap.set(f.category, new Map())
    const catMap = productMap.get(f.category)!
    const sub = f.subcategory || ''
    if (!catMap.has(sub)) catMap.set(sub, new Set())
    if (f.collection) catMap.get(sub)!.add(f.collection)
  }

  const productEntries = Array.from(productMap.entries())
  for (let i = 0; i < productEntries.length; i++) {
    const [productName, catMap] = productEntries[i]
    const isExterior = productName.startsWith('Exterior')
    const categories = Array.from(catMap.entries()).map(([catName, colSet], catIdx) => ({
      name: catName,
      visibleInQuote: true,
      sortOrder: catIdx,
      collections: Array.from(colSet).map((colName, colIdx) => ({ name: colName, sortOrder: colIdx })),
    }))
    await Product.findOneAndUpdate(
      { name: productName },
      { $setOnInsert: { name: productName, type: isExterior ? 'exterior' : 'interior', visibleInQuote: true, sortOrder: i, categories } },
      { upsert: true }
    )
  }
}

function toApi(p: any, countMap: Record<string, number>) {
  return {
    _id: p._id.toString(),
    name: p.name,
    type: p.type,
    visibleInQuote: p.visibleInQuote,
    sortOrder: p.sortOrder,
    fabricCount: countMap[p.name] ?? 0,
    categories: (p.categories || []).map((c: any) => ({
      _id: c._id.toString(),
      name: c.name,
      visibleInQuote: c.visibleInQuote,
      sortOrder: c.sortOrder,
      collections: (c.collections || []).map((col: any) => ({
        _id: col._id.toString(),
        name: col.name,
        sortOrder: col.sortOrder,
      })),
    })),
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const count = await Product.countDocuments()
  if (count === 0) await seedFromFabricGallery()

  const products = await Product.find({}).sort({ sortOrder: 1, name: 1 }).lean()

  const fabricCounts = await FabricGallery.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ])
  const countMap: Record<string, number> = {}
  for (const fc of fabricCounts) countMap[fc._id] = fc.count

  return NextResponse.json(products.map((p) => toApi(p, countMap)))
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await connectDB()

  const { name, type } = await request.json()
  if (!name?.trim() || !type) return NextResponse.json({ error: 'name and type required' }, { status: 400 })

  const existing = await Product.findOne({ name: name.trim() })
  if (existing) return NextResponse.json({ error: 'A product with that name already exists' }, { status: 409 })

  const sortOrder = await Product.countDocuments()
  const product = await Product.create({ name: name.trim(), type, visibleInQuote: true, sortOrder, categories: [] })
  return NextResponse.json({ product: toApi(product.toObject(), {}) }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await connectDB()

  const body = await request.json()
  const { action, productId } = body
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

  const product = await Product.findById(productId)
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  switch (action) {
    case 'rename': {
      const trimmed = (body.name || '').trim()
      if (!trimmed) return NextResponse.json({ error: 'Name required' }, { status: 400 })
      const conflict = await Product.findOne({ name: trimmed, _id: { $ne: productId } })
      if (conflict) return NextResponse.json({ error: 'Name already in use' }, { status: 409 })
      product.name = trimmed
      break
    }
    case 'toggleVisibility':
      product.visibleInQuote = !!body.visibleInQuote
      break
    case 'addCategory': {
      const name = (body.name || '').trim()
      if (!name) return NextResponse.json({ error: 'Category name required' }, { status: 400 })
      const sortOrder = product.categories.length
      product.categories.push({ name, visibleInQuote: true, sortOrder, collections: [] } as any)
      break
    }
    case 'renameCategory': {
      const cat = product.categories.find((c) => c._id.toString() === body.catId)
      if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      const name = (body.name || '').trim()
      if (!name) return NextResponse.json({ error: 'Category name required' }, { status: 400 })
      cat.name = name
      break
    }
    case 'toggleCategoryVisibility': {
      const cat = product.categories.find((c) => c._id.toString() === body.catId)
      if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      cat.visibleInQuote = !!body.visibleInQuote
      break
    }
    case 'deleteCategory': {
      const idx = product.categories.findIndex((c) => c._id.toString() === body.catId)
      if (idx !== -1) product.categories.splice(idx, 1)
      break
    }
    case 'addCollection': {
      const cat = product.categories.find((c) => c._id.toString() === body.catId)
      if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      const name = (body.name || '').trim()
      if (!name) return NextResponse.json({ error: 'Collection name required' }, { status: 400 })
      const sortOrder = cat.collections.length
      cat.collections.push({ name, sortOrder } as any)
      break
    }
    case 'deleteCollection': {
      const cat = product.categories.find((c) => c._id.toString() === body.catId)
      if (cat) {
        const colIdx = cat.collections.findIndex((col) => col._id.toString() === body.colId)
        if (colIdx !== -1) cat.collections.splice(colIdx, 1)
      }
      break
    }
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  await product.save()

  const fabricCounts = await FabricGallery.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ])
  const countMap: Record<string, number> = {}
  for (const fc of fabricCounts) countMap[fc._id] = fc.count

  return NextResponse.json({ product: toApi(product.toObject(), countMap) })
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await connectDB()

  const productId = request.nextUrl.searchParams.get('productId')
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

  await Product.findByIdAndDelete(productId)
  return NextResponse.json({ success: true })
}
