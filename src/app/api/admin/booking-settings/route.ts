import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import CompanySettings from '@/lib/models/CompanySettings'
import { verifyAuth } from '@/lib/auth'

async function getSettings() {
  await connectDB()
  const existing = await CompanySettings.findById('company').lean()
  if (existing) return existing
  return CompanySettings.create({ _id: 'company', companyAddress: '3235 Skylane Dr. Unit 111, Carrollton, TX 75006' })
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const settings = await getSettings()
    return NextResponse.json({
      bookingBuffer: settings.bookingBuffer ?? 2,
      bookingStartHour: settings.bookingStartHour ?? 10,
      bookingLastSlotHour: settings.bookingLastSlotHour ?? 15,
    })
  } catch (error) {
    console.error('GET /api/admin/booking-settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || auth.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { bookingBuffer, bookingStartHour, bookingLastSlotHour } = body

    await connectDB()
    await CompanySettings.findByIdAndUpdate(
      'company',
      {
        $set: {
          ...(bookingBuffer !== undefined && { bookingBuffer: Number(bookingBuffer) }),
          ...(bookingStartHour !== undefined && { bookingStartHour: Number(bookingStartHour) }),
          ...(bookingLastSlotHour !== undefined && { bookingLastSlotHour: Number(bookingLastSlotHour) }),
        },
      },
      { upsert: true }
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/admin/booking-settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
