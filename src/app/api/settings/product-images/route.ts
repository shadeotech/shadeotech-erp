import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'
import ProductImageModel from '@/lib/models/ProductImage'

const DEFAULT_COLLECTIONS = [
  { collectionId: 'duo_basic', name: 'Duo Basic', sortOrder: 0 },
  { collectionId: 'duo_light_filtering', name: 'Duo Light Filtering', sortOrder: 1 },
  { collectionId: 'duo_room_dimming', name: 'Duo Room Dimming', sortOrder: 2 },
  { collectionId: 'tri_light_filtering', name: 'Tri Light Filtering', sortOrder: 3 },
  { collectionId: 'tri_room_dimming', name: 'Tri Room Dimming', sortOrder: 4 },
  { collectionId: 'roller_room_darkening', name: 'Roller Room Darkening', sortOrder: 5 },
  { collectionId: 'roller_light_filtering', name: 'Roller Light Filtering', sortOrder: 6 },
  { collectionId: 'roller_room_darkening_y', name: 'Roller Room Darkening Y', sortOrder: 7 },
  { collectionId: 'roller_light_filtering_y', name: 'Roller Light Filtering Y', sortOrder: 8 },
  { collectionId: 'roller_sun_screen', name: 'Roller Sun Screen', sortOrder: 9 },
  { collectionId: 'room_darkening_sun_screen', name: 'Room Darkening Sun Screen', sortOrder: 10 },
  { collectionId: 'zip', name: 'Zip, Zip-track Full Box', sortOrder: 11 },
  { collectionId: 'wire_guide', name: 'Wire Guide', sortOrder: 12 },
  { collectionId: 'uni_shades', name: 'Uni Shades', sortOrder: 13 },
]

async function seedDefaults() {
  for (const col of DEFAULT_COLLECTIONS) {
    await ProductImageModel.updateOne(
      { collectionId: col.collectionId },
      { $setOnInsert: col },
      { upsert: true }
    )
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  await seedDefaults()
  const images = await ProductImageModel.find().sort({ sortOrder: 1, createdAt: 1 }).lean()
  return NextResponse.json(images)
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { collectionId, name } = await request.json()
  if (!collectionId) return NextResponse.json({ error: 'collectionId is required' }, { status: 400 })
  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  const updated = await ProductImageModel.findOneAndUpdate(
    { collectionId },
    { name: name.trim() },
    { new: true }
  ).lean()
  if (!updated) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const contentType = request.headers.get('content-type') || ''

  // JSON body: create a name-only product entry (no image yet)
  if (contentType.includes('application/json')) {
    const { collectionId, name } = await request.json()
    if (!collectionId?.trim()) return NextResponse.json({ error: 'collectionId is required' }, { status: 400 })
    if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })
    const existing = await ProductImageModel.findOne({ collectionId: collectionId.trim() })
    if (existing) return NextResponse.json({ error: 'A product with this ID already exists' }, { status: 409 })
    const maxOrder = await ProductImageModel.findOne().sort({ sortOrder: -1 }).lean()
    const sortOrder = maxOrder ? ((maxOrder as any).sortOrder ?? 0) + 1 : 100
    const doc = await ProductImageModel.create({ collectionId: collectionId.trim(), name: name.trim(), sortOrder })
    return NextResponse.json(doc.toObject(), { status: 201 })
  }

  // Multipart: upload image
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const collectionId = (formData.get('collectionId') as string)?.trim()
  const name = (formData.get('name') as string)?.trim()

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!collectionId) return NextResponse.json({ error: 'collectionId is required' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WEBP and GIF images are allowed' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 })
  }

  try {
    const existing = await ProductImageModel.findOne({ collectionId })
    if (existing?.publicId) {
      await deleteFromCloudinary(existing.publicId).catch(() => {})
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const result = await uploadToCloudinary(buffer, 'product-images', 'image')

    const doc = await ProductImageModel.findOneAndUpdate(
      { collectionId },
      { collectionId, name: name || collectionId, imageUrl: result.secure_url, publicId: result.public_id },
      { upsert: true, new: true }
    ).lean()

    return NextResponse.json(doc, { status: 201 })
  } catch (err: any) {
    console.error('[product-images POST]', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { searchParams } = new URL(request.url)
  const collectionId = searchParams.get('collectionId')
  if (!collectionId) return NextResponse.json({ error: 'collectionId is required' }, { status: 400 })

  const doc = await ProductImageModel.findOne({ collectionId })
  if (!doc) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  if (doc.publicId) await deleteFromCloudinary(doc.publicId).catch(() => {})
  await ProductImageModel.deleteOne({ collectionId })

  return NextResponse.json({ success: true })
}
