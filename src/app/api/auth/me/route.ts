import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find user
    // Use .lean() to get plain object for easier Map handling
    const user = await User.findById(authPayload.userId)
      .select('-password')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Convert permissions Map to object if it exists
    // With .lean(), permissions come back as a plain object
    let permissionsObj: Record<string, string> = {};
    if (user.permissions) {
      if (user.permissions instanceof Map) {
        user.permissions.forEach((value: string, key: string) => {
          permissionsObj[key] = value;
        });
      } else if (typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
        // With .lean(), it's already a plain object
        permissionsObj = user.permissions;
      }
    }

    // Return user data (without password)
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
          role: user.role,
          isActive: user.isActive,
          permissions: permissionsObj,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
