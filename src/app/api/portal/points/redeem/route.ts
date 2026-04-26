import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import PointsTransaction from '@/lib/models/PointsTransaction'

const REDEMPTION_COST = 200

const REWARDS: Record<string, string> = {
  MOTOR: 'Free motorization upgrade',
  REMOTE: 'Free remote control',
  SMART_HUB: 'Free smart hub',
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'CUSTOMER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()

  const body = await request.json()
  const { reward } = body

  if (!REWARDS[reward]) {
    return NextResponse.json({ error: 'Invalid reward' }, { status: 400 })
  }

  // Compute current approved balance
  const allTxns = await PointsTransaction.find({ userId: auth.userId, status: 'APPROVED' }).lean()
  const balance = allTxns.reduce((s, t) => s + t.amount, 0)

  if (balance < REDEMPTION_COST) {
    return NextResponse.json(
      { error: `You need ${REDEMPTION_COST} points to redeem. You have ${balance}.` },
      { status: 400 }
    )
  }

  const txn = await PointsTransaction.create({
    userId: auth.userId,
    type: 'REDEMPTION',
    amount: -REDEMPTION_COST,
    description: `Redeemed ${REDEMPTION_COST} pts for: ${REWARDS[reward]}`,
    redemptionReward: reward,
    status: 'APPROVED', // redemptions are auto-approved; admin is notified separately
  })

  const newBalance = balance - REDEMPTION_COST

  return NextResponse.json({
    newBalance,
    reward: REWARDS[reward],
    transaction: {
      id: (txn._id as any).toString(),
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      status: txn.status,
      redemptionReward: txn.redemptionReward,
      createdAt: txn.createdAt,
    },
  }, { status: 201 })
}
