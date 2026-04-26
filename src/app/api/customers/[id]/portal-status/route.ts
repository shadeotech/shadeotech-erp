import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Customer from '@/lib/models/Customer'
import User from '@/lib/models/User'
import PointsTransaction from '@/lib/models/PointsTransaction'
import Referral from '@/lib/models/Referral'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN' && auth.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  const customer = await Customer.findById(params.id).select('email firstName lastName').lean() as any
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const email = customer.email?.toLowerCase().trim()
  if (!email) {
    return NextResponse.json({ hasAccount: false, email: null })
  }

  const portalUser = await User.findOne({ email }).select('-password').lean() as any
  if (!portalUser) {
    return NextResponse.json({ hasAccount: false, email })
  }

  const userId = portalUser._id.toString()

  const [transactions, referrals] = await Promise.all([
    PointsTransaction.find({ userId, status: 'APPROVED' }).lean(),
    Referral.find({ referrerId: userId }).lean(),
  ])

  const pointsBalance = transactions.reduce((s, t) => s + t.amount, 0)

  return NextResponse.json({
    hasAccount: true,
    email,
    userId,
    isActive: portalUser.isActive,
    pointsBalance,
    totalReferrals: referrals.length,
    purchasedReferrals: referrals.filter((r) => r.status === 'PURCHASED').length,
  })
}
