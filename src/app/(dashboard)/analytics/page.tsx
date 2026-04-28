'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, RefreshCw, TrendingUp, TrendingDown, DollarSign, Target, Users, AlertTriangle, CheckCircle, Clock, BarChart3, PieChart, Activity, Bell, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Filler, Tooltip, Legend,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend)

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}
function fmtNum(n: number) {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  ytdRevenue: number; annualGoal: number
  monthlyRevenue: number; monthlyGoal: number
  winRate: number; avgDealValue: number; dso: number
  newCustomersThisMonth: number; totalCustomers: number; mtdExpenses: number
  monthlyData: { month: string; revenue: number; quotes: number; expenses: number; customers: number }[]
  pipeline: { new: number; sent: number; won: number; lost: number; total: number }
  topProducts: { name: string; count: number; revenue: number }[]
  motorStats: { motorized: number; manual: number }
  leadSourceData: { source: string; count: number }[]
  invoiceStats: { paid: number; sent: number; overdue: number; draft: number; totalPaid: number; totalOutstanding: number; totalOverdue: number }
  expensesByCategory: { category: string; amount: number }[]
  alerts: { type: string; message: string; severity: 'high' | 'medium' | 'low' }[]
}

interface GoalData { revenueGoal: number; quotesGoal: number; customersGoal: number }

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, trend, color = 'amber' }: {
  icon: any; label: string; value: string; sub?: string; trend?: number; color?: string
}) {
  const colors: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="rounded-xl border bg-white dark:bg-[#111] p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg shrink-0 ${colors[color] ?? colors.amber}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}% vs last month
          </div>
        )}
      </div>
    </div>
  )
}

// ── Chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, sub, children, className = '' }: { title: string; sub?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-white dark:bg-[#111] overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b">
        <p className="font-semibold text-sm">{title}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ── Chart options helpers ─────────────────────────────────────────────────────
const baseTooltip = {
  backgroundColor: '#fff',
  titleColor: '#111',
  bodyColor: '#6b7280',
  borderColor: '#e5e7eb',
  borderWidth: 1,
  padding: 10,
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { token, user } = useAuthStore()
  const { toast } = useToast()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)
  const [goalData, setGoalData] = useState<GoalData>({ revenueGoal: 0, quotesGoal: 0, customersGoal: 0 })
  const [draftGoal, setDraftGoal] = useState<GoalData>({ revenueGoal: 0, quotesGoal: 0, customersGoal: 0 })

  const isAdmin = user?.role === 'ADMIN'

  const fetchData = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [aRes, gRes] = await Promise.all([
        fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/goals', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (aRes.ok) setData(await aRes.json())
      if (gRes.ok) {
        const gd = await gRes.json()
        setGoalData(gd.goal ?? { revenueGoal: 0, quotesGoal: 0, customersGoal: 0 })
        setDraftGoal(gd.goal ?? { revenueGoal: 0, quotesGoal: 0, customersGoal: 0 })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [token]) // eslint-disable-line

  const saveGoal = async () => {
    if (!token) return
    setSavingGoal(true)
    try {
      const res = await fetch('/api/admin/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(draftGoal),
      })
      if (res.ok) { setGoalData(draftGoal); setGoalDialogOpen(false); toast({ title: 'Goals updated' }); await fetchData() }
    } finally { setSavingGoal(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <p className="text-muted-foreground">Could not load analytics data.</p>
        <Button size="sm" onClick={fetchData}>Retry</Button>
      </div>
    )
  }

  // ── Derived chart data ────────────────────────────────────────────────────
  const months = data.monthlyData.map((d) => d.month)
  const AMBER = '#d97706'
  const AMBER_LIGHT = 'rgba(217,119,6,0.12)'
  const BLUE = '#3b82f6'
  const BLUE_LIGHT = 'rgba(59,130,246,0.12)'

  const revenueLineData = {
    labels: months,
    datasets: [
      {
        label: 'Revenue',
        data: data.monthlyData.map((d) => d.revenue),
        borderColor: AMBER, backgroundColor: AMBER_LIGHT,
        fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2,
      },
      {
        label: 'Expenses',
        data: data.monthlyData.map((d) => d.expenses),
        borderColor: BLUE, backgroundColor: BLUE_LIGHT,
        fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2,
        borderDash: [4, 4],
      },
    ],
  }

  const quoteBarData = {
    labels: months,
    datasets: [{
      label: 'Quotes Created',
      data: data.monthlyData.map((d) => d.quotes),
      backgroundColor: AMBER_LIGHT,
      borderColor: AMBER,
      borderWidth: 2,
      borderRadius: 6,
    }],
  }

  const customerGrowthData = {
    labels: months,
    datasets: [{
      label: 'New Customers',
      data: data.monthlyData.map((d) => d.customers),
      borderColor: BLUE, backgroundColor: BLUE_LIGHT,
      fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2,
    }],
  }

  const topProductsData = {
    labels: data.topProducts.map((p) => p.name),
    datasets: [{
      label: 'Units Sold',
      data: data.topProducts.map((p) => p.count),
      backgroundColor: [
        'rgba(217,119,6,0.8)', 'rgba(251,191,36,0.8)', 'rgba(245,158,11,0.8)',
        'rgba(180,83,9,0.8)', 'rgba(146,64,14,0.8)', 'rgba(92,45,145,0.8)',
        'rgba(59,130,246,0.8)', 'rgba(16,185,129,0.8)',
      ],
      borderRadius: 6,
    }],
  }

  const motorDonutData = {
    labels: ['Motorized', 'Manual'],
    datasets: [{
      data: [data.motorStats.motorized, data.motorStats.manual],
      backgroundColor: [AMBER, '#e5e7eb'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }

  const leadColors = ['#d97706','#f59e0b','#3b82f6','#8b5cf6','#10b981','#f43f5e','#0ea5e9','#84cc16','#64748b','#f97316']
  const leadDonutData = {
    labels: data.leadSourceData.map((l) => l.source),
    datasets: [{
      data: data.leadSourceData.map((l) => l.count),
      backgroundColor: leadColors.slice(0, data.leadSourceData.length),
      borderWidth: 0, hoverOffset: 6,
    }],
  }

  const invoiceDonutData = {
    labels: ['Paid', 'Outstanding', 'Overdue'],
    datasets: [{
      data: [data.invoiceStats.totalPaid, data.invoiceStats.totalOutstanding - data.invoiceStats.totalOverdue, data.invoiceStats.totalOverdue],
      backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
      borderWidth: 0, hoverOffset: 6,
    }],
  }

  const expenseBarData = {
    labels: data.expensesByCategory.slice(0, 8).map((e) => e.category),
    datasets: [{
      label: 'Amount ($)',
      data: data.expensesByCategory.slice(0, 8).map((e) => e.amount),
      backgroundColor: 'rgba(59,130,246,0.75)',
      borderColor: BLUE, borderWidth: 1, borderRadius: 5,
    }],
  }

  const lineOpts = (yFmt?: (v: any) => string) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const, labels: { usePointStyle: true, font: { size: 11 } } }, tooltip: { ...baseTooltip } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: yFmt ?? ((v: any) => v) } },
    },
  })

  const barOpts = (yFmt?: (v: any) => string, horizontal = false) => ({
    responsive: true, maintainAspectRatio: false, indexAxis: horizontal ? 'y' as const : 'x' as const,
    plugins: { legend: { display: false }, tooltip: { ...baseTooltip } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: yFmt ?? ((v: any) => v) } },
    },
  })

  const donutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { position: 'right' as const, labels: { font: { size: 11 }, usePointStyle: true } }, tooltip: { ...baseTooltip } },
  }

  // ── Pipeline funnel numbers ────────────────────────────────────────────────
  const { pipeline } = data
  const pipeTotal = Math.max(pipeline.total, 1)

  // ── Progress bar helper ───────────────────────────────────────────────────
  const ytdPct = data.annualGoal > 0 ? Math.min((data.ytdRevenue / data.annualGoal) * 100, 100) : 0
  const monthPct = data.monthlyGoal > 0 ? Math.min((data.monthlyRevenue / data.monthlyGoal) * 100, 100) : 0

  const highAlerts = data.alerts.filter((a) => a.severity === 'high')

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-500" />
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time KPIs, sales performance & business intelligence
          </p>
        </div>
        <div className="flex gap-2">
          {highAlerts.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700">
              <Bell className="h-3.5 w-3.5" />
              {highAlerts.length} Alert{highAlerts.length > 1 ? 's' : ''}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={() => { setDraftGoal(goalData); setGoalDialogOpen(true) }} className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
              <Target className="h-3.5 w-3.5" /> Set Goals
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard icon={DollarSign} label="YTD Revenue" value={fmtCurrency(data.ytdRevenue)}
          sub={data.annualGoal > 0 ? `${Math.round(ytdPct)}% of ${fmtCurrency(data.annualGoal)} goal` : undefined} color="amber" />
        <KpiCard icon={TrendingUp} label="MTD Revenue" value={fmtCurrency(data.monthlyRevenue)}
          sub={data.monthlyGoal > 0 ? `${Math.round(monthPct)}% of ${fmtCurrency(data.monthlyGoal)} goal` : undefined} color="green" />
        <KpiCard icon={Target} label="Win Rate" value={`${data.winRate}%`}
          sub={`${pipeline.won} won of ${pipeline.total} quotes`} color={data.winRate >= 30 ? 'green' : data.winRate >= 20 ? 'amber' : 'red'} />
        <KpiCard icon={BarChart3} label="Avg Deal Value" value={fmtCurrency(data.avgDealValue)}
          sub="Per won quote (YTD)" color="purple" />
        <KpiCard icon={Clock} label="DSO" value={`${data.dso} days`}
          sub="Days Sales Outstanding" color={data.dso <= 30 ? 'green' : data.dso <= 45 ? 'amber' : 'red'} />
        <KpiCard icon={Users} label="New Customers" value={String(data.newCustomersThisMonth)}
          sub={`${data.totalCustomers.toLocaleString()} total`} color="blue" />
      </div>

      {/* ── Goal Progress Bars ── */}
      {data.annualGoal > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border bg-white dark:bg-[#111] p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Annual Revenue Goal</span>
              <span className="text-muted-foreground">{fmtCurrency(data.ytdRevenue)} / {fmtCurrency(data.annualGoal)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${ytdPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{Math.round(ytdPct)}% of annual goal achieved</p>
          </div>
          <div className="rounded-xl border bg-white dark:bg-[#111] p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Monthly Revenue Goal</span>
              <span className="text-muted-foreground">{fmtCurrency(data.monthlyRevenue)} / {fmtCurrency(data.monthlyGoal)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${monthPct >= 100 ? 'bg-green-500' : monthPct >= 70 ? 'bg-amber-500' : 'bg-red-400'}`}
                style={{ width: `${monthPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{Math.round(monthPct)}% of monthly goal achieved</p>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview">
        <TabsList className="h-9">
          <TabsTrigger value="overview" className="text-xs gap-1.5"><Activity className="h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="sales" className="text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Sales</TabsTrigger>
          <TabsTrigger value="products" className="text-xs gap-1.5"><PieChart className="h-3.5 w-3.5" />Products</TabsTrigger>
          <TabsTrigger value="customers" className="text-xs gap-1.5"><Users className="h-3.5 w-3.5" />Customers</TabsTrigger>
          <TabsTrigger value="finance" className="text-xs gap-1.5"><DollarSign className="h-3.5 w-3.5" />Finance</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs gap-1.5 relative">
            <Bell className="h-3.5 w-3.5" />Alerts
            {highAlerts.length > 0 && <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center font-bold">{highAlerts.length}</span>}
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Revenue vs Expenses trend */}
            <ChartCard title="Revenue vs Expenses" sub="Last 12 months" className="lg:col-span-2">
              <div className="h-64">
                <Line data={revenueLineData} options={lineOpts((v) => fmtCurrency(v))} />
              </div>
            </ChartCard>

            {/* Pipeline funnel */}
            <ChartCard title="Quote Pipeline" sub="All-time conversion funnel">
              <div className="space-y-3 pt-2">
                {[
                  { label: 'Created', count: pipeline.new + pipeline.sent + pipeline.won + pipeline.lost, color: 'bg-slate-200' },
                  { label: 'Sent to Client', count: pipeline.sent + pipeline.won, color: 'bg-amber-200' },
                  { label: 'Won', count: pipeline.won, color: 'bg-amber-500' },
                  { label: 'Lost', count: pipeline.lost, color: 'bg-red-300' },
                ].map((stage) => (
                  <div key={stage.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground">{stage.label}</span>
                      <span className="font-semibold tabular-nums">{stage.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${stage.color} transition-all`}
                        style={{ width: `${(stage.count / Math.max(pipeline.new + pipeline.sent + pipeline.won + pipeline.lost, 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-3 border-t">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Win Rate</span>
                    <span className={`font-bold text-sm ${data.winRate >= 30 ? 'text-green-600' : 'text-amber-600'}`}>{data.winRate}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Avg Deal</span>
                    <span className="font-bold text-sm text-foreground">{fmtCurrency(data.avgDealValue)}</span>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Quotes created per month */}
            <ChartCard title="Quotes Created / Month" sub="Volume of quotes created over time">
              <div className="h-52">
                <Bar data={quoteBarData} options={barOpts()} />
              </div>
            </ChartCard>

            {/* Motor vs Manual donut */}
            <ChartCard title="Operation Type Mix" sub="Motorized vs Manual across all quotes">
              <div className="h-52">
                <Doughnut data={motorDonutData} options={donutOpts} />
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        {/* ── SALES TAB ── */}
        <TabsContent value="sales" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <KpiCard icon={DollarSign} label="Total Won Value (YTD)" value={fmtCurrency(data.ytdRevenue)} color="amber" />
            <KpiCard icon={Target} label="Win Rate" value={`${data.winRate}%`} sub={`${pipeline.won} won deals`} color="green" />
            <KpiCard icon={BarChart3} label="Avg Deal Size" value={fmtCurrency(data.avgDealValue)} color="purple" />
          </div>

          <ChartCard title="Top Products by Units Sold" sub="Ranked by quantity across all non-draft quotes">
            <div className="h-64">
              <Bar
                data={topProductsData}
                options={{
                  ...barOpts(undefined, true),
                  indexAxis: 'y',
                  scales: {
                    x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } } },
                    y: { grid: { display: false }, ticks: { font: { size: 10 } } },
                  },
                }}
              />
            </div>
          </ChartCard>

          {/* Top products table with revenue breakdown */}
          <ChartCard title="Product Revenue Breakdown" sub="Estimated revenue per product category from won quotes">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs font-medium text-muted-foreground">Product</th>
                    <th className="text-right py-2 text-xs font-medium text-muted-foreground">Units</th>
                    <th className="text-right py-2 text-xs font-medium text-muted-foreground">Est. Revenue</th>
                    <th className="py-2 w-32 text-xs font-medium text-muted-foreground">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.topProducts.map((p) => {
                    const totalRev = data.topProducts.reduce((s, x) => s + x.revenue, 0)
                    const pct = totalRev > 0 ? (p.revenue / totalRev) * 100 : 0
                    return (
                      <tr key={p.name} className="hover:bg-muted/30">
                        <td className="py-2.5 font-medium">{p.name}</td>
                        <td className="py-2.5 text-right tabular-nums">{p.count}</td>
                        <td className="py-2.5 text-right tabular-nums text-amber-700 font-medium">{fmtCurrency(p.revenue)}</td>
                        <td className="py-2.5 pl-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(pct)}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </TabsContent>

        {/* ── PRODUCTS TAB ── */}
        <TabsContent value="products" className="space-y-4 mt-4">
          {/* KPI row */}
          <div className="grid sm:grid-cols-3 gap-3">
            <KpiCard icon={BarChart3} label="Product Types" value={String(data.topProducts.length)} sub="Distinct product categories" color="amber" />
            <KpiCard icon={TrendingUp} label="Best Seller" value={data.topProducts[0]?.name ?? '—'} sub={data.topProducts[0] ? `${data.topProducts[0].count} units sold` : undefined} color="green" />
            <KpiCard icon={DollarSign} label="Top Revenue Product" value={data.topProducts.slice().sort((a,b)=>b.revenue-a.revenue)[0]?.name ?? '—'} sub={data.topProducts[0] ? fmtCurrency(data.topProducts.slice().sort((a,b)=>b.revenue-a.revenue)[0]?.revenue ?? 0) : undefined} color="purple" />
          </div>

          {/* Bar chart by type */}
          <ChartCard title="Units Sold by Product Type" sub="All non-draft quotes, ranked by quantity">
            <div className="h-72">
              <Bar
                data={{
                  labels: data.topProducts.map(p => p.name),
                  datasets: [{
                    label: 'Units Sold',
                    data: data.topProducts.map(p => p.count),
                    backgroundColor: [
                      'rgba(217,119,6,0.8)', 'rgba(251,191,36,0.8)', 'rgba(245,158,11,0.8)',
                      'rgba(180,83,9,0.8)', 'rgba(146,64,14,0.8)', 'rgba(92,45,145,0.8)',
                      'rgba(59,130,246,0.8)', 'rgba(16,185,129,0.8)',
                    ],
                    borderRadius: 6,
                  }],
                }}
                options={{
                  ...barOpts(undefined, true),
                  indexAxis: 'y',
                  scales: {
                    x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } } },
                    y: { grid: { display: false }, ticks: { font: { size: 11 } } },
                  },
                }}
              />
            </div>
          </ChartCard>

          {/* Revenue by type chart */}
          <ChartCard title="Revenue by Product Type" sub="Estimated revenue contribution per type">
            <div className="h-64">
              <Bar
                data={{
                  labels: data.topProducts.slice().sort((a,b) => b.revenue - a.revenue).map(p => p.name),
                  datasets: [{
                    label: 'Est. Revenue ($)',
                    data: data.topProducts.slice().sort((a,b) => b.revenue - a.revenue).map(p => p.revenue),
                    backgroundColor: 'rgba(59,130,246,0.75)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    borderRadius: 5,
                  }],
                }}
                options={{
                  ...barOpts((v: any) => fmtCurrency(v), true),
                  indexAxis: 'y',
                  scales: {
                    x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v: any) => fmtCurrency(v) } },
                    y: { grid: { display: false }, ticks: { font: { size: 11 } } },
                  },
                }}
              />
            </div>
          </ChartCard>

          {/* Detailed table */}
          <ChartCard title="Full Product Type Report" sub="Units sold, revenue, and market share per type">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-xs font-medium text-muted-foreground">#</th>
                    <th className="text-left py-2 text-xs font-medium text-muted-foreground">Product Type</th>
                    <th className="text-right py-2 text-xs font-medium text-muted-foreground">Units Sold</th>
                    <th className="text-right py-2 text-xs font-medium text-muted-foreground">Est. Revenue</th>
                    <th className="text-right py-2 text-xs font-medium text-muted-foreground">Avg / Unit</th>
                    <th className="py-2 w-36 text-xs font-medium text-muted-foreground">Unit Share</th>
                    <th className="py-2 w-36 text-xs font-medium text-muted-foreground">Revenue Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.topProducts.slice().sort((a,b) => b.revenue - a.revenue).map((p, i) => {
                    const totalUnits = data.topProducts.reduce((s,x) => s + x.count, 0)
                    const totalRev = data.topProducts.reduce((s,x) => s + x.revenue, 0)
                    const unitPct = totalUnits > 0 ? (p.count / totalUnits) * 100 : 0
                    const revPct = totalRev > 0 ? (p.revenue / totalRev) * 100 : 0
                    const avgUnit = p.count > 0 ? p.revenue / p.count : 0
                    return (
                      <tr key={p.name} className="hover:bg-muted/30">
                        <td className="py-2.5 text-muted-foreground text-xs">{i + 1}</td>
                        <td className="py-2.5 font-medium">{p.name}</td>
                        <td className="py-2.5 text-right tabular-nums">{p.count.toLocaleString()}</td>
                        <td className="py-2.5 text-right tabular-nums font-medium text-amber-700">{fmtCurrency(p.revenue)}</td>
                        <td className="py-2.5 text-right tabular-nums text-muted-foreground">{fmtCurrency(avgUnit)}</td>
                        <td className="py-2.5 pl-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full bg-amber-400" style={{ width: `${unitPct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(unitPct)}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 pl-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full bg-blue-400" style={{ width: `${revPct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(revPct)}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t bg-muted/20">
                  <tr>
                    <td colSpan={2} className="py-2.5 font-semibold text-xs">Total</td>
                    <td className="py-2.5 text-right tabular-nums font-semibold text-xs">{data.topProducts.reduce((s,p) => s + p.count, 0).toLocaleString()}</td>
                    <td className="py-2.5 text-right tabular-nums font-semibold text-amber-700 text-xs">{fmtCurrency(data.topProducts.reduce((s,p) => s + p.revenue, 0))}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </ChartCard>
        </TabsContent>

        {/* ── CUSTOMERS TAB ── */}
        <TabsContent value="customers" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <KpiCard icon={Users} label="Total Customers" value={data.totalCustomers.toLocaleString()} color="blue" />
            <KpiCard icon={TrendingUp} label="New This Month" value={String(data.newCustomersThisMonth)} color="green" />
            <KpiCard icon={PieChart} label="Lead Sources" value={`${data.leadSourceData.length}`} sub="Active acquisition channels" color="purple" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Customer Growth" sub="New customers per month (last 12 months)">
              <div className="h-56">
                <Line data={customerGrowthData} options={lineOpts()} />
              </div>
            </ChartCard>

            <ChartCard title="Lead Source Distribution" sub="Where customers are coming from">
              <div className="h-56">
                {data.leadSourceData.length > 0
                  ? <Doughnut data={leadDonutData} options={donutOpts} />
                  : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No lead source data yet</div>
                }
              </div>
            </ChartCard>
          </div>

          {/* Lead source table */}
          {data.leadSourceData.length > 0 && (
            <ChartCard title="Lead Source Details">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-xs font-medium text-muted-foreground">Source</th>
                      <th className="text-right py-2 text-xs font-medium text-muted-foreground">Customers</th>
                      <th className="py-2 text-xs font-medium text-muted-foreground">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.leadSourceData.map((l, i) => {
                      const total = data.leadSourceData.reduce((s, x) => s + x.count, 0)
                      const pct = total > 0 ? (l.count / total) * 100 : 0
                      return (
                        <tr key={l.source} className="hover:bg-muted/30">
                          <td className="py-2.5 flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: leadColors[i % leadColors.length] }} />
                            <span className="font-medium">{l.source}</span>
                          </td>
                          <td className="py-2.5 text-right tabular-nums font-medium">{l.count}</td>
                          <td className="py-2.5 pl-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(pct)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}
        </TabsContent>

        {/* ── FINANCE TAB ── */}
        <TabsContent value="finance" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-4 gap-3">
            <KpiCard icon={CheckCircle} label="Invoices Paid" value={`$${data.invoiceStats.totalPaid.toLocaleString()}`}
              sub={`${data.invoiceStats.paid} invoices`} color="green" />
            <KpiCard icon={Clock} label="Outstanding" value={`$${data.invoiceStats.totalOutstanding.toLocaleString()}`}
              sub={`${data.invoiceStats.sent} invoices`} color="blue" />
            <KpiCard icon={AlertTriangle} label="Overdue" value={`$${data.invoiceStats.totalOverdue.toLocaleString()}`}
              sub={`${data.invoiceStats.overdue} invoices`} color={data.invoiceStats.overdue > 0 ? 'red' : 'green'} />
            <KpiCard icon={DollarSign} label="MTD Expenses" value={fmtCurrency(data.mtdExpenses)} color="slate" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Invoice Status Overview" sub="By dollar value">
              <div className="h-56">
                <Doughnut data={invoiceDonutData} options={donutOpts} />
              </div>
            </ChartCard>

            <ChartCard title="Expenses by Category" sub="Last 12 months">
              <div className="h-56">
                {data.expensesByCategory.length > 0
                  ? <Bar data={expenseBarData} options={{ ...barOpts((v) => fmtCurrency(v), true), indexAxis: 'y', scales: { x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v: any) => fmtCurrency(v) } }, y: { grid: { display: false }, ticks: { font: { size: 10 } } } } }} />
                  : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No expense data yet</div>
                }
              </div>
            </ChartCard>
          </div>

          {/* DSO explainer */}
          <ChartCard title="Days Sales Outstanding (DSO)" sub="How quickly outstanding invoices are being collected">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-5xl font-bold ${data.dso <= 30 ? 'text-green-600' : data.dso <= 45 ? 'text-amber-600' : 'text-red-600'}`}>
                  {data.dso}
                </div>
                <div className="text-xs text-muted-foreground mt-1">days</div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Excellent: &lt; 30 days</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">Acceptable: 30–45 days</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Action needed: &gt; 45 days</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  DSO = (Outstanding Receivables / Revenue Last 90 Days) × 90
                </p>
              </div>
            </div>
          </ChartCard>
        </TabsContent>

        {/* ── ALERTS TAB ── */}
        <TabsContent value="alerts" className="space-y-3 mt-4">
          <div className="rounded-xl border bg-white dark:bg-[#111] overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Automated Alerts</p>
                <p className="text-xs text-muted-foreground mt-0.5">Real-time flags on key business metrics</p>
              </div>
              <Badge variant="outline" className={highAlerts.length > 0 ? 'text-red-700 border-red-200 bg-red-50' : 'text-green-700 border-green-200 bg-green-50'}>
                {highAlerts.length > 0 ? `${highAlerts.length} high priority` : 'All clear'}
              </Badge>
            </div>
            <div className="divide-y">
              {data.alerts.map((alert, i) => {
                const styles = {
                  high: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-l-red-500', icon: <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />, badge: 'bg-red-100 text-red-700' },
                  medium: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-l-amber-500', icon: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />, badge: 'bg-amber-100 text-amber-700' },
                  low: { bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-l-green-500', icon: <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />, badge: 'bg-green-100 text-green-700' },
                }
                const s = styles[alert.severity]
                return (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3.5 border-l-4 ${s.bg} ${s.border}`}>
                    {s.icon}
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{alert.message}</p>
                      <span className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mt-1 ${s.badge}`}>
                        {alert.severity === 'low' ? 'healthy' : alert.severity}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alert thresholds info */}
          <div className="rounded-xl border bg-white dark:bg-[#111] p-4 space-y-3">
            <p className="text-sm font-semibold">Alert Thresholds</p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
              {[
                { metric: 'Overdue Invoices', threshold: 'Any overdue invoice triggers a High alert' },
                { metric: 'DSO', threshold: '> 30 days = Medium, > 45 days = High' },
                { metric: 'Win Rate', threshold: '< 20% = High, < 30% = Medium (min. 5 quotes)' },
                { metric: 'Monthly Revenue', threshold: '< 50% of goal after day 15 = Medium' },
              ].map((t) => (
                <div key={t.metric} className="flex gap-2">
                  <span className="font-medium text-foreground min-w-[120px]">{t.metric}:</span>
                  <span>{t.threshold}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Set Goals Dialog ── */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Set Monthly Goals</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Monthly Revenue Goal ($)</Label>
              <Input type="number" min={0} value={draftGoal.revenueGoal}
                onChange={(e) => setDraftGoal({ ...draftGoal, revenueGoal: Number(e.target.value) })} placeholder="e.g. 50000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Monthly Quotes Goal</Label>
              <Input type="number" min={0} value={draftGoal.quotesGoal}
                onChange={(e) => setDraftGoal({ ...draftGoal, quotesGoal: Number(e.target.value) })} placeholder="e.g. 30" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Monthly New Customers Goal</Label>
              <Input type="number" min={0} value={draftGoal.customersGoal}
                onChange={(e) => setDraftGoal({ ...draftGoal, customersGoal: Number(e.target.value) })} placeholder="e.g. 20" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveGoal} disabled={savingGoal} className="bg-amber-600 hover:bg-amber-700 text-white">
              {savingGoal ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Goals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
