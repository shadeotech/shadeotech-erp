import { connectDB } from '@/lib/mongodb'
import Note from '@/lib/models/Note'
import User from '@/lib/models/User'
import Customer from '@/lib/models/Customer'

/**
 * Creates a NOTE activity on the CRM customer record that matches the portal user's email.
 * Silent — never throws.
 */
export async function logPortalActivity(userId: string, content: string): Promise<void> {
  try {
    await connectDB()
    const user = await User.findById(userId).select('email').lean() as any
    if (!user?.email) return
    const customer = await Customer.findOne({ email: user.email.toLowerCase().trim() })
      .select('_id')
      .lean() as any
    if (!customer) return
    await Note.create({
      content,
      noteType: 'NOTE',
      customerId: customer._id.toString(),
      createdById: userId,
    })
  } catch {
    // silent — activity logging must never break the primary action
  }
}
