import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Customer from '@/lib/models/Customer'
import { hashPassword } from '@/lib/auth'

const SIDE_MARK_TYPE_CODES: Record<string, string> = {
  CUSTOMER: 'R',
  DEALER: 'P',
}

async function generateSideMark(role: string): Promise<string> {
  const typeCode = SIDE_MARK_TYPE_CODES[role] || 'R'
  const randomNum = Math.floor(10000 + Math.random() * 90000).toString()
  const sideMark = `SH${typeCode}-WI${randomNum}`
  const existing = await Customer.findOne({ sideMark }).lean()
  if (existing) return generateSideMark(role)
  return sideMark
}

/**
 * Public registration - allows unauthenticated users to create DEALER or CUSTOMER accounts only.
 * Admin/Staff registration remains via the protected /api/auth/register route.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { firstName, lastName, email, password, role } = await request.json()

    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return NextResponse.json(
        { error: 'First and last name must be at least 2 characters' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      )
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      )
    }

    if (role !== 'DEALER' && role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Invalid registration type. Must be Dealer or Customer.' },
        { status: 400 }
      )
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      isActive: false, // Pending admin approval before they can log in
    })

    await user.save()

    // Auto-create a matching Customer record so they appear in admin/customers
    try {
      const customerType = role === 'DEALER' ? 'PARTNER' : 'RESIDENTIAL'
      const sideMark = await generateSideMark(role)
      await Customer.create({
        sideMark,
        customerType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        leadSource: 'OTHER_ORGANIC',
        status: 'LEAD',
      })
    } catch {
      // Non-fatal: user account is created, customer record can be added manually
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration submitted. You will be able to log in after an administrator approves your account.',
        user: {
          _id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Public registration error:', error)
    if (error.code === 11000 || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
