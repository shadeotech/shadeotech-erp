import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { token, password } = await request.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  await connectDB()

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  })

  if (!user) {
    return NextResponse.json(
      { error: 'This reset link is invalid or has expired. Please request a new one.' },
      { status: 400 }
    )
  }

  const hashed = await hashPassword(password)

  await User.updateOne(
    { _id: user._id },
    { password: hashed, resetToken: null, resetTokenExpiry: null }
  )

  return NextResponse.json({ success: true })
}
