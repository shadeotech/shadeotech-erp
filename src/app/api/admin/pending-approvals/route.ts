import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import PointsTransaction from '@/lib/models/PointsTransaction'
import User from '@/lib/models/User'
import Customer from '@/lib/models/Customer'
import { logPortalActivity } from '@/lib/activityLogger'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN' && auth.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  const pending = await PointsTransaction.find({
    status: 'PENDING',
    type: { $in: ['GOOGLE_REVIEW', 'SOCIAL_FOLLOW'] },
  })
    .sort({ createdAt: -1 })
    .lean()

  // Enrich with user + customer name
  const enriched = await Promise.all(
    pending.map(async (t) => {
      const user = await User.findById(t.userId).select('email firstName lastName').lean() as any
      let customerName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : 'Unknown'
      let customerId: string | null = null
      if (user?.email) {
        const customer = await Customer.findOne({ email: user.email.toLowerCase().trim() }).select('_id firstName lastName').lean() as any
        if (customer) {
          customerId = customer._id.toString()
          customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customerName
        }
      }
      return {
        id: (t._id as any).toString(),
        userId: t.userId,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt,
        customerName,
        customerEmail: user?.email ?? null,
        customerId,
      }
    })
  )

  return NextResponse.json({ approvals: enriched })
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN' && auth.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  const body = await request.json()
  const { id, action } = body // action: 'approve' | 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const txn = await PointsTransaction.findById(id)
  if (!txn) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (txn.status !== 'PENDING') {
    return NextResponse.json({ error: 'Already processed' }, { status: 409 })
  }

  txn.status = action === 'approve' ? 'APPROVED' : 'REJECTED'
  await txn.save()

  const typeLabel = txn.type === 'GOOGLE_REVIEW' ? 'Google review' : 'social media follow'

  if (action === 'approve') {
    logPortalActivity(txn.userId, `✅ ${txn.amount} pts approved for ${typeLabel}`).catch(() => {})
  } else {
    logPortalActivity(txn.userId, `❌ Points claim for ${typeLabel} was rejected by admin`).catch(() => {})
  }

  return NextResponse.json({ id, status: txn.status })
}
