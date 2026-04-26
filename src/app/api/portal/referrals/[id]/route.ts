import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Referral from '@/lib/models/Referral'
import PointsTransaction from '@/lib/models/PointsTransaction'
import { logPortalActivity } from '@/lib/activityLogger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN' && auth.role !== 'STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  const body = await request.json()
  const { status } = body

  if (!['PENDING', 'CONTACTED', 'PURCHASED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const referral = await Referral.findById(params.id)
  if (!referral) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const prevStatus = referral.status
  referral.status = status

  // Award 200 points when transitioning to PURCHASED and not yet awarded
  if (status === 'PURCHASED' && prevStatus !== 'PURCHASED' && !referral.pointsAwarded) {
    const tx = await PointsTransaction.create({
      userId: referral.referrerId,
      type: 'REFERRAL_PURCHASE',
      amount: 200,
      status: 'APPROVED',
      description: `Referral purchased: ${referral.referredName}`,
      referralId: referral._id,
    })
    referral.pointsAwarded = true
    referral.pointsTransactionId = tx._id.toString()
    referral.purchasedAt = new Date()
  }

  await referral.save()

  // Log status change on referrer's CRM activity
  if (status === 'PURCHASED') {
    logPortalActivity(
      referral.referrerId.toString(),
      `🎉 Referral for ${referral.referredName} marked as Purchased — 200 pts awarded`
    ).catch(() => {})
  } else if (status === 'CONTACTED') {
    logPortalActivity(
      referral.referrerId.toString(),
      `📞 Referral for ${referral.referredName} marked as Contacted by admin`
    ).catch(() => {})
  }

  return NextResponse.json({ referral })
}
