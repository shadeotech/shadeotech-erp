import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Referral from '@/lib/models/Referral'
import User from '@/lib/models/User'
import Customer from '@/lib/models/Customer'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN' && auth.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : 50

  const referrals = await Referral.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  const enriched = await Promise.all(
    referrals.map(async (r) => {
      const user = await User.findById(r.referrerId).select('email firstName lastName').lean() as any
      let referrerName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : 'Unknown'
      let referrerCustomerId: string | null = null
      if (user?.email) {
        const customer = await Customer.findOne({ email: user.email.toLowerCase().trim() }).select('_id firstName lastName').lean() as any
        if (customer) {
          referrerCustomerId = customer._id.toString()
          referrerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || referrerName
        }
      }
      return {
        id: (r._id as any).toString(),
        referredName: r.referredName,
        referredEmail: r.referredEmail,
        referredPhone: r.referredPhone,
        status: r.status,
        pointsAwarded: r.pointsAwarded,
        purchasedAt: r.purchasedAt,
        createdAt: r.createdAt,
        referrerName,
        referrerCustomerId,
        referrerEmail: user?.email ?? null,
      }
    })
  )

  return NextResponse.json({ referrals: enriched })
}
