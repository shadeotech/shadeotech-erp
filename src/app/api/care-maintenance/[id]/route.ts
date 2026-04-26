import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import CareMaintenance from '@/lib/models/CareMaintenance'
import { verifyAuth } from '@/lib/auth'
import { deleteFromCloudinary } from '@/lib/cloudinary'

// DELETE - Delete care & maintenance item (admin only)
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

    // Only ADMIN can delete care items
    if (authPayload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    await connectDB()

    const { id } = params
    const careItem = await CareMaintenance.findById(id)

    if (!careItem) {
      return NextResponse.json(
        { error: 'Care item not found' },
        { status: 404 }
      )
    }

    // Delete from Cloudinary if it has a public ID
    if (careItem.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(careItem.cloudinaryPublicId)
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error)
        // Continue with deletion even if Cloudinary deletion fails
      }
    }

    await CareMaintenance.findByIdAndDelete(id)

    return NextResponse.json(
      { message: 'Care item deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting care item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
