import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'
import ProductImageModel from '@/lib/models/ProductImage'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const images = await ProductImageModel.find().lean()
  return NextResponse.json(images)
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

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
    // Delete old image from Cloudinary if one exists
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
