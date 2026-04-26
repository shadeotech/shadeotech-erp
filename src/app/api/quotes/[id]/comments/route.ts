import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import QuoteComment from '@/lib/models/QuoteComment'
import Quote from '@/lib/models/Quote'
import User from '@/lib/models/User'
import Customer from '@/lib/models/Customer'
import { notifyAdmins } from '@/lib/notifications'

async function canAccessQuote(auth: { userId: string; role: string }, quoteDoc: any): Promise<boolean> {
  if (auth.role === 'ADMIN' || auth.role === 'STAFF') return true
  if (auth.role !== 'CUSTOMER') return false

  const user = await User.findById(auth.userId).select('email').lean() as any
  if (!user?.email) return false

  const escaped = user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const emailRegex = new RegExp(`^${escaped}$`, 'i')
  const customer = await Customer.findOne({ email: { $regex: emailRegex } }).select('_id').lean() as any
  if (!customer) return false

  return quoteDoc.customerId?.toString() === customer._id?.toString()
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const quote = await Quote.findById(params.id).lean() as any
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const allowed = await canAccessQuote(auth, quote)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const comments = await QuoteComment.find({ quoteId: params.id }).sort({ createdAt: 1 }).lean()

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: (c._id as any).toString(),
      itemIndex: c.itemIndex,
      userId: c.userId,
      userRole: c.userRole,
      userName: c.userName,
      body: c.body,
      createdAt: c.createdAt,
    })),
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const quote = await Quote.findById(params.id).lean() as any
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const allowed = await canAccessQuote(auth, quote)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const user = await User.findById(auth.userId).select('firstName lastName').lean() as any
  const userName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User'
    : 'User'

  const body = await request.json()
  const { itemIndex = -1, text } = body

  if (!text?.trim()) {
    return NextResponse.json({ error: 'Comment text required' }, { status: 400 })
  }

  const comment = await QuoteComment.create({
    quoteId: params.id,
    itemIndex: typeof itemIndex === 'number' ? itemIndex : -1,
    userId: auth.userId,
    userRole: auth.role as 'CUSTOMER' | 'ADMIN' | 'STAFF',
    userName,
    body: text.trim(),
  })

  // Notify admins when a customer leaves a comment
  if (auth.role === 'CUSTOMER') {
    const itemLabel = typeof itemIndex === 'number' && itemIndex >= 0
      ? `item ${itemIndex + 1}`
      : 'the quote'
    notifyAdmins({
      type: 'info',
      title: 'Customer comment on quote',
      message: `${userName} left a comment on ${itemLabel} of quote ${(quote as any).quoteNumber || params.id}: "${text.trim().slice(0, 80)}${text.trim().length > 80 ? '…' : ''}"`,
      link: `/quotes/${params.id}`,
    }).catch(() => {})
  }

  return NextResponse.json({
    comment: {
      id: (comment._id as any).toString(),
      itemIndex: comment.itemIndex,
      userId: comment.userId,
      userRole: comment.userRole,
      userName: comment.userName,
      body: comment.body,
      createdAt: comment.createdAt,
    },
  }, { status: 201 })
}
