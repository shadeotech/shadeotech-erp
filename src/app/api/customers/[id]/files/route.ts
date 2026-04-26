import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Customer from '@/lib/models/Customer'
import { verifyAuth } from '@/lib/auth'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'

// POST /api/customers/[id]/files — upload a file and attach it to the customer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN' && auth.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string) || 'other'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const validCategories = ['tax_exemption', 'other']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    await connectDB()
    const customer = await Customer.findById(id)
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await uploadToCloudinary(buffer, 'customer-files', 'raw')

    const newFile = {
      name: file.name,
      url: result.secure_url,
      publicId: result.public_id,
      category,
      uploadedAt: new Date(),
      uploadedBy: auth.userId,
    }

    if (!customer.files) customer.files = []
    customer.files.push(newFile as any)
    await customer.save()

    const saved = customer.files[customer.files.length - 1] as any
    return NextResponse.json({
      file: {
        _id: saved._id?.toString(),
        name: saved.name,
        url: saved.url,
        publicId: saved.publicId,
        category: saved.category,
        uploadedAt: saved.uploadedAt,
        uploadedBy: saved.uploadedBy,
      },
    }, { status: 201 })
  } catch (err: any) {
    console.error('[customers/files POST]', err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}

// DELETE /api/customers/[id]/files?fileId=xxx — remove a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN' && auth.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('fileId')
  if (!fileId) return NextResponse.json({ error: 'fileId is required' }, { status: 400 })

  try {
    await connectDB()
    const customer = await Customer.findById(id)
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const fileEntry = (customer.files as any[])?.find(
      (f: any) => f._id?.toString() === fileId
    )
    if (!fileEntry) return NextResponse.json({ error: 'File not found' }, { status: 404 })

    // Delete from Cloudinary if we have a publicId
    if (fileEntry.publicId) {
      try {
        await deleteFromCloudinary(fileEntry.publicId)
      } catch {
        // Non-fatal: remove from DB even if Cloudinary delete fails
      }
    }

    customer.files = (customer.files as any[]).filter(
      (f: any) => f._id?.toString() !== fileId
    ) as any

    await customer.save()
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[customers/files DELETE]', err)
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 })
  }
}
