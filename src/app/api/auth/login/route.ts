import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        { error: 'Email does not exist' },
        { status: 401 }
      );
    }

    // Check if user is active (pending approval for new signups)
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account is pending approval. Please contact an administrator.' },
        { status: 401 }
      );
    }

    // Check if user has a password (should always exist, but TypeScript safety check)
    if (!user.password) {
      return NextResponse.json(
        { error: 'Account configuration error' },
        { status: 500 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Wrong password' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Convert permissions Map to object if it exists
    let permissionsObj: Record<string, string> = {};
    const userObj = user.toObject();
    if (userObj.permissions) {
      if (userObj.permissions instanceof Map) {
        userObj.permissions.forEach((value: string, key: string) => {
          permissionsObj[key] = value;
        });
      } else if (typeof userObj.permissions === 'object' && !Array.isArray(userObj.permissions)) {
        // Mongoose may return it as a plain object
        permissionsObj = userObj.permissions;
      }
    }

    // Return user data (without password)
    const userData = {
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      permissions: permissionsObj,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        user: userData,
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
