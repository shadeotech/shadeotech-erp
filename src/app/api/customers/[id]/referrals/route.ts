import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Customer from '@/lib/models/Customer'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const referrals = await Customer.find({ referredById: new mongoose.Types.ObjectId(params.id) })
    .select('firstName lastName companyName email phone sideMark customerType status createdAt')
    .sort({ createdAt: -1 })
    .lean() as any[]

  return NextResponse.json({
    referrals: referrals.map((c) => ({
      id: c._id.toString(),
      name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.companyName || c.sideMark || 'Unknown',
      email: c.email,
      phone: c.phone,
      sideMark: c.sideMark,
      customerType: c.customerType,
      status: c.status,
      createdAt: c.createdAt,
    })),
  })
}
