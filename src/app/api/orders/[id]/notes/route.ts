import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import ProductionOrder from '@/lib/models/ProductionOrder'
import { verifyAuth } from '@/lib/auth'
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

// POST - Add a note to the order
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
      return NextResponse.json({ error: 'Forbidden – only admins and staff can add notes' }, { status: 403 })
    }

    await connectDB()

    const id = params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 })
    }

    const doc = await ProductionOrder.findById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    const userName = auth.user ? `${auth.user.firstName} ${auth.user.lastName}` : auth.userId

    doc.orderNotes = doc.orderNotes || []
    doc.orderNotes.push({
      content: content.trim(),
      createdBy: auth.userId,
      createdByName: userName,
      createdAt: new Date(),
    })

    doc.activity = doc.activity || []
    doc.activity.push({
      action: 'Added note',
      user: auth.userId,
      userName,
      timestamp: new Date(),
      details: content.trim().slice(0, 150),
    })

    await doc.save()

    const note = doc.orderNotes[doc.orderNotes.length - 1]
    return NextResponse.json({
      note: {
        _id: note._id?.toString(),
        content: note.content,
        createdBy: note.createdBy,
        createdByName: note.createdByName,
        createdAt: note.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Order notes POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
