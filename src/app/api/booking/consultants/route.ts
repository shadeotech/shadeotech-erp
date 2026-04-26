import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET() {
  try {
    await connectDB()

    const consultants = await User.find(
      { role: { $in: ['ADMIN', 'STAFF'] }, isActive: true },
      { firstName: 1, lastName: 1, role: 1 }
    )
      .sort({ firstName: 1 })
      .lean()

    const result = consultants.map((u) => ({
      id: u._id.toString(),
      name: `${u.firstName} ${u.lastName}`,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      // profileImage not stored in current User schema; keep undefined
      profileImage: undefined,
    }))

    return NextResponse.json({ consultants: result }, { status: 200 })
  } catch (error) {
    console.error('GET /api/booking/consultants error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
