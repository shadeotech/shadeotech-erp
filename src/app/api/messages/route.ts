import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Message from '@/lib/models/Message'

/** GET /api/messages — returns conversation list (one entry per customer) */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN' && auth.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  const conversations = await Message.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$customerId',
        customerName: { $first: '$customerName' },
        customerPhone: { $first: '$customerPhone' },
        lastMessage: { $first: '$body' },
        lastMessageAt: { $first: '$createdAt' },
        lastDirection: { $first: '$direction' },
        unreadCount: {
          $sum: { $cond: [{ $and: [{ $eq: ['$direction', 'inbound'] }, { $eq: ['$read', false] }] }, 1, 0] },
        },
      },
    },
    { $sort: { lastMessageAt: -1 } },
  ])

  const totalUnread = conversations.reduce((sum: number, c: any) => sum + c.unreadCount, 0)

  return NextResponse.json({
    conversations: conversations.map((c: any) => ({
      customerId: c._id,
      customerName: c.customerName,
      customerPhone: c.customerPhone,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      lastDirection: c.lastDirection,
      unreadCount: c.unreadCount,
    })),
    totalUnread,
  })
}
