import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import FabricGallery from '@/lib/models/FabricGallery'

// GET — return all product categories with their subcategories and collection counts
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()

  const fabrics = await FabricGallery.find().select('category subcategory collection pricingCollectionId').lean() as any[]

  // Build product summary: category → { subcategories, collections, fabricCount }
  const map: Record<string, { category: string; subcategories: Set<string>; collections: Set<string>; fabricCount: number }> = {}

  for (const f of fabrics) {
    if (!map[f.category]) {
      map[f.category] = { category: f.category, subcategories: new Set(), collections: new Set(), fabricCount: 0 }
    }
    if (f.subcategory) map[f.category].subcategories.add(f.subcategory)
    if (f.collection) map[f.category].collections.add(f.collection)
    map[f.category].fabricCount++
  }

  const products = Object.values(map)
    .sort((a, b) => a.category.localeCompare(b.category))
    .map((p) => ({
      category: p.category,
      isExterior: p.category.startsWith('Exterior'),
      subcategories: Array.from(p.subcategories).sort(),
      collections: Array.from(p.collections).sort(),
      fabricCount: p.fabricCount,
    }))

  return NextResponse.json(products)
}
