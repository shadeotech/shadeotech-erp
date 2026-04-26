import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyAuth } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN can update users
    if (authPayload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { firstName, lastName, email, role, isActive, password, phone } = body;

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email.toLowerCase().trim();
    if (phone !== undefined) user.phone = phone ? String(phone).trim() : undefined;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    // Hash password if provided
    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }
      user.password = await hashPassword(password);
    }

    await user.save();

    // Return updated user (without password)
    const userObj = user.toObject();
    let permissionsObj: Record<string, string> = {};
    
    if (userObj.permissions && userObj.permissions instanceof Map) {
      userObj.permissions.forEach((value: string, key: string) => {
        permissionsObj[key] = value;
      });
    } else if (userObj.permissions && typeof userObj.permissions === 'object') {
      permissionsObj = userObj.permissions;
    }

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
          permissions: permissionsObj,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating user:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only ADMIN can delete users
    if (authPayload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;

    // Prevent deleting yourself
    if (id === authPayload.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Find and delete user
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
