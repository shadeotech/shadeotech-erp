import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Goal from '@/lib/models/Goal'

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()
  const period = currentPeriod()
  const goal = await Goal.findOne({ period }).lean() as any

  return NextResponse.json({
    goal: {
      period,
      revenueGoal: goal?.revenueGoal ?? 0,
      annualRevenueGoal: goal?.annualRevenueGoal ?? 0,
      quotesGoal: goal?.quotesGoal ?? 0,
      customersGoal: goal?.customersGoal ?? 0,
    },
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()
  const body = await request.json()
  const period = body.period || currentPeriod()

  const goal = await Goal.findOneAndUpdate(
    { period },
    {
      $set: {
        revenueGoal: Number(body.revenueGoal) || 0,
        annualRevenueGoal: Number(body.annualRevenueGoal) || 0,
        quotesGoal: Number(body.quotesGoal) || 0,
        customersGoal: Number(body.customersGoal) || 0,
        updatedBy: auth.userId,
      },
    },
    { upsert: true, new: true }
  ).lean() as any

  return NextResponse.json({
    success: true,
    goal: {
      period: goal.period,
      revenueGoal: goal.revenueGoal,
      annualRevenueGoal: goal.annualRevenueGoal,
      quotesGoal: goal.quotesGoal,
      customersGoal: goal.customersGoal,
    },
  })
}
