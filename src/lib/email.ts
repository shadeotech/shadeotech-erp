/**
 * Email sending via Microsoft Graph API using client credentials.
 * Requires MICROSOFT_CLIENT_ID, MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_SECRET,
 * and COMPANY_MAILBOX environment variables.
 */

async function getMsGraphToken(): Promise<string | null> {
  const tenantId = process.env.MICROSOFT_TENANT_ID
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET

  if (!tenantId || !clientId || !clientSecret || clientSecret === 'YOUR_SECRET') {
    return null
  }

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

export interface EmailAttachment {
  name: string
  contentType: string
  contentBytes: string // base64, no data URI prefix
}

export interface EmailOptions {
  to: string
  cc?: string[]
  subject: string
  html: string
  text?: string
  attachments?: EmailAttachment[]
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const mailbox = process.env.COMPANY_MAILBOX
  if (!mailbox) {
    console.warn('[email] COMPANY_MAILBOX is not set. Skipping email.')
    return false
  }

  const token = await getMsGraphToken()
  if (!token) {
    console.warn('[email] Could not obtain Microsoft Graph token. Check MICROSOFT_CLIENT_SECRET env var.')
    return false
  }

  const payload = {
    message: {
      subject: options.subject,
      body: {
        contentType: 'HTML',
        content: options.html,
      },
      toRecipients: [
        { emailAddress: { address: options.to } },
      ],
      ...(options.cc?.length ? {
        ccRecipients: options.cc.map(addr => ({ emailAddress: { address: addr } })),
      } : {}),
      ...(options.attachments?.length ? {
        attachments: options.attachments.map((a) => ({
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: a.name,
          contentType: a.contentType,
          contentBytes: a.contentBytes,
        })),
      } : {}),
    },
    saveToSentItems: true,
  }

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${mailbox}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    console.error('[email] Graph sendMail failed:', res.status, err)
    return false
  }

  return true
}
