import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Task from '@/lib/models/Task'
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

function toApiTask(doc: any) {
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    priority: doc.priority,
    status: doc.status,
    assignedTo: doc.assignedTo || [],
    assignedToNames: doc.assignedToNames || [],
    followUpDate: doc.followUpDate,
    dueDate: doc.dueDate,
    customerId: doc.customerId,
    customerName: doc.customerName,
    relatedTo: doc.relatedTo,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

// GET - Fetch single task by ID
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
      return NextResponse.json({ error: 'Invalid task id' }, { status: 400 })
    }

    const doc = await Task.findById(id).lean()
    if (!doc) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if user is assigned to this task or is admin/staff
    const isAssigned = doc.assignedTo?.includes(auth.userId)
    if (!isAssigned && (!auth.user || (auth.user.role !== 'ADMIN' && auth.user.role !== 'STAFF'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ task: toApiTask(doc) }, { status: 200 })
  } catch (error) {
    console.error('Task GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update task
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
      return NextResponse.json({ error: 'Invalid task id' }, { status: 400 })
    }

    const doc = await Task.findById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check permissions: assigned users can update status, admins/staff can update everything
    const isAssigned = doc.assignedTo?.includes(auth.userId)
    if (!isAssigned && (!auth.user || (auth.user.role !== 'ADMIN' && auth.user.role !== 'STAFF'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      priority,
      status,
      assignedTo,
      followUpDate,
      dueDate,
      customerId,
      customerName,
      relatedTo,
    } = body

    // Update fields
    if (title !== undefined) doc.title = title
    if (description !== undefined) doc.description = description
    if (priority !== undefined && auth.user && (auth.user.role === 'ADMIN' || auth.user.role === 'STAFF')) {
      doc.priority = priority
    }
    if (status !== undefined) doc.status = status // Assigned users can update status
    if (followUpDate !== undefined && auth.user && (auth.user.role === 'ADMIN' || auth.user.role === 'STAFF')) {
      doc.followUpDate = followUpDate ? new Date(followUpDate) : undefined
    }
    if (dueDate !== undefined && auth.user && (auth.user.role === 'ADMIN' || auth.user.role === 'STAFF')) {
      doc.dueDate = new Date(dueDate)
    }
    if (customerId !== undefined && auth.user && (auth.user.role === 'ADMIN' || auth.user.role === 'STAFF')) {
      doc.customerId = customerId
    }
    if (customerName !== undefined && auth.user && (auth.user.role === 'ADMIN' || auth.user.role === 'STAFF')) {
      doc.customerName = customerName
    }
    if (relatedTo !== undefined && auth.user && (auth.user.role === 'ADMIN' || auth.user.role === 'STAFF')) {
      doc.relatedTo = relatedTo
    }

    // Update assigned users (only admins/staff)
    if (assignedTo !== undefined && auth.user && (auth.user.role === 'ADMIN' || auth.user.role === 'STAFF')) {
      const assignedToArray = Array.isArray(assignedTo) ? assignedTo : assignedTo ? [assignedTo] : []
      doc.assignedTo = assignedToArray.length > 0 ? assignedToArray : [auth.userId]
      
      // Update assigned names
      const users = await User.find({ _id: { $in: doc.assignedTo } }).select('firstName lastName').lean()
      doc.assignedToNames = users.map((u: any) => `${u.firstName} ${u.lastName}`)
    }

    await doc.save()

    return NextResponse.json({ task: toApiTask(doc.toObject()) }, { status: 200 })
  } catch (error) {
    console.error('Task PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete tasks
    if (!auth.user || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden – only admins can delete tasks' }, { status: 403 })
    }

    await connectDB()

    const id = params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task id' }, { status: 400 })
    }

    const doc = await Task.findByIdAndDelete(id)
    if (!doc) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Task DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
