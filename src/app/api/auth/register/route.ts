import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyAuth, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN can create users
    if (authPayload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { firstName, lastName, email, password, role, phone } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['ADMIN', 'STAFF', 'DEALER', 'FRANCHISEE', 'CUSTOMER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      phone: phone ? String(phone).trim() : undefined,
      isActive: true,
      // Initialize empty permissions Map for STAFF users
      permissions: role === 'STAFF' ? new Map() : undefined,
    });

    await user.save();

    // Return user data (without password)
    const userObj = user.toObject();
    return NextResponse.json(
      {
        success: true,
        user: {
          _id: user._id.toString(),
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle duplicate email error
    if (error.code === 11000 || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
