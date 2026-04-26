import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Expense from '@/lib/models/Expense'
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

function toApiExpense(doc: any) {
  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),
    date: doc.date ? new Date(doc.date) : new Date(),
    category: doc.category,
    description: doc.description,
    amount: doc.amount,
    vendor: doc.vendor || '',
    payee: doc.payee || doc.vendor || '',
    customerId: doc.customerId || '',
    paymentAccount: doc.paymentAccount || '',
    refNo: doc.refNo || '',
    poNumber: doc.poNumber || '',
    sideMark: doc.sideMark || '',
    paymentMethod: doc.paymentMethod,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and STAFF can view expenses
    if (!auth.user || (auth.user.role !== 'ADMIN' && auth.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid expense ID' }, { status: 400 })
    }

    const expense = await Expense.findById(params.id).lean()

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({ expense: toApiExpense(expense) })
  } catch (error: any) {
    console.error('Expense GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and STAFF can update expenses
    if (!auth.user || (auth.user.role !== 'ADMIN' && auth.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid expense ID' }, { status: 400 })
    }

    const expense = await Expense.findById(params.id)
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      date, category, description, amount,
      vendor, payee, customerId,
      paymentAccount, refNo, poNumber, sideMark,
      paymentMethod,
    } = body

    if (date !== undefined) expense.date = new Date(date)
    if (category !== undefined) expense.category = category
    if (description !== undefined) expense.description = description.trim()
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount < 0) {
        return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
      }
      expense.amount = amount
    }
    if (vendor !== undefined) expense.vendor = vendor?.trim() || undefined
    if (payee !== undefined) expense.payee = payee?.trim() || undefined
    if (customerId !== undefined) expense.customerId = customerId?.trim() || undefined
    if (paymentAccount !== undefined) expense.paymentAccount = paymentAccount?.trim() || undefined
    if (refNo !== undefined) expense.refNo = refNo?.trim() || undefined
    if (poNumber !== undefined) expense.poNumber = poNumber?.trim() || undefined
    if (sideMark !== undefined) expense.sideMark = sideMark?.trim() || undefined
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod

    await expense.save()

    return NextResponse.json({ expense: toApiExpense(expense.toObject()) })
  } catch (error: any) {
    console.error('Expense PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN can delete expenses
    if (!auth.user || auth.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid expense ID' }, { status: 400 })
    }

    const expense = await Expense.findByIdAndDelete(params.id)

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Expense DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
