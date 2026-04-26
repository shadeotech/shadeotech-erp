import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Ticket from '@/lib/models/Ticket'
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

function toApiTicket(doc: any) {
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    ticketNumber: doc.ticketNumber,
    subject: doc.subject,
    description: doc.description,
    status: doc.status,
    priority: doc.priority,
    source: doc.source,
    customerId: doc.customerId,
    customerName: doc.customerName,
    assignedTo: doc.assignedTo,
    assignedToName: doc.assignedToName,
    orderNumber: doc.orderNumber,
    created: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    lastUpdate: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const id = params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ticket id' }, { status: 400 })
    }

    const doc = await Ticket.findById(id).lean()
    if (!doc) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check permissions: customers/dealers can only see their own tickets
    if (
      auth.user &&
      (auth.user.role === 'CUSTOMER' || auth.user.role === 'DEALER' || auth.user.role === 'FRANCHISEE') &&
      doc.customerId !== auth.userId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ ticket: toApiTicket(doc) }, { status: 200 })
  } catch (error) {
    console.error('Ticket GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const id = params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ticket id' }, { status: 400 })
    }

    const doc = await Ticket.findById(id).lean()
    if (!doc) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check permissions
    // Customers/dealers can only update their own tickets (limited fields)
    // Admins/staff can update any ticket
    if (
      auth.user &&
      (auth.user.role === 'CUSTOMER' || auth.user.role === 'DEALER' || auth.user.role === 'FRANCHISEE') &&
      doc.customerId !== auth.userId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const allowed = ['status', 'priority', 'assignedTo', 'assignedToName', 'subject', 'description', 'orderNumber']
    const updates: Record<string, unknown> = {}
    
    // Customers/dealers can only update description and subject
    if (auth.user && (auth.user.role === 'CUSTOMER' || auth.user.role === 'DEALER' || auth.user.role === 'FRANCHISEE')) {
      if (body.description !== undefined) updates.description = body.description
      if (body.subject !== undefined) updates.subject = body.subject
    } else {
      // Admins/staff can update all fields
      for (const key of allowed) {
        if (body[key] !== undefined) updates[key] = body[key]
      }
    }

    const updated = await Ticket.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean()

    if (!updated) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    return NextResponse.json({ ticket: toApiTicket(updated) }, { status: 200 })
  } catch (error) {
    console.error('Ticket PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete tickets
    if (!auth.user || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden – only admins can delete tickets' }, { status: 403 })
    }

    await connectDB()

    const id = params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ticket id' }, { status: 400 })
    }

    const doc = await Ticket.findByIdAndDelete(id)
    if (!doc) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Ticket DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
