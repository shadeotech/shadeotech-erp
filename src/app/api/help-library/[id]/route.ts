import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import HelpLibrary from '@/lib/models/HelpLibrary'
import { verifyAuth } from '@/lib/auth'
import { deleteFromCloudinary } from '@/lib/cloudinary'

// DELETE - Delete help library item (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only ADMIN can delete help items
    if (authPayload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    await connectDB()

    const { id } = params
    const helpItem = await HelpLibrary.findById(id)

    if (!helpItem) {
      return NextResponse.json(
        { error: 'Help item not found' },
        { status: 404 }
      )
    }

    // Delete from Cloudinary if it has a public ID
    if (helpItem.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(helpItem.cloudinaryPublicId)
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error)
        // Continue with deletion even if Cloudinary deletion fails
      }
    }

    await HelpLibrary.findByIdAndDelete(id)

    return NextResponse.json(
      { message: 'Help item deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting help item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
