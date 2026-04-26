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
    const source = searchParams.get('source')
    const search = searchParams.get('search')

    const filter: Record<string, unknown> = {}

    // Role-based filtering
    if (auth.user && auth.user.role === 'CUSTOMER') {
      // Customers can only see their own tickets
      filter.customerId = auth.userId
      filter.source = 'SHADEOTECH_CUSTOMER'
    } else if (auth.user && (auth.user.role === 'DEALER' || auth.user.role === 'FRANCHISEE')) {
      // Dealers and franchisees see their own tickets
      filter.customerId = auth.userId
      filter.source = auth.user.role === 'DEALER' ? 'AT_SHADES' : 'AT_SHADES_FRANCHISEE'
    }
    // ADMIN and STAFF see all tickets (no filter)

    // Apply filters
    if (status && status !== 'all') {
      filter.status = status
    }
    if (priority && priority !== 'all') {
      filter.priority = priority
    }
    if (source && source !== 'all') {
      filter.source = source
    }

    // Text search
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ]
    }

    const docs = await Ticket.find(filter).sort({ createdAt: -1 }).lean()
    const tickets = docs.map(toApiTicket)
    return NextResponse.json({ tickets }, { status: 200 })
  } catch (error) {
    console.error('Tickets GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const body = await request.json()
    const { subject, description, priority, orderNumber, customerId: bodyCustomerId, customerName: bodyCustomerName } = body

    if (!subject || !description || !orderNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, description, orderNumber' },
        { status: 400 }
      )
    }

    // Determine source based on user role
    let source: 'SHADEOTECH_CUSTOMER' | 'AT_SHADES' | 'AT_SHADES_FRANCHISEE' = 'SHADEOTECH_CUSTOMER'
    if (auth.user && auth.user.role === 'DEALER') {
      source = 'AT_SHADES'
    } else if (auth.user && auth.user.role === 'FRANCHISEE') {
      source = 'AT_SHADES_FRANCHISEE'
    }

    // Use provided customer info (admin/staff creating on behalf of customer) or fall back to auth user
    const resolvedCustomerId = bodyCustomerId || auth.userId
    const resolvedCustomerName = bodyCustomerName || (auth.user ? `${auth.user.firstName} ${auth.user.lastName}` : '')

    // Generate unique ticket number
    const lastTicket = await Ticket.findOne().sort({ ticketNumber: -1 }).select('ticketNumber').lean()
    let ticketNumber = 'TKT-001'
    if (lastTicket?.ticketNumber) {
      const lastNum = parseInt(lastTicket.ticketNumber.replace('TKT-', ''))
      ticketNumber = `TKT-${String(lastNum + 1).padStart(3, '0')}`
    }

    const doc = await Ticket.create({
      ticketNumber,
      subject,
      description,
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      source,
      customerId: resolvedCustomerId,
      customerName: resolvedCustomerName,
      orderNumber: orderNumber.trim(),
    })

    return NextResponse.json({ ticket: toApiTicket(doc) }, { status: 201 })
  } catch (error) {
    console.error('Tickets POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
