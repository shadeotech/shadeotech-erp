import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${randomUUID()}.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'fabrics')
    const filePath = path.join(uploadDir, filename)

    await writeFile(filePath, buffer)

    const url = `/uploads/fabrics/${filename}`
    return NextResponse.json({ url, publicId: filename })
  } catch (error) {
    console.error('[/api/fabric-gallery/upload] error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
