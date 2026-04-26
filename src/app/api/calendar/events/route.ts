import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import CalendarEvent from '@/lib/models/CalendarEvent'
import { verifyAuth } from '@/lib/auth'
import { hasPermission, canPerformActions } from '@/lib/permissions'
import type { User as UserType } from '@/types/database'
import { createOutlookEvent, isMsCalendarConfigured } from '@/lib/msCalendar'

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

function toApiEvent(doc: any) {
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    title: doc.title,
    start: doc.start,
    end: doc.end,
    type: doc.type,
    assignedTo: doc.assignedTo,
    status: doc.status,
    otherTypeName: doc.otherTypeName,
    customerId: doc.customerId,
    partnerId: doc.partnerId,
    location: doc.location,
    leadSource: doc.leadSource,
    referralName: doc.referralName,
    partnerReferralName: doc.partnerReferralName,
    sideMark: doc.sideMark,
    productsOfInterest: doc.productsOfInterest,
    numberOfWindows: doc.numberOfWindows,
    numberOfOpenings: doc.numberOfOpenings,
    isCompany: doc.isCompany,
    companyName: doc.companyName,
    website: doc.website,
    commuteTime: doc.commuteTime,
    notes: doc.notes,
    taxExempt: doc.taxExempt,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!hasPermission(auth.user, 'view_calendar')) {
      return NextResponse.json({ error: 'Forbidden – no calendar access' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const assignedTo = searchParams.get('assignedTo')
    const customerId = searchParams.get('customerId')
    const statusFilter = searchParams.get('status')

    const filter: Record<string, unknown> = {}
    if (start) filter.start = { $gte: start }
    if (end) filter.end = { $lte: end }
    if (assignedTo && assignedTo !== 'all') filter.assignedTo = assignedTo
    if (customerId) filter.customerId = customerId
    if (statusFilter) filter.status = statusFilter
    // STAFF (non-admin) see only their events
    if (auth.user && auth.user.role === 'STAFF') {
      filter.assignedTo = auth.userId
    }

    const docs = await CalendarEvent.find(filter).sort({ start: 1 }).lean()
    const events = docs.map(toApiEvent)
    return NextResponse.json({ events }, { status: 200 })
  } catch (error) {
    console.error('Calendar events GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!canPerformActions(auth.user, 'calendar')) {
      return NextResponse.json({ error: 'Forbidden – cannot create calendar events' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      start,
      end,
      type,
      assignedTo,
      status,
      otherTypeName,
      customerId,
      partnerId,
      location,
      leadSource,
      referralName,
      partnerReferralName,
      sideMark,
      productsOfInterest,
      numberOfWindows,
      numberOfOpenings,
      isCompany,
      companyName,
      website,
      commuteTime,
      notes,
      taxExempt,
    } = body

    if (!title || !start || !end || !type || !assignedTo) {
      return NextResponse.json(
        { error: 'Missing required fields: title, start, end, type, assignedTo' },
        { status: 400 }
      )
    }

    const doc = await CalendarEvent.create({
      title,
      start,
      end,
      type,
      assignedTo: assignedTo,
      status: status || 'Scheduled',
      otherTypeName,
      customerId,
      partnerId,
      location,
      leadSource,
      referralName,
      partnerReferralName,
      sideMark,
      productsOfInterest: Array.isArray(productsOfInterest) ? productsOfInterest : undefined,
      numberOfWindows,
      numberOfOpenings,
      isCompany,
      companyName,
      website,
      commuteTime,
      notes,
      taxExempt: taxExempt === true,
    })

    // Sync to Outlook calendar (non-blocking)
    if (isMsCalendarConfigured()) {
      createOutlookEvent({ title, start, end, location, notes, type })
        .then(async (outlookEventId) => {
          if (outlookEventId) {
            await CalendarEvent.findByIdAndUpdate(doc._id, { microsoftEventId: outlookEventId })
          }
        })
        .catch((err) => console.error('[calendar] Outlook sync failed:', err))
    }

    return NextResponse.json({ event: toApiEvent(doc) }, { status: 201 })
  } catch (error) {
    console.error('Calendar events POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
