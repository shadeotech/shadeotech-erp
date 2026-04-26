import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export const runtime = 'nodejs'

function getTwilioAuthToken(): string | null {
  return process.env.Auth_Token || process.env.TWILIO_AUTH_TOKEN || null
}

function getTwilioFromNumber(): string | null {
  return process.env.Phone_Number || process.env.TWILIO_PHONE_NUMBER || null
}

function getPublicUrl(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto')
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  if (proto && host) {
    return `${proto}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`
  }
  return request.url
}

function isE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone)
}

export async function POST(request: NextRequest) {
  try {
    const authToken = getTwilioAuthToken()
    const fromNumber = getTwilioFromNumber()
    if (!authToken || !fromNumber) {
      return NextResponse.json(
        { error: 'Twilio is not configured (Auth_Token, Phone_Number)' },
        { status: 500 }
      )
    }

    const signature = request.headers.get('x-twilio-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing Twilio signature' }, { status: 403 })
    }

    const formData = await request.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      if (typeof value === 'string') params[key] = value
    })

    const url = getPublicUrl(request)
    const valid = twilio.validateRequest(authToken, signature, url, params)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid Twilio signature' }, { status: 403 })
    }

    const to = params.To || ''
    if (!to || !isE164(to)) {
      const vr = new twilio.twiml.VoiceResponse()
      vr.say('Invalid destination number.')
      vr.hangup()
      return new NextResponse(vr.toString(), {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    const vr = new twilio.twiml.VoiceResponse()
    const dial = vr.dial({ callerId: fromNumber })
    dial.number(to)

    return new NextResponse(vr.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('Twilio voice webhook error:', error)
    const vr = new twilio.twiml.VoiceResponse()
    vr.say('An error occurred.')
    vr.hangup()
    return new NextResponse(vr.toString(), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    })
  }
}

