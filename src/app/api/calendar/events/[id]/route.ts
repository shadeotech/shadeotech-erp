import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import CalendarEvent from '@/lib/models/CalendarEvent'
import { verifyAuth } from '@/lib/auth'
import { hasPermission, canPerformActions, canDelete } from '@/lib/permissions'
import type { User as UserType } from '@/types/database'
import mongoose from 'mongoose'
import { updateOutlookEvent, deleteOutlookEvent, isMsCalendarConfigured } from '@/lib/msCalendar'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!hasPermission(auth.user, 'view_calendar')) {
      return NextResponse.json({ error: 'Forbidden – no calendar access' }, { status: 403 })
    }

    const id = params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 })
    }

    const doc = await CalendarEvent.findById(id).lean()
    if (!doc) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    return NextResponse.json({ event: toApiEvent(doc) }, { status: 200 })
  } catch (error) {
    console.error('Calendar event GET error:', error)
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
    if (!canPerformActions(auth.user, 'calendar')) {
      return NextResponse.json({ error: 'Forbidden – cannot edit calendar events' }, { status: 403 })
    }

    const id = params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 })
    }

    const body = await request.json()
    const allowed = [
      'title', 'start', 'end', 'type', 'assignedTo', 'status', 'otherTypeName',
      'customerId', 'partnerId', 'location', 'leadSource', 'referralName',
      'partnerReferralName', 'sideMark', 'productsOfInterest', 'numberOfWindows',
      'numberOfOpenings', 'isCompany', 'companyName', 'website', 'commuteTime', 'notes',
      'taxExempt',
    ]
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    const doc = await CalendarEvent.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean()

    if (!doc) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Sync updates to Outlook (non-blocking)
    if (isMsCalendarConfigured() && (doc as any).microsoftEventId) {
      updateOutlookEvent((doc as any).microsoftEventId, {
        title: (doc as any).title,
        start: (doc as any).start,
        end: (doc as any).end,
        location: (doc as any).location,
        notes: (doc as any).notes,
        type: (doc as any).type,
      }).catch((err) => console.error('[calendar] Outlook update failed:', err))
    }

    return NextResponse.json({ event: toApiEvent(doc) }, { status: 200 })
  } catch (error) {
    console.error('Calendar event PATCH error:', error)
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
    if (!canDelete(auth.user, 'calendar')) {
      return NextResponse.json({ error: 'Forbidden – cannot delete calendar events' }, { status: 403 })
    }

    const id = params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 })
    }

    const doc = await CalendarEvent.findByIdAndDelete(id)
    if (!doc) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Remove from Outlook (non-blocking)
    if (isMsCalendarConfigured() && (doc as any).microsoftEventId) {
      deleteOutlookEvent((doc as any).microsoftEventId)
        .catch((err) => console.error('[calendar] Outlook delete failed:', err))
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Calendar event DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
