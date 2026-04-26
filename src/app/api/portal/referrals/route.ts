import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Referral from '@/lib/models/Referral'
import Customer from '@/lib/models/Customer'
import { notifyAdmins } from '@/lib/notifications'
import { logPortalActivity } from '@/lib/activityLogger'

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'CUSTOMER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()

  const referrals = await Referral.find({ referrerId: auth.userId }).sort({ createdAt: -1 }).lean()

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

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'CUSTOMER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()

  const body = await request.json()
  const { firstName, lastName, email, phone } = body

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const referredName = `${firstName.trim()} ${lastName.trim()}`
  const referredEmail = email.trim().toLowerCase()

  // Check for duplicate referral by same person
  const existing = await Referral.findOne({
    referrerId: auth.userId,
    referredEmail,
  }).lean()
  if (existing) {
    return NextResponse.json(
      { error: 'You have already referred someone with this email address.' },
      { status: 409 }
    )
  }

  const referral = await Referral.create({
    referrerId: auth.userId,
    referredName,
    referredEmail,
    referredPhone: phone.trim(),
    status: 'PENDING',
    pointsAwarded: false,
  })

  // Auto-create a lead in CRM for admin follow-up
  try {
    // Find the CRM Customer record for the referring portal user
    const portalUser = await import('@/lib/models/User').then(m => m.default.findById(auth.userId).select('email').lean()) as any
    const referrerCustomer = portalUser?.email
      ? await Customer.findOne({ email: portalUser.email.toLowerCase().trim() }).select('_id').lean() as any
      : null

    await Customer.create({
      sideMark: `REF-${Date.now()}`,
      customerType: 'RESIDENTIAL',
      status: 'LEAD',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: referredEmail,
      phone: phone.trim(),
      leadSource: 'REFERRAL',
      leadSourceDetail: `Referred by user ${auth.userId}`,
      referredById: referrerCustomer?._id ?? null,
    })
  } catch { /* silently fail — don't block the referral */ }

  // Log activity on customer CRM record
  logPortalActivity(auth.userId, `📋 Submitted a referral for ${referredName} (${referredEmail})`).catch(() => {})

  // Notify admins
  notifyAdmins({
    type: 'info',
    title: 'New customer referral',
    message: `A customer referred ${referredName} (${referredEmail}). Lead added to CRM.`,
    link: '/customers',
  }).catch(() => {})

  return NextResponse.json({
    referral: {
      id: (referral._id as any).toString(),
      referredName: referral.referredName,
      referredEmail: referral.referredEmail,
      referredPhone: referral.referredPhone,
      status: referral.status,
      pointsAwarded: referral.pointsAwarded,
      createdAt: referral.createdAt,
    },
  }, { status: 201 })
}
