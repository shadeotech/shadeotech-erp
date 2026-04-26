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

    // Only ADMIN can view all users
    if (authPayload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url)
    const emailQuery = searchParams.get('email')

    // If email query provided, just check for portal account existence
    if (emailQuery) {
      const match = await User.findOne({ email: new RegExp(`^${emailQuery.trim()}$`, 'i'), role: 'CUSTOMER' }).select('_id email role').lean()
      return NextResponse.json({ hasPortalAccount: !!match, user: match ? { id: (match as any)._id.toString(), email: (match as any).email, role: (match as any).role } : null })
    }

    // Fetch all users, excluding passwords
    // Use .lean() to get plain objects, which helps with Map conversion
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Convert permissions Map to object if it exists
    // With .lean(), permissions come back as a plain object (Mongoose converts Map to object)
    const usersWithPermissions = users.map((user: any) => {
      let permissionsObj: Record<string, string> = {};
      
      // Handle permissions - with .lean(), it's already a plain object
      if (user.permissions) {
        if (user.permissions instanceof Map) {
          // If somehow it's still a Map, convert it
          user.permissions.forEach((value: string, key: string) => {
            permissionsObj[key] = value;
          });
        } else if (typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
          // With .lean(), it's already a plain object
          permissionsObj = user.permissions;
        }
      }
      
      return {
        ...user,
        _id: user._id.toString(),
        id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`,
        permissions: permissionsObj,
      };
    });

    return NextResponse.json(
      { users: usersWithPermissions },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
