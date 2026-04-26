import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Message from '@/lib/models/Message'
import User from '@/lib/models/User'
import Customer from '@/lib/models/Customer'
import twilio from 'twilio'

export const runtime = 'nodejs'

async function resolveCustomer(customerId: string) {
  const user = await User.findById(customerId).select('firstName lastName phone mobile email').lean() as any
  if (user) {
    return {
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      phone: user.mobile || user.phone,
    }
  }
  const crm = await Customer.findById(customerId).select('firstName lastName companyName phone mobile').lean() as any
  if (crm) {
    return {
      name: [crm.firstName, crm.lastName].filter(Boolean).join(' ') || crm.companyName || 'Customer',
      phone: crm.mobile || crm.phone,
    }
  }
  return null
}

/** GET /api/messages/[customerId] — full thread for one customer */
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  // Customers can only see their own thread
  if (auth.role === 'CUSTOMER' && auth.userId !== params.customerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (auth.role !== 'ADMIN' && auth.role !== 'STAFF' && auth.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const messages = await Message.find({ customerId: params.customerId })
    .sort({ createdAt: 1 })
    .lean()

  // Mark inbound messages as read
  if (auth.role === 'ADMIN' || auth.role === 'STAFF') {
    await Message.updateMany(
      { customerId: params.customerId, direction: 'inbound', read: false },
      { read: true }
    )
  }

  return NextResponse.json({
    messages: messages.map((m: any) => ({
      id: m._id.toString(),
      direction: m.direction,
      body: m.body,
      status: m.status,
      staffName: m.staffName,
      read: m.read,
      createdAt: m.createdAt,
    })),
  })
}

/** POST /api/messages/[customerId] — send an outbound SMS */
export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN' && auth.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const text = String(body.body || '').trim()
  if (!text) return NextResponse.json({ error: 'Message body is required' }, { status: 400 })

  await connectDB()

  const customer = await resolveCustomer(params.customerId)
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  if (!customer.phone) return NextResponse.json({ error: 'Customer has no phone number on file' }, { status: 400 })

  const accountSid = process.env.Account_SID || process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.Auth_Token || process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.Phone_Number || process.env.TWILIO_PHONE_NUMBER

  let twilioSid: string | undefined
  let status = 'sent'

  if (accountSid && authToken && fromNumber) {
    try {
      const client = twilio(accountSid, authToken)
      const result = await client.messages.create({ from: fromNumber, to: customer.phone, body: text })
      twilioSid = result.sid
      status = result.status
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Twilio error' }, { status: 500 })
    }
  }

  // Get sender's name
  const sender = await User.findById(auth.userId).select('firstName lastName').lean() as any
  const staffName = sender ? [sender.firstName, sender.lastName].filter(Boolean).join(' ') : 'Staff'

  const msg = await Message.create({
    customerId: params.customerId,
    customerPhone: customer.phone,
    customerName: customer.name,
    direction: 'outbound',
    body: text,
    twilioSid,
    status,
    staffId: auth.userId,
    staffName,
    read: true,
  })

  return NextResponse.json({
    message: {
      id: msg._id.toString(),
      direction: msg.direction,
      body: msg.body,
      status: msg.status,
      staffName: msg.staffName,
      read: msg.read,
      createdAt: msg.createdAt,
    },
  }, { status: 201 })
}
