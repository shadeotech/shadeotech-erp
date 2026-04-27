import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { verifyAuth } from '@/lib/auth'
import Quote from '@/lib/models/Quote'
import Customer from '@/lib/models/Customer'
import Invoice from '@/lib/models/Invoice'
import Expense from '@/lib/models/Expense'
import Goal from '@/lib/models/Goal'

const WON_STATUSES = ['WON', 'ACCEPTED']
const MOTORIZED_TYPES = new Set(['Motorized', 'Battery Powered', 'AC 12V/24V', 'AC 110 V', 'Wand Motor'])

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await connectDB()

  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  // ── Build month labels/keys (last 12 months) ──────────────────────────────
  const monthLabels: string[] = []
  const monthKeys: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    monthLabels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }))
  }

  // ── Fetch data in parallel ────────────────────────────────────────────────
  const [recentQuotes, allQuotes, customers, invoices, expenses, yearGoals] = await Promise.all([
    Quote.find({ createdAt: { $gte: twelveMonthsAgo } }).select('status totalAmount createdAt').lean() as Promise<any[]>,
    Quote.find({ status: { $ne: 'DRAFT' } }).select('items status totalAmount createdAt').lean() as Promise<any[]>,
    Customer.find({ createdAt: { $gte: twelveMonthsAgo } }).select('createdAt leadSource status').lean() as Promise<any[]>,
    Invoice.find().select('status totalAmount dueDate createdAt').lean() as Promise<any[]>,
    Expense.find({ createdAt: { $gte: twelveMonthsAgo } }).select('amount category date createdAt').lean() as Promise<any[]>,
    Goal.find({ period: new RegExp(`^${now.getFullYear()}-`) }).lean() as Promise<any[]>,
  ])

  // ── Monthly buckets ───────────────────────────────────────────────────────
  const revenueByMonth: Record<string, number> = {}
  const quotesByMonth: Record<string, number> = {}
  const expensesByMonth: Record<string, number> = {}
  const customersByMonth: Record<string, number> = {}
  monthKeys.forEach((k) => { revenueByMonth[k] = 0; quotesByMonth[k] = 0; expensesByMonth[k] = 0; customersByMonth[k] = 0 })

  recentQuotes.forEach((q) => {
    const key = toMonthKey(q.createdAt)
    if (revenueByMonth[key] !== undefined) {
      quotesByMonth[key] += 1
      if (WON_STATUSES.includes(q.status)) revenueByMonth[key] += q.totalAmount ?? 0
    }
  })

  expenses.forEach((e) => {
    const key = toMonthKey(e.date || e.createdAt)
    if (expensesByMonth[key] !== undefined) expensesByMonth[key] += e.amount ?? 0
  })

  customers.forEach((c) => {
    const key = toMonthKey(c.createdAt)
    if (customersByMonth[key] !== undefined) customersByMonth[key] += 1
  })

  const monthlyData = monthKeys.map((key, i) => ({
    month: monthLabels[i],
    revenue: Math.round(revenueByMonth[key]),
    quotes: quotesByMonth[key],
    expenses: Math.round(expensesByMonth[key]),
    customers: customersByMonth[key],
  }))

  // ── Goals ─────────────────────────────────────────────────────────────────
  const thisMonthKey = monthKeys[11]
  const currentGoal = yearGoals.find((g) => g.period === thisMonthKey)
  const monthlyGoal = currentGoal?.revenueGoal ?? 0
  const annualGoal = yearGoals.reduce((s, g) => s + (g.revenueGoal ?? 0), 0) || monthlyGoal * 12

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const ytdWon = allQuotes.filter((q) => WON_STATUSES.includes(q.status) && new Date(q.createdAt) >= yearStart)
  const ytdRevenue = ytdWon.reduce((s, q) => s + (q.totalAmount ?? 0), 0)
  const monthlyRevenue = revenueByMonth[thisMonthKey] ?? 0
  const avgDealValue = ytdWon.length > 0 ? Math.round(ytdRevenue / ytdWon.length) : 0

  const totalNonDraft = allQuotes.length
  const wonTotal = allQuotes.filter((q) => WON_STATUSES.includes(q.status)).length
  const winRate = totalNonDraft > 0 ? Math.round((wonTotal / totalNonDraft) * 100) : 0

  const newCustomersThisMonth = customersByMonth[thisMonthKey] ?? 0
  const totalCustomers = await Customer.countDocuments()

  // ── DSO (Days Sales Outstanding) ──────────────────────────────────────────
  // DSO = (Total Outstanding Receivables / Total Revenue Last 90 days) * 90
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const recentRevenue = allQuotes
    .filter((q) => WON_STATUSES.includes(q.status) && new Date(q.createdAt) >= ninetyDaysAgo)
    .reduce((s, q) => s + (q.totalAmount ?? 0), 0)
  const outstandingInvoices = invoices.filter((i) => ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status))
  const totalOutstandingAmt = outstandingInvoices.reduce((s, i) => s + (i.totalAmount ?? 0), 0)
  const dso = recentRevenue > 0 ? Math.round((totalOutstandingAmt / recentRevenue) * 90) : 0

  // ── Pipeline ──────────────────────────────────────────────────────────────
  const stageCounts = { new: 0, sent: 0, won: 0, lost: 0 }
  allQuotes.forEach((q) => {
    const s = (q.status || '').toUpperCase()
    if (s === 'DRAFT' || s === 'NEW' || s === 'PENDING') stageCounts.new++
    else if (s === 'SENT' || s === 'VIEWED') stageCounts.sent++
    else if (WON_STATUSES.includes(s)) stageCounts.won++
    else if (s === 'LOST' || s === 'DECLINED') stageCounts.lost++
    else stageCounts.new++
  })

  // ── Top Products ──────────────────────────────────────────────────────────
  const productCounts: Record<string, { count: number; revenue: number }> = {}
  let motorizedCount = 0; let manualCount = 0

  allQuotes.forEach((q) => {
    const wonRevShare = WON_STATUSES.includes(q.status) ? (q.totalAmount ?? 0) : 0
    ;(q.items || []).forEach((item: any) => {
      const name = item.category || item.productName
      if (name) {
        if (!productCounts[name]) productCounts[name] = { count: 0, revenue: 0 }
        productCounts[name].count += item.quantity || 1
        productCounts[name].revenue += wonRevShare / Math.max((q.items || []).length, 1)
      }
      if (item.controlType) {
        if (MOTORIZED_TYPES.has(item.controlType)) motorizedCount++
        else manualCount++
      }
    })
  })

  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([name, d]) => ({ name, count: d.count, revenue: Math.round(d.revenue) }))

  // ── Lead Sources ──────────────────────────────────────────────────────────
  const LEAD_LABELS: Record<string, string> = {
    META: 'Meta Ads', GOOGLE: 'Google', REFERRAL: 'Referral',
    PARTNER_REFERRAL: 'Partner Ref.', DOOR_HANGER: 'Door Hanger',
    DOOR_TO_DOOR: 'Door to Door', LINKEDIN: 'LinkedIn',
    VEHICLE: 'Vehicle', WALK_IN: 'Walk-In',
    OTHER_PAID: 'Other Paid', OTHER_ORGANIC: 'Other Organic',
  }
  const leadMap: Record<string, number> = {}
  customers.forEach((c) => {
    const src = LEAD_LABELS[c.leadSource] ?? c.leadSource ?? 'Unknown'
    leadMap[src] = (leadMap[src] || 0) + 1
  })
  const leadSourceData = Object.entries(leadMap)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({ source, count }))

  // ── Invoice Stats ─────────────────────────────────────────────────────────
  const invPaid = invoices.filter((i) => i.status === 'PAID')
  const invOverdue = invoices.filter((i) => i.status === 'OVERDUE' || (i.status !== 'PAID' && i.status !== 'CANCELLED' && i.dueDate && new Date(i.dueDate) < now))
  const invSent = invoices.filter((i) => ['SENT', 'PARTIALLY_PAID'].includes(i.status))
  const invDraft = invoices.filter((i) => i.status === 'DRAFT')

  const invoiceStats = {
    paid: invPaid.length,
    sent: invSent.length,
    overdue: invOverdue.length,
    draft: invDraft.length,
    totalPaid: Math.round(invPaid.reduce((s, i) => s + (i.totalAmount ?? 0), 0)),
    totalOutstanding: Math.round(totalOutstandingAmt),
    totalOverdue: Math.round(invOverdue.reduce((s, i) => s + (i.totalAmount ?? 0), 0)),
  }

  // ── Expense Stats ─────────────────────────────────────────────────────────
  const expenseCategoryMap: Record<string, number> = {}
  const totalExpenses = expenses.reduce((s, e) => {
    const cat = e.category || 'Other'
    expenseCategoryMap[cat] = (expenseCategoryMap[cat] || 0) + (e.amount ?? 0)
    return s + (e.amount ?? 0)
  }, 0)
  const expensesByCategory = Object.entries(expenseCategoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({ category, amount: Math.round(amount) }))

  const mtdExpenses = expenses
    .filter((e) => new Date(e.date || e.createdAt) >= monthStart)
    .reduce((s, e) => s + (e.amount ?? 0), 0)

  // ── Alerts ────────────────────────────────────────────────────────────────
  const alerts: { type: string; message: string; severity: 'high' | 'medium' | 'low' }[] = []

  if (invOverdue.length > 0) {
    alerts.push({ type: 'invoices', message: `${invOverdue.length} overdue invoice${invOverdue.length > 1 ? 's' : ''} totaling $${invoiceStats.totalOverdue.toLocaleString()}`, severity: 'high' })
  }
  if (dso > 45) {
    alerts.push({ type: 'dso', message: `DSO is ${dso} days — collections may need attention (target: <30 days)`, severity: 'high' })
  } else if (dso > 30) {
    alerts.push({ type: 'dso', message: `DSO is ${dso} days — slightly above the 30-day target`, severity: 'medium' })
  }
  if (winRate < 20 && totalNonDraft > 5) {
    alerts.push({ type: 'win_rate', message: `Win rate is ${winRate}% — below the 20% benchmark`, severity: 'high' })
  } else if (winRate < 30 && totalNonDraft > 5) {
    alerts.push({ type: 'win_rate', message: `Win rate is ${winRate}% — consider reviewing lost quotes`, severity: 'medium' })
  }
  if (monthlyGoal > 0 && monthlyRevenue < monthlyGoal * 0.5 && now.getDate() > 15) {
    alerts.push({ type: 'revenue', message: `Monthly revenue ($${Math.round(monthlyRevenue).toLocaleString()}) is below 50% of goal with ${31 - now.getDate()} days remaining`, severity: 'medium' })
  }
  if (alerts.length === 0) {
    alerts.push({ type: 'ok', message: 'All key metrics are within healthy ranges', severity: 'low' })
  }

  return NextResponse.json({
    // KPIs
    ytdRevenue: Math.round(ytdRevenue),
    annualGoal,
    monthlyRevenue: Math.round(monthlyRevenue),
    monthlyGoal,
    winRate,
    avgDealValue,
    dso,
    newCustomersThisMonth,
    totalCustomers,
    mtdExpenses: Math.round(mtdExpenses),
    // Charts
    monthlyData,
    // Pipeline
    pipeline: { ...stageCounts, total: totalNonDraft },
    // Products
    topProducts,
    motorStats: { motorized: motorizedCount, manual: manualCount },
    // Customers
    leadSourceData,
    // Finance
    invoiceStats,
    expensesByCategory,
    // Alerts
    alerts,
  })
}

function toMonthKey(date: any): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
