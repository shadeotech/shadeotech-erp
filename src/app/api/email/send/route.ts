import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

const BRAND_HEADER = `
  <div style="background:#1e3a5f;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;">Shadeotech</h1>
  </div>
`

const BRAND_FOOTER = `
  <div style="background:#f3f4f6;padding:16px;border-radius:0 0 8px 8px;text-align:center;border:1px solid #e5e7eb;border-top:0;">
    <p style="margin:0;font-size:12px;color:#6b7280;">Shadeotech &mdash; Window Treatment Specialists</p>
    <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">concierge@shadeotech.com</p>
  </div>
`

function wrapInBrandTemplate(body: string): string {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:600px;margin:0 auto;padding:24px;">
${BRAND_HEADER}
<div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:0;">
${body.split('\n').filter(Boolean).map(line => `<p style="margin:0 0 12px;">${line}</p>`).join('\n')}
</div>
${BRAND_FOOTER}
</body></html>`
}

export async function POST(request: NextRequest) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { to, subject, message, attachments } = body

    if (!to || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, message' }, { status: 400 })
    }

    const html = wrapInBrandTemplate(message)
    const sent = await sendEmail({ to, subject, html, attachments })

    if (!sent) {
      return NextResponse.json({ error: 'Failed to send email. Check Microsoft Graph configuration.' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[email/send] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
