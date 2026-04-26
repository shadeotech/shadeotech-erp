import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Customer from '@/lib/models/Customer'
import User from '@/lib/models/User'
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

  const customer = await Customer.findById(params.id).select('email').lean() as any
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const email = customer.email?.toLowerCase().trim()
  if (!email) return NextResponse.json({ referrals: [] })

  const portalUser = await User.findOne({ email }).select('_id').lean() as any
  if (!portalUser) return NextResponse.json({ referrals: [] })

  const referrals = await Referral.find({ referrerId: portalUser._id.toString() })
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({
    referrals: referrals.map((r) => ({
      id: (r._id as any).toString(),
      referredName: r.referredName,
      referredEmail: r.referredEmail,
      referredPhone: r.referredPhone,
      status: r.status,
      pointsAwarded: r.pointsAwarded,
      purchasedAt: r.purchasedAt,
      createdAt: r.createdAt,
    })),
  })
}
