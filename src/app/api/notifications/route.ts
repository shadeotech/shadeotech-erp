import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Notification from '@/lib/models/Notification'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const notifications = await Notification.find({ userId: auth.userId })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean()

  const unreadCount = await Notification.countDocuments({ userId: auth.userId, read: false })

  return NextResponse.json({
    notifications: notifications.map((n: any) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      link: n.link,
      createdAt: n.createdAt,
    })),
    unreadCount,
  })
}

/** Mark all notifications as read */
export async function PATCH(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  await Notification.updateMany({ userId: auth.userId, read: false }, { read: true })

  return NextResponse.json({ success: true })
}
