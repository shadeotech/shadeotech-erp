import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/lib/models/User'
import Expense from '@/lib/models/Expense'
import { verifyAuth } from '@/lib/auth'
import type { User as UserType } from '@/types/database'

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

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const filter: Record<string, unknown> = {}

    if (category) {
      filter.category = category
    }

    if (dateFrom || dateTo) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {}
      if (dateFrom) {
        dateFilter.$gte = new Date(dateFrom)
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999) // Include the entire day
        dateFilter.$lte = toDate
      }
      filter.date = dateFilter
    }

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .lean()

    return NextResponse.json({
      expenses: expenses.map(toApiExpense),
    })
  } catch (error: any) {
    console.error('Expenses GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and STAFF can create expenses
    if (!auth.user || (auth.user.role !== 'ADMIN' && auth.user.role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const {
      date, category, description, amount,
      vendor, payee, customerId,
      paymentAccount, refNo, poNumber, sideMark,
      paymentMethod,
    } = body

    if (!date || !category || !description || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Date, category, description, and amount are required' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    const expense = await Expense.create({
      date: new Date(date),
      category,
      description: description.trim(),
      amount,
      vendor: vendor?.trim() || undefined,
      payee: (payee || vendor)?.trim() || undefined,
      customerId: customerId?.trim() || undefined,
      paymentAccount: paymentAccount?.trim() || undefined,
      refNo: refNo?.trim() || undefined,
      poNumber: poNumber?.trim() || undefined,
      sideMark: sideMark?.trim() || undefined,
      paymentMethod: paymentMethod || 'Credit Card',
      createdBy: auth.userId,
    })

    return NextResponse.json(
      { expense: toApiExpense(expense.toObject()) },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Expenses POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
