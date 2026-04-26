import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { verifyAuth } from '@/lib/auth'

export const runtime = 'nodejs'

function isE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone)
}

export async function POST(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and staff can send SMS
    if (authPayload.role !== 'ADMIN' && authPayload.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const accountSid = process.env.Account_SID || process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.Auth_Token || process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.Phone_Number || process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { error: 'Twilio is not configured (Account_SID, Auth_Token, Phone_Number)' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const to = String(body?.to || '').trim()
    const message = String(body?.body || '').trim()

    if (!to || !isE164(to)) {
      return NextResponse.json({ error: 'Invalid destination phone number' }, { status: 400 })
    }
    if (!message) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
    }
    if (message.length > 1600) {
      return NextResponse.json({ error: 'Message is too long' }, { status: 400 })
    }

    const client = twilio(accountSid, authToken)
    const result = await client.messages.create({
      from: fromNumber,
      to,
      body: message,
    })

    return NextResponse.json(
      {
        success: true,
        sid: result.sid,
        status: result.status,
        to: result.to,
        from: result.from,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Twilio SMS error:', error)
    // Surface the actual Twilio error message so the UI can display it
    const twilioMessage = error?.message || error?.toString() || 'Internal server error'
    const statusCode = error?.status || 500
    return NextResponse.json({ error: twilioMessage }, { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 })
  }
}

