import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Quote from '@/lib/models/Quote'
import Goal from '@/lib/models/Goal'

const WON_STATUSES = ['WON', 'ACCEPTED']

function currentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()

  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const period = currentPeriod()

  // Monthly goal
  const goalDoc = await Goal.findOne({ period }).lean() as any
  const monthlyGoal = goalDoc?.revenueGoal ?? 0

  // Sum all monthly goals for the year as annual target
  const yearKey = `${now.getFullYear()}-`
  const yearGoals = await Goal.find({ period: new RegExp(`^${now.getFullYear()}-`) }).lean() as any[]
  const annualGoal = yearGoals.reduce((s, g) => s + (g.revenueGoal ?? 0), 0) || monthlyGoal * 12

  // YTD revenue
  const ytdQuotes = await Quote.find({
    status: { $in: WON_STATUSES },
    createdAt: { $gte: yearStart },
  }).select('totalAmount createdAt').lean() as any[]
  const ytdRevenue = ytdQuotes.reduce((s, q) => s + (q.totalAmount ?? 0), 0)

  // Monthly actual
  const monthlyQuotes = await Quote.find({
    status: { $in: WON_STATUSES },
    createdAt: { $gte: monthStart },
  }).select('totalAmount').lean() as any[]
  const monthlyActual = monthlyQuotes.reduce((s, q) => s + (q.totalAmount ?? 0), 0)

  // Average deal value (WON quotes this year)
  const avgDealValue = ytdQuotes.length > 0
    ? Math.round(ytdRevenue / ytdQuotes.length)
    : 0

  // Pipeline stages: count quotes by status (use all non-draft quotes)
  const pipelineQuotes = await Quote.find({ status: { $ne: 'DRAFT' } })
    .select('status totalAmount')
    .lean() as any[]

  const stageCounts = {
    new: 0,
    sent: 0,
    won: 0,
    lost: 0,
  }
  pipelineQuotes.forEach((q) => {
    const s = (q.status || '').toUpperCase()
    if (s === 'DRAFT' || s === 'NEW' || s === 'PENDING') stageCounts.new++
    else if (s === 'SENT' || s === 'VIEWED') stageCounts.sent++
    else if (WON_STATUSES.includes(s)) stageCounts.won++
    else if (s === 'LOST' || s === 'DECLINED') stageCounts.lost++
    else stageCounts.new++
  })

  // Total non-draft for conversion calculation
  const totalNonDraft = pipelineQuotes.length

  return NextResponse.json({
    ytdRevenue,
    annualGoal,
    monthlyActual,
    monthlyGoal,
    avgDealValue,
    pipeline: {
      new: stageCounts.new,
      sent: stageCounts.sent,
      won: stageCounts.won,
      lost: stageCounts.lost,
      total: totalNonDraft,
    },
  })
}
