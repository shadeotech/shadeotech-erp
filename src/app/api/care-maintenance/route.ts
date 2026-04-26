import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import CareMaintenance from '@/lib/models/CareMaintenance'
import { verifyAuth } from '@/lib/auth'

// GET - Fetch all care & maintenance items (public for customer portal)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const careItems = await CareMaintenance.find({})
      .sort({ uploadDate: -1 })
      .lean()

    const formattedItems = careItems.map((item: any) => ({
      id: item._id.toString(),
      title: item.title,
      type: item.type,
      category: item.category,
      description: item.description,
      url: item.cloudinaryUrl || item.url || '',
      uploadDate: item.uploadDate,
    }))

    return NextResponse.json(
      { careItems: formattedItems },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching care items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new care & maintenance item (admin only)
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

    // Only ADMIN can create care items
    if (authPayload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { title, type, category, description, url, cloudinaryUrl, cloudinaryPublicId } = body

    if (!title || !type || !category || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // For PDFs, require either cloudinaryUrl or url
    if (type === 'PDF' && !cloudinaryUrl && !url) {
      return NextResponse.json(
        { error: 'PDF requires a file URL' },
        { status: 400 }
      )
    }

    // For Videos, require either cloudinaryUrl or url
    if (type === 'Video' && !cloudinaryUrl && !url) {
      return NextResponse.json(
        { error: 'Video requires a URL' },
        { status: 400 }
      )
    }

    const careItem = new CareMaintenance({
      title,
      type,
      category,
      description,
      url: url || undefined,
      cloudinaryUrl: cloudinaryUrl || undefined,
      cloudinaryPublicId: cloudinaryPublicId || undefined,
      uploadDate: new Date(),
    })

    await careItem.save()

    return NextResponse.json(
      {
        careItem: {
          id: careItem._id.toString(),
          title: careItem.title,
          type: careItem.type,
          category: careItem.category,
          description: careItem.description,
          url: careItem.cloudinaryUrl || careItem.url || '',
          uploadDate: careItem.uploadDate,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating care item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
