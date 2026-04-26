import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Task from '@/lib/models/Task'
import { verifyAuth } from '@/lib/auth'
import type { User as UserType } from '@/types/database'

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

// GET - Fetch tasks
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo') // Filter by assigned user
    const myTasks = searchParams.get('myTasks') === 'true' // Only tasks assigned to current user
    const customerId = searchParams.get('customerId')

    // Build query
    const query: any = {}

    if (customerId) {
      query.customerId = customerId
    }

    // If myTasks is true, only show tasks assigned to current user
    if (myTasks) {
      query.assignedTo = { $in: [auth.userId] }
    } else if (assignedTo) {
      query.assignedTo = { $in: [assignedTo] }
    }

    // Filter out completed tasks by default for myTasks
    if (myTasks && !status) {
      query.status = { $ne: 'COMPLETED' }
    } else if (status && status !== 'all') {
      query.status = status
    }

    if (priority && priority !== 'all') {
      query.priority = priority
    }

    const tasks = await Task.find(query)
      .sort({ dueDate: 1, createdAt: -1 })
      .lean()

    return NextResponse.json({ tasks: tasks.map(toApiTask) }, { status: 200 })
  } catch (error) {
    console.error('Tasks GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new task
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and staff can create tasks
    if (!auth.user || (auth.user.role !== 'ADMIN' && auth.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden – only admins and staff can create tasks' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const {
      title,
      description,
      priority,
      assignedTo,
      followUpDate,
      dueDate,
      customerId,
      customerName,
      relatedTo,
    } = body

    if (!title || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields: title, dueDate' }, { status: 400 })
    }

    // Get assigned user names
    const assignedToArray = Array.isArray(assignedTo) ? assignedTo : assignedTo ? [assignedTo] : []
    const assignedToNames: string[] = []
    
    if (assignedToArray.length > 0) {
      const users = await User.find({ _id: { $in: assignedToArray } }).select('firstName lastName').lean()
      assignedToNames.push(...users.map((u: any) => `${u.firstName} ${u.lastName}`))
    }

    // If no assignees, assign to creator
    const finalAssignedTo = assignedToArray.length > 0 ? assignedToArray : [auth.userId]
    const finalAssignedToNames = assignedToNames.length > 0 
      ? assignedToNames 
      : [`${auth.user.firstName} ${auth.user.lastName}`]

    const doc = await Task.create({
      title,
      description,
      priority: priority || 'MEDIUM',
      status: 'TODO',
      assignedTo: finalAssignedTo,
      assignedToNames: finalAssignedToNames,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      dueDate: new Date(dueDate),
      customerId,
      customerName,
      relatedTo,
      createdBy: auth.userId,
    })

    return NextResponse.json({ task: toApiTask(doc) }, { status: 201 })
  } catch (error) {
    console.error('Tasks POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
