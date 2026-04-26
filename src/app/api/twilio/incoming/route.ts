import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Message from '@/lib/models/Message'
import User from '@/lib/models/User'
import Customer from '@/lib/models/Customer'
import { notifyAdmins } from '@/lib/notifications'

export const runtime = 'nodejs'

/** Twilio webhook — called when an inbound SMS is received */
export async function POST(request: NextRequest) {
  const body = await request.formData()
  const from = body.get('From') as string
  const msgBody = body.get('Body') as string
  const twilioSid = body.get('MessageSid') as string

  if (!from || !msgBody) {
    return new NextResponse('<Response/>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  await connectDB()

  // Normalize phone: strip non-digits for DB lookup, keep E164 for storage
  const normalizedPhone = from.replace(/\D/g, '')

  // Find the customer by phone (check User and Customer collections)
  let customerId = 'unknown'
  let customerName = from

  const userByPhone = await User.findOne({
    $or: [
      { phone: { $regex: normalizedPhone } },
      { mobile: { $regex: normalizedPhone } },
    ],
    role: 'CUSTOMER',
  }).select('_id firstName lastName email').lean() as any

  if (userByPhone) {
    customerId = userByPhone._id.toString()
    customerName = [userByPhone.firstName, userByPhone.lastName].filter(Boolean).join(' ') || userByPhone.email
  } else {
    const crmByPhone = await Customer.findOne({
      $or: [
        { phone: { $regex: normalizedPhone } },
        { mobile: { $regex: normalizedPhone } },
      ],
    }).select('_id firstName lastName companyName').lean() as any

    if (crmByPhone) {
      customerId = crmByPhone._id.toString()
      customerName = [crmByPhone.firstName, crmByPhone.lastName].filter(Boolean).join(' ') || crmByPhone.companyName || from
    }
  }

  await Message.create({
    customerId,
    customerPhone: from,
    customerName,
    direction: 'inbound',
    body: msgBody,
    twilioSid,
    status: 'received',
    read: false,
  })

  // Notify all admins of new inbound message
  notifyAdmins({
    type: 'info',
    title: 'New Message',
    message: `${customerName}: "${msgBody.slice(0, 80)}${msgBody.length > 80 ? '…' : ''}"`,
    link: customerId !== 'unknown' ? `/messages?customer=${customerId}` : '/messages',
  })

  // Return empty TwiML — no auto-reply
  return new NextResponse('<Response/>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}
