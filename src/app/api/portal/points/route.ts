import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import PointsTransaction from '@/lib/models/PointsTransaction'
import User from '@/lib/models/User'
import { logPortalActivity } from '@/lib/activityLogger'

const EARN_RULES: Record<string, { amount: number; label: string }> = {
  GOOGLE_REVIEW: { amount: 30, label: 'Google review' },
  SOCIAL_FOLLOW: { amount: 10, label: 'Social media follow' },
}

function computeBalance(txns: any[]): number {
  return txns
    .filter((t) => t.status === 'APPROVED')
    .reduce((sum, t) => sum + t.amount, 0)
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'CUSTOMER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()

  const transactions = await PointsTransaction.find({ userId: auth.userId }).sort({ createdAt: -1 }).lean()
  const balance = computeBalance(transactions)

  return NextResponse.json({
    balance,
    transactions: transactions.map((t) => ({
      id: (t._id as any).toString(),
      type: t.type,
      amount: t.amount,
      description: t.description,
      status: t.status,
      redemptionReward: t.redemptionReward,
      createdAt: t.createdAt,
    })),
  })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'CUSTOMER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()

  const body = await request.json()
  const { type } = body

  const rule = EARN_RULES[type]
  if (!rule) {
    return NextResponse.json({ error: 'Invalid earn type' }, { status: 400 })
  }

  // One submission per type (prevent duplicate claims for review/follow)
  const existing = await PointsTransaction.findOne({
    userId: auth.userId,
    type,
    status: { $ne: 'REJECTED' },
  }).lean()
  if (existing) {
    return NextResponse.json(
      { error: `You have already submitted a ${rule.label} claim. It will be reviewed shortly.` },
      { status: 409 }
    )
  }

  const txn = await PointsTransaction.create({
    userId: auth.userId,
    type,
    amount: rule.amount,
    description: `Earned ${rule.amount} pts for ${rule.label}`,
    status: 'PENDING', // admin approves
  })

  // Log activity on CRM record
  logPortalActivity(auth.userId, `⭐ Claimed ${rule.amount} pts for ${rule.label} — pending admin approval`).catch(() => {})

  return NextResponse.json({
    transaction: {
      id: (txn._id as any).toString(),
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      status: txn.status,
      createdAt: txn.createdAt,
    },
  }, { status: 201 })
}
