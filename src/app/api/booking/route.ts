import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import CalendarEvent from '@/lib/models/CalendarEvent'
import User from '@/lib/models/User'

const SERVICE_TYPE_MAP: Record<string, string> = {
  'In-Home Consultation': 'CONSULTATION_IN_HOME',
  'Virtual Consultation': 'CONSULTATION_VIRTUAL',
  'Showroom Visit': 'CONSULTATION_SHOWROOM',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      staffId,
      date,
      time,
      name,
      email,
      phone,
      address,
      city,
      serviceType,
      products,       // string[]
      measurements,   // { room: string; width: string; height: string }[]
      requestedTime,  // string | null — client's requested time outside normal hours
      outsideRadius,  // boolean
      notes,
    } = body

    if (!date || (!time && !requestedTime) || !name || !email || !serviceType) {
      return NextResponse.json(
        { error: 'Missing required fields: date, time or requestedTime, name, email, serviceType' },
        { status: 400 }
      )
    }

    const eventType = SERVICE_TYPE_MAP[serviceType]
    if (!eventType) {
      return NextResponse.json({ error: `Unknown serviceType: ${serviceType}` }, { status: 400 })
    }

    await connectDB()

    // Resolve staffId: use provided value or auto-assign to first admin
    let resolvedStaffId = staffId && staffId !== 'any' ? staffId : null
    let staffName = 'Unassigned'

    if (resolvedStaffId) {
      const staffUser = await User.findById(resolvedStaffId).select('firstName lastName').lean()
      if (staffUser) {
        staffName = `${staffUser.firstName} ${staffUser.lastName}`
      } else {
        resolvedStaffId = null
      }
    }

    if (!resolvedStaffId) {
      const adminUser = await User.findOne({ role: 'ADMIN' }).select('_id firstName lastName').lean()
      if (adminUser) {
        resolvedStaffId = adminUser._id.toString()
        staffName = `${adminUser.firstName} ${adminUser.lastName}`
      }
    }

    // Use selected slot or placeholder for time-request bookings
    const slotTime = time || '10:00'
    const start = `${date}T${slotTime}:00`
    const [h, m] = slotTime.split(':').map(Number)
    const endH = String(h + 1).padStart(2, '0')
    const end = `${date}T${endH}:${String(m).padStart(2, '0')}:00`

    // Build structured notes
    const noteLines: string[] = [
      `Customer: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : '',
      address ? `Address: ${address}` : '',
      city ? `City: ${city}` : '',
      outsideRadius ? 'Outside 50-mile radius: Yes (measurements required)' : '',
      products?.length ? `Products of Interest: ${products.join(', ')}` : '',
      measurements?.length
        ? `Measurements:\n${measurements.map((m: { room: string; width: string; height: string }) => `  ${m.room}: ${m.width}" W × ${m.height}" H`).join('\n')}`
        : '',
      requestedTime ? `Requested Time: ${requestedTime} (outside normal hours)` : '',
      notes ? `Notes: ${notes}` : '',
    ].filter(Boolean)

    const locationString = [address, city].filter(Boolean).join(', ')

    const doc = await CalendarEvent.create({
      title: requestedTime
        ? `[PENDING TIME REQUEST] ${serviceType} – ${name}`
        : `${serviceType} – ${name}`,
      start,
      end,
      type: eventType,
      assignedTo: resolvedStaffId,
      status: 'Pending Approval',
      location: locationString || undefined,
      notes: noteLines.join('\n'),
      productsOfInterest: products || [],
      leadSource: 'OTHER_ORGANIC',
    })

    return NextResponse.json(
      {
        success: true,
        booking: {
          id: doc._id.toString(),
          date,
          time: time || requestedTime,
          staffName,
          serviceType,
          title: doc.title,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
