import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

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

    // Only ADMIN can update permissions
    if (authPayload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const { id } = params;
    const body = await request.json();
    const { permissions } = body;

    // Validate permissions object
    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json(
        { error: 'Invalid permissions format' },
        { status: 400 }
      );
    }

    // Validate permission values
    const validLevels = ['no', 'read', 'edit', 'full'];
    for (const [key, value] of Object.entries(permissions)) {
      if (!validLevels.includes(value as string)) {
        return NextResponse.json(
          { error: `Invalid permission level for ${key}: ${value}` },
          { status: 400 }
        );
      }
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update permissions
    // Convert to plain object - Mongoose Map is stored as object in MongoDB anyway
    const permissionsObj: Record<string, string> = {};
    if (permissions && typeof permissions === 'object') {
      for (const [key, value] of Object.entries(permissions)) {
        // Save all values including 'no' - they're all valid access levels
        if (typeof value === 'string' && ['no', 'read', 'edit', 'full'].includes(value)) {
          permissionsObj[key] = value;
        }
      }
    }
    
    // Use native MongoDB collection to directly update the field
    // This bypasses Mongoose Map type handling issues
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const usersCollection = db.collection('users');
    await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { permissions: permissionsObj } }
    );
    
    // Reload the user to ensure we have the latest data
    const savedUser = await User.findById(id).select('-password').lean();
    if (!savedUser) {
      return NextResponse.json(
        { error: 'User not found after save' },
        { status: 404 }
      );
    }
    
    // If updating permissions for the current user, they should refresh their session
    // This is handled client-side by refreshing the user data

    // Convert permissions Map back to object for response
    // When using .lean(), permissions come back as a plain object, not a Map
    const responsePermissionsObj: Record<string, string> = {};
    if (savedUser.permissions) {
      if (savedUser.permissions instanceof Map) {
        savedUser.permissions.forEach((value: string, key: string) => {
          responsePermissionsObj[key] = value;
        });
      } else if (typeof savedUser.permissions === 'object' && !Array.isArray(savedUser.permissions)) {
        // When using .lean(), it's already a plain object
        Object.assign(responsePermissionsObj, savedUser.permissions);
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          _id: savedUser._id.toString(),
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          isActive: savedUser.isActive,
          permissions: responsePermissionsObj,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
