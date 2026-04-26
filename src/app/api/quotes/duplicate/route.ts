import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Quote from '@/lib/models/Quote'
import { verifyAuth } from '@/lib/auth'
import type { User as UserType } from '@/types/database'
import mongoose from 'mongoose'

async function getAuthUser(request: NextRequest): Promise<{ user: UserType | null; userId: string } | null> {
  const authPayload = await verifyAuth(request)
  if (!authPayload) return null
  await connectDB()
  const raw = await User.findById(authPayload.userId).select('-password').lean()
  if (!raw) return null
  let permissionsObj: Record<string, string> = {}
  if (raw.permissions) {
    if (raw.permissions instanceof Map) {
      ;(raw.permissions as Map<string, string>).forEach((value: string, key: string) => {
        permissionsObj[key] = value
      })
    } else if (typeof raw.permissions === 'object' && !Array.isArray(raw.permissions)) {
      permissionsObj = raw.permissions as Record<string, string>
    }
  }
  const user: UserType = {
    _id: raw._id.toString(),
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    role: raw.role,
    isActive: raw.isActive,
    permissions: permissionsObj as Record<string, 'no' | 'read' | 'edit' | 'full'>,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
  return { user, userId: authPayload.userId }
}

function toApiQuote(doc: any) {
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    quoteNumber: doc.quoteNumber,
    customerId: doc.customerId,
    customerName: doc.customerName,
    sideMark: doc.sideMark,
    status: doc.status,
    items: doc.items || [],
    subtotal: doc.subtotal,
    taxRate: doc.taxRate,
    taxAmount: doc.taxAmount,
    totalAmount: doc.totalAmount,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : undefined,
    notes: doc.notes,
    priceAdjustPercent: doc.priceAdjustPercent || 0,
    priceAdjustFlat: doc.priceAdjustFlat || 0,
    contractType: doc.contractType,
    isFranchisee: doc.isFranchisee,
    visuals: doc.visuals,
    history: (doc.history || []).map((h: any) => ({
      status: h.status,
      timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
      note: h.note,
    })),
    addOns: doc.addOns || [],
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (auth.user.role !== 'ADMIN' && auth.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { sourceId } = body

    if (!sourceId || !mongoose.Types.ObjectId.isValid(sourceId)) {
      return NextResponse.json({ error: 'Invalid source quote ID' }, { status: 400 })
    }

    const sourceQuote = await Quote.findById(sourceId).lean()
    if (!sourceQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    const year = String(new Date().getFullYear()).slice(-2)
    const count = await Quote.countDocuments()
    const newQuoteNumber = `QT-${year}-${String(count + 1).padStart(4, '0')}`

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)

    const items = (sourceQuote.items || []).map((item: any) => {
      const { _id, id, ...rest } = item
      return rest
    })

    const newQuote = await Quote.create({
      quoteNumber: newQuoteNumber,
      customerId: sourceQuote.customerId,
      customerName: sourceQuote.customerName,
      sideMark: sourceQuote.sideMark,
      status: 'DRAFT',
      items,
      subtotal: sourceQuote.subtotal,
      taxRate: sourceQuote.taxRate,
      taxAmount: sourceQuote.taxAmount,
      totalAmount: sourceQuote.totalAmount,
      expiryDate,
      notes: sourceQuote.notes,
      priceAdjustPercent: sourceQuote.priceAdjustPercent || 0,
      priceAdjustFlat: sourceQuote.priceAdjustFlat || 0,
      contractType: sourceQuote.contractType,
      isFranchisee: sourceQuote.isFranchisee,
      visuals: sourceQuote.visuals,
      history: [
        { status: 'CREATED', timestamp: new Date(), note: `Duplicated from ${sourceQuote.quoteNumber}` },
        { status: 'DRAFT', timestamp: new Date() },
      ],
      addOns: sourceQuote.addOns || [],
      createdById: auth.userId,
    })

    return NextResponse.json({ quote: toApiQuote(newQuote) }, { status: 201 })
  } catch (error: any) {
    console.error('Quote duplicate error:', error)
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Quote number conflict - please try again' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
