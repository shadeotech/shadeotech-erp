import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import { verifyAuth } from '@/lib/auth'
import { getQuickBooksStatus } from '@/lib/quickbooks'

async function canAccess(request: NextRequest): Promise<boolean> {
  const auth = await verifyAuth(request)
  if (!auth) return false
  await connectDB()
  const user = await User.findById(auth.userId).select('role').lean()
  return Boolean(user && (user.role === 'ADMIN' || user.role === 'STAFF'))
}

export async function GET(request: NextRequest) {
  try {
    if (!(await canAccess(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ status: getQuickBooksStatus() }, { status: 200 })
  } catch (error) {
    console.error('QuickBooks status GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
