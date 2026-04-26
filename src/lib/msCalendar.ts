/**
 * Microsoft Graph API calendar utilities.
 * Syncs calendar events to the company's shared Outlook calendar using client credentials.
 * Requires: MICROSOFT_CLIENT_ID, MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_SECRET, COMPANY_MAILBOX
 */

const TIMEZONE = 'America/New_York'

async function getMsGraphToken(): Promise<string | null> {
  const tenantId = process.env.MICROSOFT_TENANT_ID
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET

  if (!tenantId || !clientId || !clientSecret) return null

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
  })

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token ?? null
  } catch {
    return null
  }
}

export interface OutlookEventPayload {
  title: string
  start: string
  end: string
  location?: string
  notes?: string
  type?: string
}

function buildOutlookBody(event: OutlookEventPayload) {
  const subject = event.type ? `[${event.type}] ${event.title}` : event.title
  return {
    subject,
    body: {
      contentType: 'Text',
      content: event.notes || '',
    },
    start: {
      dateTime: event.start,
      timeZone: TIMEZONE,
    },
    end: {
      dateTime: event.end,
      timeZone: TIMEZONE,
    },
    location: event.location ? { displayName: event.location } : undefined,
  }
}

export async function createOutlookEvent(event: OutlookEventPayload): Promise<string | null> {
  const mailbox = process.env.COMPANY_MAILBOX
  if (!mailbox) return null

  const token = await getMsGraphToken()
  if (!token) return null

  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/users/${mailbox}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildOutlookBody(event)),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      console.error('[msCalendar] createOutlookEvent failed:', res.status, err)
      return null
    }

    const data = await res.json()
    return data.id ?? null
  } catch (e) {
    console.error('[msCalendar] createOutlookEvent error:', e)
    return null
  }
}

export async function updateOutlookEvent(outlookEventId: string, event: Partial<OutlookEventPayload>): Promise<boolean> {
  const mailbox = process.env.COMPANY_MAILBOX
  if (!mailbox || !outlookEventId) return false

  const token = await getMsGraphToken()
  if (!token) return false

  const updates: Record<string, unknown> = {}
  if (event.title !== undefined || event.type !== undefined) {
    updates.subject = event.type ? `[${event.type}] ${event.title || ''}` : (event.title || '')
  }
  if (event.start !== undefined) updates.start = { dateTime: event.start, timeZone: TIMEZONE }
  if (event.end !== undefined) updates.end = { dateTime: event.end, timeZone: TIMEZONE }
  if (event.location !== undefined) updates.location = { displayName: event.location }
  if (event.notes !== undefined) updates.body = { contentType: 'Text', content: event.notes }

  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/users/${mailbox}/events/${outlookEventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      console.error('[msCalendar] updateOutlookEvent failed:', res.status, err)
      return false
    }
    return true
  } catch (e) {
    console.error('[msCalendar] updateOutlookEvent error:', e)
    return false
  }
}

export async function deleteOutlookEvent(outlookEventId: string): Promise<boolean> {
  const mailbox = process.env.COMPANY_MAILBOX
  if (!mailbox || !outlookEventId) return false

  const token = await getMsGraphToken()
  if (!token) return false

  try {
    const res = await fetch(`https://graph.microsoft.com/v1.0/users/${mailbox}/events/${outlookEventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok && res.status !== 404) {
      const err = await res.text().catch(() => '')
      console.error('[msCalendar] deleteOutlookEvent failed:', res.status, err)
      return false
    }
    return true
  } catch (e) {
    console.error('[msCalendar] deleteOutlookEvent error:', e)
    return false
  }
}

export function isMsCalendarConfigured(): boolean {
  return !!(
    process.env.MICROSOFT_CLIENT_ID &&
    process.env.MICROSOFT_TENANT_ID &&
    process.env.MICROSOFT_CLIENT_SECRET &&
    process.env.COMPANY_MAILBOX
  )
}
