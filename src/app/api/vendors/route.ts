import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Vendor from '@/lib/models/Vendor'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const vendors = await Vendor.find().sort({ name: 1 }).lean()
    return NextResponse.json({
      vendors: vendors.map((v: any) => ({
        id: v._id.toString(),
        name: v.name,
        email: v.email ?? '',
        phone: v.phone ?? '',
        address: v.address ?? '',
        notes: v.notes ?? '',
      })),
    })
  } catch (error) {
    console.error('Vendors GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const body = await request.json()
    const { name, email, phone, address, notes } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const vendor = await Vendor.create({
      name: name.trim(),
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined,
      notes: notes?.trim() || undefined,
    })
    return NextResponse.json({
      vendor: { id: vendor._id.toString(), name: vendor.name, email: vendor.email ?? '', phone: vendor.phone ?? '' },
    }, { status: 201 })
  } catch (error) {
    console.error('Vendors POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
