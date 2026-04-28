import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import Invoice from '@/lib/models/Invoice'
import User from '@/lib/models/User'
import Customer from '@/lib/models/Customer'
import { verifyAuth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://erpshadeotech.vercel.app'

function generateTrackingId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

async function getRecipientEmail(doc: any): Promise<string | null> {
  const lookupId = doc.dealerId || doc.customerId
  if (!lookupId || !mongoose.Types.ObjectId.isValid(lookupId)) return null
  const userDoc = await User.findById(lookupId).select('email').lean()
  if ((userDoc as any)?.email) return (userDoc as any).email
  const custDoc = await Customer.findById(lookupId).select('email').lean()
  return (custDoc as any)?.email ?? null
}

function buildInvoiceEmail(opts: {
  recipientName: string
  invoiceNumber: string
  totalAmount: string
  dueDate: string
  trackingId: string
}) {
  const pixel = `<img src="${APP_URL}/api/invoices/track/${opts.trackingId}" width="1" height="1" style="display:none;" alt="" />`
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:560px;margin:0 auto;padding:0;">
<div style="background:linear-gradient(135deg,#111,#1a1a1a);padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
  <img src="${APP_URL}/images/logo.png" alt="Shadeotech" style="height:48px;object-fit:contain;margin-bottom:8px;" />
</div>
<div style="background:#f9fafb;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
  <p style="font-size:15px;">Hi ${opts.recipientName},</p>
  <p>Your invoice is ready. Please find the details below.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr style="background:#f3f4f6;"><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Invoice Number</td><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;">${opts.invoiceNumber}</td></tr>
    <tr><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Amount Due</td><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;color:#c8864e;">$${opts.totalAmount}</td></tr>
    <tr style="background:#f3f4f6;"><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280;font-size:13px;">Due Date</td><td style="padding:8px 12px;border:1px solid #e5e7eb;">${opts.dueDate}</td></tr>
  </table>
  <p style="font-size:13px;">Please log in to your portal to view and pay this invoice. If you have any questions, please contact us.</p>
  <div style="text-align:center;margin:24px 0;">
    <a href="${APP_URL}/portal" style="background:#c8864e;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View &amp; Pay Invoice</a>
  </div>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
  <p style="color:#6b7280;font-size:12px;margin:0;">Shadeotech &bull; office@shadeotech.com</p>
</div>
${pixel}
</body></html>`
}

function buildReminderEmail(opts: {
  recipientName: string
  invoiceNumber: string
  balance: string
  dueDate: string
  reminderCount: number
  trackingId: string
  customMessage?: string
}) {
  const pixel = `<img src="${APP_URL}/api/invoices/track/${opts.trackingId}" width="1" height="1" style="display:none;" alt="" />`
  const body = opts.customMessage
    ? `<p style="font-size:14px;">${opts.customMessage}</p>`
    : `<p style="font-size:14px;">This is a friendly reminder that invoice <strong>${opts.invoiceNumber}</strong> has an outstanding balance of <strong style="color:#c8864e;">$${opts.balance}</strong>${opts.dueDate !== 'N/A' ? ` which was due on <strong>${opts.dueDate}</strong>` : ''}.</p>
<p style="font-size:13px;color:#6b7280;">Please arrange payment at your earliest convenience. If you have already sent payment, please disregard this notice.</p>`

  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:560px;margin:0 auto;padding:0;">
<div style="background:linear-gradient(135deg,#111,#1a1a1a);padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
  <img src="${APP_URL}/images/logo.png" alt="Shadeotech" style="height:48px;object-fit:contain;margin-bottom:8px;" />
</div>
<div style="background:#fff8f0;padding:28px 24px;border:1px solid #fde3c6;border-top:none;border-radius:0 0 12px 12px;">
  <p style="font-size:15px;">Hi ${opts.recipientName},</p>
  ${body}
  <div style="text-align:center;margin:24px 0;">
    <a href="${APP_URL}/portal" style="background:#c8864e;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View &amp; Pay Invoice</a>
  </div>
  <hr style="border:none;border-top:1px solid #fde3c6;margin:20px 0;" />
  <p style="color:#6b7280;font-size:12px;margin:0;">Shadeotech &bull; office@shadeotech.com</p>
</div>
${pixel}
</body></html>`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 })
    }

    await connectDB()
    const doc = await Invoice.findById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const body = await request.json()
    const type: 'invoice' | 'reminder' = body.type === 'reminder' ? 'reminder' : 'invoice'

    const recipientEmail = await getRecipientEmail(doc)
    const recipientName = doc.dealerName || doc.customerName || 'Valued Customer'
    const invoiceNumber = doc.invoiceNumber || ''
    const totalStr = (doc.totalAmount ?? 0).toFixed(2)
    const balanceStr = (doc.balanceAmount ?? doc.totalAmount ?? 0).toFixed(2)
    const dueDate = doc.dueDate
      ? new Date(doc.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A'

    // Create tracking entry
    const trackingId = generateTrackingId()
    const logEntry = {
      type,
      sentAt: new Date(),
      trackingId,
      sentTo: recipientEmail ?? undefined,
      openCount: 0,
    }
    doc.emailLog.push(logEntry as any)

    // Mark invoice as SENT on first invoice send
    if (type === 'invoice' && doc.status === 'DRAFT') {
      doc.status = 'SENT'
      doc.sentAt = new Date()
    }
    await doc.save()

    // Send email (non-blocking)
    if (recipientEmail) {
      const reminderCount = doc.emailLog.filter(e => e.type === 'reminder').length
      const html = type === 'invoice'
        ? buildInvoiceEmail({ recipientName, invoiceNumber, totalAmount: totalStr, dueDate, trackingId })
        : buildReminderEmail({
            recipientName,
            invoiceNumber,
            balance: balanceStr,
            dueDate,
            reminderCount,
            trackingId,
            customMessage: body.customMessage,
          })

      const cc = (doc.ccEmails ?? []).filter((e: string) => e && e !== recipientEmail)
      sendEmail({
        to: recipientEmail,
        ...(cc.length ? { cc } : {}),
        subject: type === 'invoice'
          ? `Invoice ${invoiceNumber} from Shadeotech`
          : `Payment Reminder – Invoice ${invoiceNumber}`,
        html,
      }).catch(err => console.error('[invoices/send] Email failed:', err))
    }

    const savedEntry = doc.emailLog[doc.emailLog.length - 1]
    return NextResponse.json({
      success: true,
      sent: !!recipientEmail,
      sentTo: recipientEmail ?? null,
      emailLogEntry: {
        _id: (savedEntry as any)._id?.toString(),
        type: savedEntry.type,
        sentAt: savedEntry.sentAt,
        trackingId: savedEntry.trackingId,
        sentTo: savedEntry.sentTo,
        openCount: savedEntry.openCount,
      },
    })
  } catch (error) {
    console.error('[invoices/send] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
