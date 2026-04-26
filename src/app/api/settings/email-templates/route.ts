import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import EmailTemplate from '@/lib/models/EmailTemplate'

const DEFAULTS = [
  {
    key: 'portal_invite',
    name: 'Portal Invite',
    subject: 'Your Shadeotech Customer Portal Access',
    variables: ['{{customerName}}', '{{email}}', '{{tempPassword}}', '{{loginUrl}}'],
    body: `<p style="font-size:15px;">Hi {{customerName}},</p>
<p>Your Shadeotech customer portal account is ready. Use the credentials below to log in and view your quotes, invoices, and project status.</p>
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:20px 0;">
  <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Login URL</p>
  <p style="margin:0 0 16px;font-weight:600;color:#111;">{{loginUrl}}</p>
  <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Email</p>
  <p style="margin:0 0 16px;font-weight:600;color:#111;">{{email}}</p>
  <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Temporary Password</p>
  <p style="margin:0;font-weight:700;font-size:18px;color:#c8864e;letter-spacing:1px;">{{tempPassword}}</p>
</div>
<p style="font-size:13px;color:#6b7280;">Please change your password after your first login.</p>`,
    enabled: true,
  },
  {
    key: 'forgot_password',
    name: 'Forgot Password',
    subject: 'Reset Your Shadeotech Portal Password',
    variables: ['{{firstName}}', '{{resetUrl}}'],
    body: `<p style="font-size:15px;">Hi {{firstName}},</p>
<p>We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.</p>
<div style="text-align:center;margin:28px 0;">
  <a href="{{resetUrl}}" style="background:#c8864e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;">Reset My Password</a>
</div>
<p style="font-size:13px;color:#6b7280;">If the button doesn't work, copy and paste this URL: <span style="color:#c8864e;word-break:break-all;">{{resetUrl}}</span></p>
<p style="font-size:13px;color:#6b7280;margin-top:16px;">If you didn't request a password reset, you can safely ignore this email.</p>`,
    enabled: true,
  },
  {
    key: 'quote_sent',
    name: 'Quote Sent',
    subject: 'Your Shadeotech Quote is Ready',
    variables: ['{{customerName}}', '{{quoteNumber}}', '{{total}}', '{{portalUrl}}'],
    body: `<p style="font-size:15px;">Hi {{customerName}},</p>
<p>Your quote <strong>{{quoteNumber}}</strong> for <strong>{{total}}</strong> is ready for your review.</p>
<div style="text-align:center;margin:28px 0;">
  <a href="{{portalUrl}}" style="background:#c8864e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;">View Quote</a>
</div>
<p style="font-size:13px;color:#6b7280;">Questions? Reply to this email or call us.</p>`,
    enabled: true,
  },
  {
    key: 'invoice_sent',
    name: 'Invoice Sent',
    subject: 'Your Shadeotech Invoice',
    variables: ['{{customerName}}', '{{invoiceNumber}}', '{{total}}', '{{dueDate}}'],
    body: `<p style="font-size:15px;">Hi {{customerName}},</p>
<p>Please find your invoice <strong>{{invoiceNumber}}</strong> for <strong>{{total}}</strong> attached to this email.</p>
<p>Payment is due by <strong>{{dueDate}}</strong>.</p>
<p style="font-size:13px;color:#6b7280;">Questions? Reply to this email or call us.</p>`,
    enabled: true,
  },
  {
    key: 'staff_reset',
    name: 'Staff Password Reset',
    subject: 'Reset Your Shadeotech Staff Password',
    variables: ['{{firstName}}', '{{resetUrl}}'],
    body: `<p style="font-size:15px;">Hi {{firstName}},</p>
<p>A password reset was requested for your staff account. Click the button below to set a new password. This link expires in 1 hour.</p>
<div style="text-align:center;margin:28px 0;">
  <a href="{{resetUrl}}" style="background:#c8864e;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;display:inline-block;">Reset Password</a>
</div>
<p style="font-size:13px;color:#6b7280;">If you didn't request this, ignore this email.</p>`,
    enabled: true,
  },
]

async function seedDefaults() {
  for (const def of DEFAULTS) {
    await EmailTemplate.updateOne({ key: def.key }, { $setOnInsert: def }, { upsert: true })
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  await seedDefaults()
  const templates = await EmailTemplate.find().sort({ key: 1 }).lean()
  return NextResponse.json(templates)
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { key, subject, body, enabled } = await request.json()
  if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 })
  const updated = await EmailTemplate.findOneAndUpdate(
    { key },
    { subject, body, enabled },
    { new: true }
  ).lean()
  if (!updated) return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  return NextResponse.json(updated)
}
