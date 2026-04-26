import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Notification from '@/lib/models/Notification'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  await Notification.updateOne(
    { _id: params.id, userId: auth.userId },
    { read: true }
  )

  return NextResponse.json({ success: true })
}
