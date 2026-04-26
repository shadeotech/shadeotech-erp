import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { verifyAuth } from '@/lib/auth'

export const runtime = 'nodejs'

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export async function POST(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountSid = process.env.Account_SID || process.env.TWILIO_ACCOUNT_SID
    if (!accountSid) {
      return NextResponse.json(
        { error: 'Twilio Account SID is not configured (Account_SID)' },
        { status: 500 }
      )
    }

    const apiKeySid = getRequiredEnv('TWILIO_API_KEY_SID')
    const apiKeySecret = getRequiredEnv('TWILIO_API_KEY_SECRET')
    const twimlAppSid = getRequiredEnv('TWILIO_TWIML_APP_SID')

    const identity = authPayload.userId
    const ttl = 60 * 60 // 1 hour

    const AccessToken = twilio.jwt.AccessToken
    const VoiceGrant = AccessToken.VoiceGrant

    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
      identity,
      ttl,
    })

    token.addGrant(
      new VoiceGrant({
        outgoingApplicationSid: twimlAppSid,
        incomingAllow: false,
      })
    )

    return NextResponse.json(
      {
        token: token.toJwt(),
        identity,
        expiresIn: ttl,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Twilio token error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

