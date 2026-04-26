import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Quote from '@/lib/models/Quote'
import Customer from '@/lib/models/Customer'

const WON_STATUSES = ['WON', 'ACCEPTED']
const MOTORIZED_TYPES = new Set([
  'Motorized', 'Battery Powered', 'AC 12V/24V', 'AC 110 V', 'Wand Motor',
])

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()

  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  // Fetch recent quotes for monthly revenue chart
  const recentQuotes = await Quote.find({ createdAt: { $gte: sixMonthsAgo } })
    .select('status totalAmount createdAt')
    .lean() as any[]

  // Fetch all non-draft quotes for product + motor stats
  const allQuotes = await Quote.find({ status: { $ne: 'DRAFT' } })
    .select('items status')
    .lean() as any[]

  // ── Monthly revenue buckets ───────────────────────────────────────────────
  const monthLabels: string[] = []
  const monthKeys: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    monthLabels.push(d.toLocaleString('default', { month: 'short' }))
  }

  const revenueByMonth: Record<string, number> = {}
  const quotesByMonth: Record<string, number> = {}
  monthKeys.forEach((k) => { revenueByMonth[k] = 0; quotesByMonth[k] = 0 })

  recentQuotes.forEach((q) => {
    const d = new Date(q.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (revenueByMonth[key] !== undefined) {
      quotesByMonth[key] += 1
      if (WON_STATUSES.includes(q.status)) revenueByMonth[key] += q.totalAmount ?? 0
    }
  })

  // ── Product sales + motor stats from all items ────────────────────────────
  const productCounts: Record<string, number> = {}
  let motorizedCount = 0
  let manualCount = 0

  allQuotes.forEach((q) => {
    ;(q.items || []).forEach((item: any) => {
      // Use category for product type grouping (e.g. "Roller Shades", "Exterior - Zip")
      const name = item.category || item.productName
      if (name) {
        productCounts[name] = (productCounts[name] || 0) + (item.quantity || 1)
      }
      if (item.controlType) {
        if (MOTORIZED_TYPES.has(item.controlType)) motorizedCount++
        else manualCount++
      }
    })
  })

  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  // ── This month ────────────────────────────────────────────────────────────
  const thisMonthKey = monthKeys[5]
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthCustomers = await Customer.countDocuments({ createdAt: { $gte: monthStart } })

  // ── Lead source breakdown ─────────────────────────────────────────────────
  const leadSourceGroups = await Customer.aggregate([
    { $match: { leadSource: { $exists: true, $ne: null } } },
    { $group: { _id: '$leadSource', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ])
  const LEAD_SOURCE_LABELS: Record<string, string> = {
    META: 'Meta Ads', GOOGLE: 'Google', REFERRAL: 'Referral',
    PARTNER_REFERRAL: 'Partner Ref.', DOOR_HANGER: 'Door Hanger',
    DOOR_TO_DOOR: 'Door to Door', LINKEDIN: 'LinkedIn',
    VEHICLE: 'Vehicle', WALK_IN: 'Walk-In',
    OTHER_PAID: 'Other Paid', OTHER_ORGANIC: 'Other Organic',
  }
  const leadSourceData = leadSourceGroups.map((g: any) => ({
    source: LEAD_SOURCE_LABELS[g._id] ?? g._id,
    count: g.count,
  }))

  return NextResponse.json({
    monthlyData: monthKeys.map((key, i) => ({
      month: monthLabels[i],
      revenue: revenueByMonth[key],
      quotes: quotesByMonth[key],
    })),
    thisMonthRevenue: revenueByMonth[thisMonthKey] ?? 0,
    thisMonthQuotes: quotesByMonth[thisMonthKey] ?? 0,
    thisMonthCustomers,
    topProducts,
    motorStats: { motorized: motorizedCount, manual: manualCount },
    leadSourceData,
  })
}
