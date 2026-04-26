import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import ProductionOrder from '@/lib/models/ProductionOrder'
import { verifyAuth } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'
import type { User as UserType } from '@/types/database'
import mongoose from 'mongoose'

async function getAuthUser(request: NextRequest): Promise<{ user: UserType | null; userId: string } | null> {
  const authPayload = await verifyAuth(request)
  if (!authPayload) return null
  await connectDB()
  const raw = await User.findById(authPayload.userId).select('-password').lean()
  if (!raw) return null
  let permissionsObj: Record<string, string> = {}
  if (raw.permissions) {
    if (raw.permissions instanceof Map) {
      ;(raw.permissions as Map<string, string>).forEach((value: string, key: string) => {
        permissionsObj[key] = value
      })
    } else if (typeof raw.permissions === 'object' && !Array.isArray(raw.permissions)) {
      permissionsObj = raw.permissions as Record<string, string>
    }
  }
  const user: UserType = {
    _id: raw._id.toString(),
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    role: raw.role,
    isActive: raw.isActive,
    permissions: permissionsObj as Record<string, 'no' | 'read' | 'edit' | 'full'>,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
  return { user, userId: authPayload.userId }
}

// POST - Upload file to order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!auth.user || (auth.user.role !== 'ADMIN' && auth.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden – only admins and staff can upload files' }, { status: 403 })
    }

    const id = params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = (formData.get('category') as string) || 'jobsite'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'
    const resourceType = isPdf ? 'raw' : isImage ? 'image' : 'auto'

    const result = await uploadToCloudinary(
      buffer,
      `production-orders/${id}`,
      resourceType as 'raw' | 'image' | 'video' | 'auto'
    )

    await connectDB()
    const doc = await ProductionOrder.findById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    doc.images = doc.images || []
    doc.images.push({ url: result.secure_url, category })

    doc.activity = doc.activity || []
    const userName = auth.user ? `${auth.user.firstName} ${auth.user.lastName}` : auth.userId
    doc.activity.push({
      action: 'Uploaded file',
      user: auth.userId,
      userName,
      timestamp: new Date(),
      details: file.name,
    })

    await doc.save()

    return NextResponse.json({
      url: result.secure_url,
      fileName: file.name,
    }, { status: 201 })
  } catch (error) {
    console.error('Order upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
