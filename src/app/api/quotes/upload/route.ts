import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'ADMIN' && auth.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await uploadToCloudinary(buffer, 'quote-sequence-photos', 'image')

    return NextResponse.json({ url: result.secure_url, publicId: result.public_id })
  } catch (error) {
    console.error('[/api/quotes/upload] error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
