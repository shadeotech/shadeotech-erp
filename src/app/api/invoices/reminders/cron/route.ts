import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Invoice from '@/lib/models/Invoice'
import CompanySettings from '@/lib/models/CompanySettings'
import User from '@/lib/models/User'
import Customer from '@/lib/models/Customer'
import mongoose from 'mongoose'
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

// Called by Vercel Cron (add to vercel.json: { "crons": [{ "path": "/api/invoices/reminders/cron", "schedule": "0 9 * * *" }] })
// Also callable manually with Bearer token matching CRON_SECRET env var
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  // Accept either the Vercel cron header or an explicit secret
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const hasSecret = cronSecret && authHeader === `Bearer ${cronSecret}`
  if (!isVercelCron && !hasSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()

  // Load reminder config
  const settings = await CompanySettings.findById('company').lean()
  const cfg = (settings as any)?.invoiceReminderConfig ?? {}
  if (!cfg.enabled) {
    return NextResponse.json({ skipped: true, reason: 'Reminders disabled' })
  }

  const frequencyDays: number = cfg.frequencyDays ?? 3
  const maxReminders: number = cfg.maxReminders ?? 5
  const customSubject: string | undefined = cfg.emailSubject
  const customMessage: string | undefined = cfg.emailMessage

  const now = new Date()
  const cutoff = new Date(now.getTime() - frequencyDays * 86400_000)

  // Find all invoices that are unpaid, have a due date in the past, and not cancelled/paid
  const invoices = await Invoice.find({
    status: { $in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
    balanceAmount: { $gt: 0 },
    dueDate: { $lt: now },
  }).lean()

  const results: { invoiceNumber: string; action: string; sentTo?: string }[] = []

  for (const inv of invoices) {
    const reminderEntries = (inv.emailLog ?? []).filter((e: any) => e.type === 'reminder')
    if (reminderEntries.length >= maxReminders) {
      results.push({ invoiceNumber: inv.invoiceNumber, action: 'skipped_max' })
      continue
    }
    // Check time since last reminder (or since due date if no reminders yet)
    const lastReminderAt = reminderEntries.length > 0
      ? new Date(reminderEntries[reminderEntries.length - 1].sentAt)
      : new Date(inv.dueDate!)
    if (lastReminderAt > cutoff) {
      results.push({ invoiceNumber: inv.invoiceNumber, action: 'skipped_frequency' })
      continue
    }

    const recipientEmail = await getRecipientEmail(inv)
    const recipientName = (inv as any).dealerName || inv.customerName || 'Valued Customer'
    const invoiceNumber = inv.invoiceNumber
    const balanceStr = ((inv as any).balanceAmount ?? (inv as any).totalAmount ?? 0).toFixed(2)
    const dueDate = inv.dueDate
      ? new Date(inv.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A'

    const trackingId = generateTrackingId()
    const pixel = `<img src="${APP_URL}/api/invoices/track/${trackingId}" width="1" height="1" style="display:none;" alt="" />`

    const messageBody = customMessage
      ? `<p style="font-size:14px;">${customMessage}</p>`
      : `<p style="font-size:14px;">This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> has an outstanding balance of <strong style="color:#c8864e;">$${balanceStr}</strong>${dueDate !== 'N/A' ? ` which was due on <strong>${dueDate}</strong>` : ''}.</p>
<p style="font-size:13px;color:#6b7280;">Please arrange payment at your earliest convenience. If you have already sent payment, please disregard this notice.</p>`

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:560px;margin:0 auto;padding:0;">
<div style="background:linear-gradient(135deg,#111,#1a1a1a);padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
  <img src="${APP_URL}/images/logo.png" alt="Shadeotech" style="height:48px;object-fit:contain;margin-bottom:8px;" />
</div>
<div style="background:#fff8f0;padding:28px 24px;border:1px solid #fde3c6;border-top:none;border-radius:0 0 12px 12px;">
  <p style="font-size:15px;">Hi ${recipientName},</p>
  ${messageBody}
  <div style="text-align:center;margin:24px 0;">
    <a href="${APP_URL}/portal" style="background:#c8864e;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">View &amp; Pay Invoice</a>
  </div>
  <hr style="border:none;border-top:1px solid #fde3c6;margin:20px 0;" />
  <p style="color:#6b7280;font-size:12px;margin:0;">Shadeotech &bull; office@shadeotech.com</p>
</div>
${pixel}
</body></html>`

    // Push log entry and save
    await Invoice.findByIdAndUpdate(inv._id, {
      $push: {
        emailLog: {
          type: 'reminder',
          sentAt: now,
          trackingId,
          sentTo: recipientEmail ?? undefined,
          openCount: 0,
        },
      },
      $set: { status: 'OVERDUE' },
    })

    if (recipientEmail) {
      sendEmail({
        to: recipientEmail,
        subject: customSubject ?? `Payment Reminder – Invoice ${invoiceNumber}`,
        html,
      }).catch(err => console.error(`[cron/reminders] Email failed for ${invoiceNumber}:`, err))
    }

    results.push({ invoiceNumber, action: 'sent', sentTo: recipientEmail ?? undefined })
  }

  return NextResponse.json({ ran: true, processed: results.length, results })
}
