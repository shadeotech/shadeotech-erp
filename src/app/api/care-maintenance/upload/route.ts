import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

// POST - Upload file to Cloudinary (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authPayload = await verifyAuth(request)
    if (!authPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only ADMIN can upload files
    if (authPayload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'PDF' or 'Video'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine resource type for Cloudinary
    const resourceType = type === 'PDF' ? 'raw' : type === 'Video' ? 'video' : 'auto'

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      buffer,
      'care-maintenance',
      resourceType as 'raw' | 'video' | 'auto'
    )

    return NextResponse.json(
      {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
