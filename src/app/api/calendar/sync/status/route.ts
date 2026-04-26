import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { isMsCalendarConfigured } from '@/lib/msCalendar'

export async function GET(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enabled = isMsCalendarConfigured()
    const calendarEmail = process.env.COMPANY_MAILBOX || ''

    return NextResponse.json({ enabled, calendarEmail }, { status: 200 })
  } catch (error) {
    console.error('[calendar/sync/status] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
