import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Workflow from '@/lib/models/Workflow'

const DEFAULTS = [
  {
    key: 'portal_invite',
    name: 'Portal Invite Sent',
    trigger: 'When a customer is invited to the portal',
    emailEnabled: true,
    emailTemplateKey: 'portal_invite',
    smsEnabled: false,
    smsBody: 'Hi {{customerName}}, your Shadeotech portal is ready. Login at {{loginUrl}}',
    enabled: true,
    delayMinutes: 0,
  },
  {
    key: 'forgot_password',
    name: 'Password Reset Request',
    trigger: 'When a user requests a password reset',
    emailEnabled: true,
    emailTemplateKey: 'forgot_password',
    smsEnabled: false,
    smsBody: '',
    enabled: true,
    delayMinutes: 0,
  },
  {
    key: 'quote_sent',
    name: 'Quote Sent to Customer',
    trigger: 'When a quote is emailed to the customer',
    emailEnabled: true,
    emailTemplateKey: 'quote_sent',
    smsEnabled: false,
    smsBody: 'Hi {{customerName}}, your Shadeotech quote {{quoteNumber}} for {{total}} is ready to review.',
    enabled: true,
    delayMinutes: 0,
  },
  {
    key: 'invoice_sent',
    name: 'Invoice Sent to Customer',
    trigger: 'When an invoice is emailed to the customer',
    emailEnabled: true,
    emailTemplateKey: 'invoice_sent',
    smsEnabled: false,
    smsBody: 'Hi {{customerName}}, invoice {{invoiceNumber}} for {{total}} is due {{dueDate}}.',
    enabled: true,
    delayMinutes: 0,
  },
  {
    key: 'staff_reset',
    name: 'Staff Password Reset',
    trigger: 'When a staff member requests a password reset',
    emailEnabled: true,
    emailTemplateKey: 'staff_reset',
    smsEnabled: false,
    smsBody: '',
    enabled: true,
    delayMinutes: 0,
  },
]

async function seedDefaults() {
  for (const def of DEFAULTS) {
    await Workflow.updateOne({ key: def.key }, { $setOnInsert: def }, { upsert: true })
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  await seedDefaults()
  const workflows = await Workflow.find().sort({ key: 1 }).lean()
  return NextResponse.json(workflows)
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { key, emailEnabled, smsEnabled, smsBody, enabled, delayMinutes } = await request.json()
  if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 })
  const updated = await Workflow.findOneAndUpdate(
    { key },
    { emailEnabled, smsEnabled, smsBody, enabled, delayMinutes },
    { new: true }
  ).lean()
  if (!updated) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { key, name, trigger, emailEnabled, emailTemplateKey, smsEnabled, smsBody, enabled, delayMinutes } = await request.json()
  if (!key?.trim() || !name?.trim()) {
    return NextResponse.json({ error: 'key and name are required' }, { status: 400 })
  }
  const existing = await Workflow.findOne({ key: key.trim() })
  if (existing) return NextResponse.json({ error: 'A workflow with this key already exists' }, { status: 409 })
  const created = await Workflow.create({
    key: key.trim(),
    name: name.trim(),
    trigger: trigger?.trim() || '',
    emailEnabled: emailEnabled ?? false,
    emailTemplateKey: emailTemplateKey?.trim() || '',
    smsEnabled: smsEnabled ?? false,
    smsBody: smsBody?.trim() || '',
    enabled: enabled ?? true,
    delayMinutes: delayMinutes ?? 0,
  })
  return NextResponse.json(created.toObject(), { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 })
  const isDefault = DEFAULTS.some(d => d.key === key)
  if (isDefault) return NextResponse.json({ error: 'Built-in workflows cannot be deleted' }, { status: 403 })
  await Workflow.deleteOne({ key })
  return NextResponse.json({ success: true })
}
