import { connectDB } from '@/lib/mongodb'
import Notification from '@/lib/models/Notification'
import User from '@/lib/models/User'

interface CreateNotificationParams {
  userId: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  link?: string
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await connectDB()
    await Notification.create(params)
  } catch (err) {
    console.error('[notifications] Failed to create notification:', err)
  }
}

/** Notify all ADMIN users */
export async function notifyAdmins(params: Omit<CreateNotificationParams, 'userId'>) {
  try {
    await connectDB()
    const admins = await User.find({ role: 'ADMIN', isActive: true }).select('_id').lean()
    if (admins.length === 0) return
    await Notification.insertMany(
      admins.map((a: any) => ({ ...params, userId: a._id.toString() }))
    )
  } catch (err) {
    console.error('[notifications] Failed to notify admins:', err)
  }
}
