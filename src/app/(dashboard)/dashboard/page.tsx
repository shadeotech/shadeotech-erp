'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import Link from 'next/link'
import {
  Users, FileText, Star, Share2, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Loader2, UserPlus, RefreshCw,
  ClipboardList, CalendarDays, TrendingUp, Target, Clock, Plus,
} from 'lucide-react'
import { AddAppointmentModal } from '../calendar/AddAppointmentModal'
import { cn, formatCurrency } from '@/lib/utils'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

// ─── Permission helper ────────────────────────────────────────────────────────
function canViewSales(user: any): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  const perm = user.permissions?.VIEW_SALES
  return !!perm && perm !== 'no'
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_ABBR = ['Su','Mo','Tu','We','Th','Fr','Sa']

const CAL_EVENT_COLORS: Record<string, string> = {
  APPOINTMENT: '#c8864e', appointment: '#c8864e',
  MEETING: '#3b82f6', meeting: '#3b82f6',
  FOLLOW_UP: '#10b981', follow_up: '#10b981',
  REMINDER: '#f59e0b', reminder: '#f59e0b',
  TASK: '#8b5cf6', task: '#8b5cf6',
}
const DEFAULT_CAL_COLOR = '#6b7280'

function MonthCalendar({
  events, selectedDay, onDayClick, navYear, navMonth, onPrev, onNext,
}: {
  events: any[]
  selectedDay: number
  onDayClick: (day: number) => void
  navYear: number
  navMonth: number
  onPrev: () => void
  onNext: () => void
}) {
  const today = new Date()
  const isCurrentMonth = navYear === today.getFullYear() && navMonth === today.getMonth()
  const todayDate = isCurrentMonth ? today.getDate() : -1

  const firstDow = new Date(navYear, navMonth, 1).getDay()
  const totalDays = new Date(navYear, navMonth + 1, 0).getDate()

  const eventsByDay: Record<number, any[]> = {}
  events.forEach((e) => {
    const d = new Date(e.start)
    if (d.getFullYear() === navYear && d.getMonth() === navMonth) {
      const day = d.getDate()
      if (!eventsByDay[day]) eventsByDay[day] = []
      eventsByDay[day].push({ ...e, _startD: d })
    }
  })

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={onPrev} className="p-1.5 rounded hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <p className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">
          {MONTH_NAMES[navMonth]} {navYear}
        </p>
        <button type="button" onClick={onNext} className="p-1.5 rounded hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_ABBR.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
        {cells.map((day, i) => {
          const isToday = day === todayDate
          const isSelected = day !== null && day === selectedDay && isCurrentMonth
          const dayEvs = day ? (eventsByDay[day] ?? []) : []
          const SHOW = 2
          const overflow = Math.max(0, dayEvs.length - SHOW)
          return (
            <div
              key={i}
              className={cn(
                'min-h-[80px] p-1 bg-white dark:bg-[#1a1a1a] flex flex-col transition-colors',
                day !== null && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#222]',
                isSelected && 'bg-[#fdf8f4] dark:bg-[#1f1710]',
                !day && 'bg-gray-50/80 dark:bg-gray-900/30',
              )}
              onClick={() => day && onDayClick(day)}
            >
              {day !== null && (
                <>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={cn(
                      'text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full shrink-0',
                      isToday && 'bg-[#c8864e] text-white font-bold',
                      !isToday && isSelected && 'text-[#c8864e] font-bold',
                      !isToday && !isSelected && 'text-gray-600 dark:text-[#c8beb5]',
                    )}>
                      {day}
                    </span>
                    {dayEvs.length > 0 && (
                      <span className="text-[8px] text-gray-400 dark:text-gray-500 leading-none">
                        {dayEvs.length} {dayEvs.length === 1 ? 'event' : 'events'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {dayEvs.slice(0, SHOW).map((ev: any, j: number) => {
                      const color = CAL_EVENT_COLORS[ev.type] ?? DEFAULT_CAL_COLOR
                      const t = (ev._startD as Date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                      return (
                        <div key={j} className="rounded border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800 overflow-hidden">
                          <div className="h-[3px] w-8" style={{ backgroundColor: color }} />
                          <div className="px-1 pb-0.5 pt-0.5">
                            <span className="truncate text-[9px] text-gray-700 dark:text-gray-200 leading-tight block">
                              {t} {ev.title}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {overflow > 0 && (
                      <span className="text-[9px] text-muted-foreground pl-0.5">+{overflow} more</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Data hook ────────────────────────────────────────────────────────────────
function useAdminData(showSales: boolean) {
  const { token } = useAuthStore()
  const [approvals, setApprovals] = useState<any[]>([])
  const [referrals, setReferrals] = useState<any[]>([])
  const [stats, setStats] = useState({ customers: 0, quotes: 0, openLeads: 0, revenue: 0 })
  const [monthEvents, setMonthEvents] = useState<any[]>([])
  const [taskCount, setTaskCount] = useState(0)
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number; quotes: number }[]>([])
  const [thisMonth, setThisMonth] = useState({ revenue: 0, quotes: 0, customers: 0 })
  const [goals, setGoals] = useState({ revenueGoal: 0, annualRevenueGoal: 0, quotesGoal: 0, customersGoal: 0 })
  const [topProducts, setTopProducts] = useState<{ name: string; count: number }[]>([])
  const [motorStats, setMotorStats] = useState({ motorized: 0, manual: 0 })
  const [pipelineData, setPipelineData] = useState<{ label: string; count: number }[]>([])
  const [leadSourceData, setLeadSourceData] = useState<{ source: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const h = { Authorization: `Bearer ${token}` }

    // Fetch 3 months of events (prev + current + next) to support calendar navigation
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59)

    const fetches: Promise<any>[] = [
      fetch('/api/admin/pending-approvals', { headers: h }),
      fetch('/api/admin/referrals?limit=10', { headers: h }),
      fetch('/api/customers', { headers: h }),
      fetch(`/api/calendar/events?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`, { headers: h }),
      fetch('/api/tasks?myTasks=true', { headers: h }),
    ]
    if (showSales) {
      fetches.push(fetch('/api/quotes', { headers: h }))
      fetches.push(fetch('/api/admin/analytics', { headers: h }))
      fetches.push(fetch('/api/admin/goals', { headers: h }))
    }

    try {
      const results = await Promise.allSettled(fetches)
      const get = async (r: PromiseSettledResult<Response>) => {
        if (r.status === 'fulfilled' && r.value.ok) return r.value.json().catch(() => null)
        return null
      }
      const [appD, refD, custD, calD, taskD, quoteD, analyticsD, goalsD] = await Promise.all(results.map(get))

      if (appD) setApprovals(appD.approvals ?? [])
      if (refD) setReferrals(refD.referrals ?? [])
      if (custD) {
        const custs = custD.customers ?? []
        setStats((s) => ({
          ...s,
          customers: custs.length,
          openLeads: custs.filter((c: any) => c.status === 'LEAD' || c.status === 'CONTACTED').length,
        }))
      }
      if (calD) setMonthEvents(calD.events ?? [])
      if (taskD) setTaskCount((taskD.tasks ?? []).filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length)

      if (showSales) {
        if (quoteD) {
          const qs = quoteD.quotes ?? []
          const revenue = qs
            .filter((q: any) => q.status === 'WON' || q.status === 'ACCEPTED')
            .reduce((s: number, q: any) => s + (q.totalAmount ?? 0), 0)
          setStats((prev) => ({ ...prev, quotes: qs.length, revenue }))

          setPipelineData([
            { label: 'Draft', count: qs.filter((q: any) => q.status === 'DRAFT').length },
            { label: 'Sent', count: qs.filter((q: any) => q.status === 'SENT').length },
            { label: 'Negotiation', count: qs.filter((q: any) => q.status === 'NEGOTIATION').length },
            { label: 'Won', count: qs.filter((q: any) => q.status === 'WON').length },
          ])
        }
        if (analyticsD) {
          setMonthlyData(analyticsD.monthlyData ?? [])
          setThisMonth({
            revenue: analyticsD.thisMonthRevenue ?? 0,
            quotes: analyticsD.thisMonthQuotes ?? 0,
            customers: analyticsD.thisMonthCustomers ?? 0,
          })
          setTopProducts(analyticsD.topProducts ?? [])
          setMotorStats(analyticsD.motorStats ?? { motorized: 0, manual: 0 })
          setLeadSourceData(analyticsD.leadSourceData ?? [])
        }
        if (goalsD) setGoals(goalsD.goal ?? { revenueGoal: 0, annualRevenueGoal: 0, quotesGoal: 0, customersGoal: 0 })
      }
    } finally {
      setLoading(false)
    }
  }, [token, showSales])

  const handleApproval = useCallback(async (id: string, action: 'approve' | 'reject') => {
    if (!token) return
    setApprovingId(id)
    try {
      const res = await fetch('/api/admin/pending-approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action }),
      })
      if (res.ok) setApprovals((prev) => prev.filter((a) => a.id !== id))
    } finally {
      setApprovingId(null)
    }
  }, [token])

  const saveGoals = useCallback(async (newGoals: typeof goals) => {
    if (!token) return
    await fetch('/api/admin/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newGoals),
    })
    setGoals(newGoals)
  }, [token])

  useEffect(() => { fetchAll() }, [fetchAll])

  return {
    approvals, referrals, stats, monthEvents, taskCount,
    monthlyData, thisMonth, goals, topProducts, motorStats, pipelineData, leadSourceData,
    loading, approvingId, handleApproval, saveGoals, refetch: fetchAll,
  }
}

// ─── Shared number formatter ──────────────────────────────────────────────────
function fmtNum(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`
  if (v >= 1_000) return `${Math.round(v / 1_000).toLocaleString()}K`
  return Math.round(v).toLocaleString()
}
function fmtFull(v: number): string {
  return Math.round(v).toLocaleString()
}

// ─── Gauge chart (clip-path approach for perfect semicircle) ──────────────────
function GaugeChart({ value, target }: { value: number; target: number }) {
  const pct = target > 0 ? Math.min(1, value / target) : 0
  const cx = 110, cy = 112, R = 82
  // Full circle path starting at 9-o'clock (leftmost), going clockwise through 4 quarter-arcs.
  // Clipped to upper half → perfect semicircle regardless of browser arc quirks.
  const circlePath = [
    `M ${cx - R} ${cy}`,
    `A ${R} ${R} 0 0 1 ${cx} ${cy - R}`,   // 9→12 o'clock (upper-left)
    `A ${R} ${R} 0 0 1 ${cx + R} ${cy}`,   // 12→3 o'clock (upper-right)
    `A ${R} ${R} 0 0 1 ${cx} ${cy + R}`,   // 3→6 o'clock (lower-right)
    `A ${R} ${R} 0 0 1 ${cx - R} ${cy}`,   // 6→9 o'clock (lower-left)
  ].join(' ')
  // pathLength=200 → upper half = 100 units; fill from start to pct*100
  const FULL_LEN = 200
  const fillDashoffset = FULL_LEN - pct * (FULL_LEN / 2)

  const fillAngle = 180 - pct * 180
  const needleX = cx + (R - 14) * Math.cos((fillAngle * Math.PI) / 180)
  const needleY = cy - (R - 14) * Math.sin((fillAngle * Math.PI) / 180)
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1]

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 152" className="w-full max-w-[260px]">
        <defs>
          <linearGradient id="gaugeArcGrad" gradientUnits="userSpaceOnUse" x1={cx - R} y1="0" x2={cx + R} y2="0">
            <stop offset="0%" stopColor="#e8c9a0" />
            <stop offset="40%" stopColor="#c8864e" />
            <stop offset="75%" stopColor="#a36b3a" />
            <stop offset="100%" stopColor="#7a5230" />
          </linearGradient>
          {/* Clip to upper half only — guarantees perfect semicircle */}
          <clipPath id="gaugeHalfClip">
            <rect x={cx - R - 20} y={0} width={R * 2 + 40} height={cy + 1} />
          </clipPath>
        </defs>
        {/* Track — full circle, clipped to upper half */}
        <path d={circlePath} fill="none" stroke="#E5E7EB" strokeWidth="14"
          strokeLinecap="round" clipPath="url(#gaugeHalfClip)" className="dark:stroke-gray-700" />
        {/* Fill — same circle path with dasharray */}
        {pct > 0.005 && (
          <path d={circlePath} fill="none" stroke="url(#gaugeArcGrad)" strokeWidth="14"
            strokeLinecap="round" clipPath="url(#gaugeHalfClip)"
            pathLength={FULL_LEN}
            strokeDasharray={`${FULL_LEN} ${FULL_LEN}`}
            strokeDashoffset={fillDashoffset} />
        )}
        {/* Target marker at right end */}
        <polygon points={`${cx + R + 3},${cy - 7} ${cx + R + 3},${cy + 7} ${cx + R + 13},${cy}`} fill="#374151" className="dark:fill-gray-400" />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#111827" strokeWidth="2.5" strokeLinecap="round" className="dark:stroke-gray-200" />
        <circle cx={cx} cy={cy} r="5" fill="#111827" className="dark:fill-gray-200" />
        <circle cx={cx} cy={cy} r="2" fill="white" className="dark:fill-gray-900" />
        {/* Tick labels */}
        {ticks.map(t => {
          const angle = 180 - t * 180
          const lx = cx + (R + 18) * Math.cos((angle * Math.PI) / 180)
          const ly = cy - (R + 18) * Math.sin((angle * Math.PI) / 180)
          return <text key={t} x={lx} y={ly + 3} textAnchor="middle" fontSize="8" fill="#9CA3AF">{fmtNum(t * target)}</text>
        })}
      </svg>
      <div className="flex justify-between w-full px-6 -mt-2">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actual</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-[#e8e2db]">{fmtNum(value)}</p>
          <p className="text-[10px] text-muted-foreground">{fmtFull(value)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-[#e8e2db]">{fmtNum(target)}</p>
          <p className="text-[10px] text-muted-foreground">{fmtFull(target)}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Monthly target gradient bar ──────────────────────────────────────────────
function MonthlyTargetBar({ actual, target }: { actual: number; target: number }) {
  const maxVal = Math.max(actual, target, 1)
  const actualPct = Math.min(100, (actual / maxVal) * 100)
  return (
    <div className="space-y-1">
      <div className="relative h-8 bg-gray-100 dark:bg-gray-700/50 rounded-xl overflow-hidden">
        <div className="h-full rounded-xl transition-all duration-700"
          style={{ width: `${actualPct}%`, background: 'linear-gradient(90deg, #e8c9a0 0%, #c8864e 45%, #a36b3a 80%, #7a5230 100%)' }} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        {[0, 0.25, 0.5, 0.75, 1].map(t => <span key={t}>{fmtNum(t * maxVal)}</span>)}
      </div>
      <div className="flex justify-between pt-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Monthly Actual</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-[#e8e2db]">{fmtNum(actual)}</p>
          <p className="text-[10px] text-muted-foreground">{fmtFull(actual)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">This Month&apos;s Target</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-[#e8e2db]">{fmtNum(target)}</p>
          <p className="text-[10px] text-muted-foreground">{fmtFull(target)}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Pipeline funnel ──────────────────────────────────────────────────────────
const PIPELINE_STATUS_MAP: Record<string, string> = {
  Draft: 'DRAFT', Sent: 'SENT', Negotiation: 'NEGOTIATION', Won: 'WON',
}

function PipelineFunnel({ stages }: { stages: { label: string; count: number }[] }) {
  const router = useRouter()
  if (!stages.length || stages.every(s => s.count === 0)) {
    return <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No pipeline data yet</div>
  }
  const maxCount = Math.max(...stages.map(s => s.count), 1)
  const CHART_H = 130, BAR_W = 36, GAP = 18, PAD_L = 16
  const totalW = stages.length * BAR_W + (stages.length - 1) * GAP + PAD_L * 2
  const barX = (i: number) => PAD_L + i * (BAR_W + GAP)
  const barH = (c: number) => Math.max(4, (c / maxCount) * CHART_H)
  const topY = (c: number) => CHART_H - barH(c)
  const totalNew = stages[0]?.count ?? 0
  const totalWon = stages[stages.length - 1]?.count ?? 0
  const convPct = totalNew > 0 ? Math.round((totalWon / totalNew) * 100) : 0

  return (
    <div>
      <svg viewBox={`0 0 ${totalW} ${CHART_H + 38}`} className="w-full overflow-visible">
        {[0.5, 1].map(t => (
          <line key={t} x1={PAD_L} y1={CHART_H - t * CHART_H} x2={totalW - PAD_L} y2={CHART_H - t * CHART_H}
            stroke="#E5E7EB" strokeWidth="0.5" className="dark:stroke-gray-700" />
        ))}
        {stages.map((stage, i) => {
          const next = stages[i + 1]; if (!next) return null
          const x1 = barX(i) + BAR_W, x2 = barX(i + 1)
          return <path key={`a${i}`} d={`M ${x1} ${topY(stage.count)} L ${x2} ${topY(next.count)} L ${x2} ${CHART_H} L ${x1} ${CHART_H} Z`} fill="rgba(200,134,78,0.12)" />
        })}
        {stages.map((stage, i) => {
          const x = barX(i), h = barH(stage.count), y = topY(stage.count)
          const next = stages[i + 1]
          const stepConv = next && stage.count > 0 ? Math.round((next.count / stage.count) * 100) : null
          const isWon = i === stages.length - 1
          const statusParam = PIPELINE_STATUS_MAP[stage.label] ?? stage.label.toUpperCase()
          return (
            <g key={stage.label} className="cursor-pointer" onClick={() => router.push(`/quotes?status=${statusParam}`)}>
              <rect x={x} y={y} width={BAR_W} height={h} fill={isWon ? '#a36b3a' : '#c8864e'} rx={3} />
              <text x={x + BAR_W / 2} y={y - 5} textAnchor="middle" fontSize={10} fontWeight="700" fill="#374151" className="dark:fill-gray-300">{stage.count}</text>
              <text x={x + BAR_W / 2} y={CHART_H + 13} textAnchor="middle" fontSize={9} fill="#6B7280">{stage.label}</text>
              {stepConv !== null && (
                <g transform={`translate(${x + BAR_W + GAP / 2 - 11},${(y + topY(next!.count)) / 2 - 8})`}>
                  <rect width="22" height="15" rx="7" fill="white" stroke="#E5E7EB" strokeWidth="1" className="dark:fill-gray-800 dark:stroke-gray-700" />
                  <text x="11" y="10.5" textAnchor="middle" fontSize="7" fontWeight="600" fill="#c8864e">{stepConv}%</text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
      {convPct > 0 && (
        <div className="text-center pt-2 mt-1 border-t border-border">
          <p className="text-xl font-bold text-[#c8864e]">{convPct}%</p>
          <p className="text-[10px] text-muted-foreground">overall conversion to Won</p>
        </div>
      )}
    </div>
  )
}

// ─── Goals dialog ─────────────────────────────────────────────────────────────
function GoalsDialog({
  open, onClose, goals, onSave,
}: {
  open: boolean
  onClose: () => void
  goals: { revenueGoal: number; annualRevenueGoal: number; quotesGoal: number; customersGoal: number }
  onSave: (g: typeof goals) => Promise<void>
}) {
  const [form, setForm] = useState({ revenueGoal: '', annualRevenueGoal: '', quotesGoal: '', customersGoal: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm({
      revenueGoal: goals.revenueGoal > 0 ? goals.revenueGoal.toLocaleString() : '',
      annualRevenueGoal: goals.annualRevenueGoal > 0 ? goals.annualRevenueGoal.toLocaleString() : '',
      quotesGoal: goals.quotesGoal > 0 ? String(goals.quotesGoal) : '',
      customersGoal: goals.customersGoal > 0 ? String(goals.customersGoal) : '',
    })
  }, [open, goals])

  function handleNum(key: string, raw: string) {
    const digits = raw.replace(/[^0-9]/g, '')
    setForm((f) => ({ ...f, [key]: digits ? Number(digits).toLocaleString() : '' }))
  }
  function parse(s: string) { return Number(s.replace(/[^0-9]/g, '')) || 0 }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Set Goals</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          {[
            { label: 'Annual Revenue Goal ($)', key: 'annualRevenueGoal', placeholder: 'e.g. 1,500,000' },
            { label: 'Monthly Revenue Goal ($)', key: 'revenueGoal', placeholder: 'e.g. 150,000' },
            { label: 'Quotes Goal', key: 'quotesGoal', placeholder: 'e.g. 20' },
            { label: 'New Customers Goal', key: 'customersGoal', placeholder: 'e.g. 10' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={(form as any)[key]}
                onChange={(e) => handleNum(key, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            disabled={saving}
            className="bg-[#c8864e] hover:bg-[#b5733d] text-white"
            onClick={async () => {
              setSaving(true)
              await onSave({
                revenueGoal: parse(form.revenueGoal),
                annualRevenueGoal: parse(form.annualRevenueGoal),
                quotesGoal: parse(form.quotesGoal),
                customersGoal: parse(form.customersGoal),
              })
              setSaving(false)
              onClose()
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Goals'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GoalBar({ label, current, target, color = '#c8864e' }: { label: string; current: number; target: number; color?: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-gray-900 dark:text-[#e8e2db]">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {target > 999 ? formatCurrency(current) : current} / {target > 999 ? formatCurrency(target) : target}
      </p>
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  CONTACTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  PURCHASED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
}

// ─── Chart colour palette ─────────────────────────────────────────────────────
const PALETTE = [
  '#c8864e','#a36b3a','#d4a574','#7a5230','#e8c9a0',
  '#6b6b6b','#9a9a9a','#4a4a4a','#b8975a','#8c7355',
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'ADMIN'
  const showSales = canViewSales(user)

  const {
    approvals, referrals, stats, monthEvents, taskCount,
    monthlyData, thisMonth, goals, topProducts, motorStats, pipelineData, leadSourceData,
    loading, approvingId, handleApproval, saveGoals, refetch,
  } = useAdminData(showSales)

  const [goalsOpen, setGoalsOpen] = useState(false)
  const [apptOpen, setApptOpen] = useState(false)
  const [localEvents, setLocalEvents] = useState<any[]>([])
  const router = useRouter()

  const today = new Date()
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const [calNavYear, setCalNavYear] = useState(today.getFullYear())
  const [calNavMonth, setCalNavMonth] = useState(today.getMonth())

  const allCalendarEvents = [...monthEvents, ...localEvents]
  const selectedDayEvents = allCalendarEvents.filter((e) => {
    const d = new Date(e.start)
    return d.getDate() === selectedDay && d.getMonth() === calNavMonth && d.getFullYear() === calNavYear
  })

  const isSelectedToday = selectedDay === today.getDate() && calNavMonth === today.getMonth() && calNavYear === today.getFullYear()
  const selectedDateLabel = new Date(calNavYear, calNavMonth, selectedDay)
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Sales bar chart
  const revenueChartData = {
    labels: monthlyData.map((m) => m.month),
    datasets: [{
      label: 'Revenue',
      data: monthlyData.map((m) => m.revenue),
      backgroundColor: 'rgba(200,134,78,0.75)',
      borderColor: '#c8864e',
      borderWidth: 1,
      borderRadius: 4,
    }],
  }
  const revenueChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${formatCurrency(ctx.parsed.y)}` } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 }, callback: (v: any) => `$${(v / 1000).toFixed(0)}k` } },
    },
  }

  // Products horizontal bar chart
  const productChartData = {
    labels: topProducts.map((p) => p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name),
    datasets: [{
      label: 'Units',
      data: topProducts.map((p) => p.count),
      backgroundColor: topProducts.map((_, i) => PALETTE[i % PALETTE.length] + 'cc'),
      borderColor: topProducts.map((_, i) => PALETTE[i % PALETTE.length]),
      borderWidth: 1,
      borderRadius: 4,
    }],
  }
  const productChartOptions = {
    indexAxis: 'y' as const,
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.parsed.x} units` } } },
    scales: {
      x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 } } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  }

  // Motor doughnut
  const totalItems = motorStats.motorized + motorStats.manual
  const motorPct = totalItems > 0 ? Math.round((motorStats.motorized / totalItems) * 100) : 0
  const motorChartData = {
    labels: ['Motorized', 'Manual'],
    datasets: [{
      data: [motorStats.motorized, motorStats.manual],
      backgroundColor: ['rgba(200,134,78,0.8)', 'rgba(156,163,175,0.4)'],
      borderColor: ['#c8864e', 'rgba(156,163,175,0.6)'],
      borderWidth: 2,
    }],
  }
  const motorChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { font: { size: 11 }, padding: 12 } },
      tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed} items` } },
    },
    cutout: '65%',
  }

  const now = new Date()
  const greetHour = now.getHours()
  const greeting = greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-[#e8e2db]">
            {greeting}, {user?.firstName || 'there'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2 dark:border-[#2a2a2a]">
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className={cn('grid gap-4', showSales ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-3')}>
        <Link href="/customers">
          <Card className="hover:border-[#c8864e]/40 transition-colors cursor-pointer">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">Customers</p>
                <div className="h-8 w-8 rounded-lg bg-[#c8864e]/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#c8864e]" />
                </div>
              </div>
              {loading ? <div className="h-8 w-16 rounded bg-muted animate-pulse" /> : (
                <p className="text-3xl font-bold text-gray-900 dark:text-[#e8e2db]">{stats.customers}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stats.openLeads} open leads</p>
            </CardContent>
          </Card>
        </Link>

        {showSales && (
          <Link href="/quotes">
            <Card className="hover:border-[#c8864e]/40 transition-colors cursor-pointer">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">Quotes</p>
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                {loading ? <div className="h-8 w-16 rounded bg-muted animate-pulse" /> : (
                  <p className="text-3xl font-bold text-gray-900 dark:text-[#e8e2db]">{stats.quotes}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>
          </Link>
        )}

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Approvals</p>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            {loading ? <div className="h-8 w-16 rounded bg-muted animate-pulse" /> : (
              <p className="text-3xl font-bold text-gray-900 dark:text-[#e8e2db]">{approvals.length}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Pending points</p>
          </CardContent>
        </Card>

        {showSales && (
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">Won Revenue</p>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              {loading ? <div className="h-8 w-16 rounded bg-muted animate-pulse" /> : (
                <p className="text-2xl font-bold text-gray-900 dark:text-[#e8e2db]">{formatCurrency(stats.revenue)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Won &amp; accepted</p>
            </CardContent>
          </Card>
        )}

        <Link href="/tasks">
          <Card className="hover:border-[#c8864e]/40 transition-colors cursor-pointer">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">My Tasks</p>
                <div className="h-8 w-8 rounded-lg bg-stone-500/10 flex items-center justify-center">
                  <ClipboardList className="h-4 w-4 text-stone-500" />
                </div>
              </div>
              {loading ? <div className="h-8 w-16 rounded bg-muted animate-pulse" /> : (
                <p className="text-3xl font-bold text-gray-900 dark:text-[#e8e2db]">{taskCount}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Open tasks</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Revenue Targets */}
      {showSales && (
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#c8864e]" />
                  Annual Target
                </CardTitle>
                {isAdmin && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-[#c8864e] hover:text-[#c8864e]" onClick={() => setGoalsOpen(true)}>
                    Edit Goals
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                : <GaugeChart value={stats.revenue} target={goals.annualRevenueGoal > 0 ? goals.annualRevenueGoal : 1500000} />
              }
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-2 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#c8864e]" />
                  Monthly Target
                </CardTitle>
                {isAdmin && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-[#c8864e] hover:text-[#c8864e]" onClick={() => setGoalsOpen(true)}>Edit Goals</Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4 flex-1 flex flex-col justify-center">
              {loading
                ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                : <MonthlyTargetBar actual={thisMonth.revenue} target={goals.revenueGoal || 150000} />
              }
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar + Agenda */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#c8864e]" />
                Calendar
              </CardTitle>
              <div className="flex items-center gap-2">
                <Link href="/calendar" className="text-xs text-[#c8864e] hover:underline flex items-center gap-0.5">
                  Full calendar <ChevronRight className="h-3 w-3" />
                </Link>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-[#c8864e]/40 text-[#c8864e] hover:bg-[#c8864e]/10" onClick={() => setApptOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  New
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              : <MonthCalendar
                  events={allCalendarEvents}
                  selectedDay={selectedDay}
                  onDayClick={setSelectedDay}
                  navYear={calNavYear}
                  navMonth={calNavMonth}
                  onPrev={() => {
                    const d = new Date(calNavYear, calNavMonth - 1, 1)
                    setCalNavYear(d.getFullYear())
                    setCalNavMonth(d.getMonth())
                  }}
                  onNext={() => {
                    const d = new Date(calNavYear, calNavMonth + 1, 1)
                    setCalNavYear(d.getFullYear())
                    setCalNavMonth(d.getMonth())
                  }}
                />
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#c8864e]" />
              {isSelectedToday ? "Today's Agenda" : selectedDateLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              : selectedDayEvents.length === 0
              ? (
                <div className="text-center py-8">
                  <CalendarDays className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No events on this day</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((ev) => {
                    const start = new Date(ev.start)
                    const end = new Date(ev.end)
                    const color = CAL_EVENT_COLORS[ev.type] ?? DEFAULT_CAL_COLOR
                    return (
                      <div key={ev.id} className="flex items-start gap-2 rounded-lg border border-border p-3 overflow-hidden">
                        <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ev.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {ev.location && <p className="text-xs text-muted-foreground truncate">{ev.location}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }
          </CardContent>
        </Card>
      </div>

      {/* Sales chart */}
      {showSales && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#c8864e]" />
              Revenue — Last 6 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="flex items-center justify-center h-48"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              : <div className="h-48"><Bar data={revenueChartData} options={revenueChartOptions as any} /></div>
            }
          </CardContent>
        </Card>
      )}

      {/* Product sales + Motor stats */}
      {showSales && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top products */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#c8864e]" />
                Top Products Sold
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="flex items-center justify-center h-56"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                : topProducts.length === 0
                ? <div className="flex items-center justify-center h-56 text-sm text-muted-foreground">No product data yet</div>
                : (
                  <div style={{ height: `${Math.max(160, topProducts.length * 32)}px` }}>
                    <Bar data={productChartData} options={productChartOptions as any} />
                  </div>
                )
              }
            </CardContent>
          </Card>

          {/* Pipeline Conversion — compact 1/3 column */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#c8864e]" />
                Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                : <PipelineFunnel stages={pipelineData} />
              }
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Approvals + Recent Referrals */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Pending Points Approvals
              {approvals.length > 0 && (
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-0 text-xs">{approvals.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              : approvals.length === 0
              ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All caught up</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {approvals.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                        {a.type === 'GOOGLE_REVIEW' ? <Star className="h-4 w-4 text-amber-600" /> : <Share2 className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        {a.customerId
                          ? <Link href={`/customers/${a.customerId}`} className="text-sm font-medium hover:underline truncate block">{a.customerName}</Link>
                          : <p className="text-sm font-medium truncate">{a.customerName}</p>
                        }
                        <p className="text-xs text-muted-foreground">
                          {a.type === 'GOOGLE_REVIEW' ? 'Google Review' : 'Social Media'} · +{a.amount} pts · {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1" disabled={approvingId === a.id} onClick={() => handleApproval(a.id, 'approve')}>
                          {approvingId === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/10" disabled={approvingId === a.id} onClick={() => handleApproval(a.id, 'reject')}>
                          <XCircle className="h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#c8864e]" />
                Recent Referrals
              </CardTitle>
              <Link href="/referrals" className="text-xs text-[#c8864e] hover:underline flex items-center gap-0.5">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading
              ? <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              : referrals.length === 0
              ? (
                <div className="text-center py-8">
                  <UserPlus className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No referrals yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referrals.slice(0, 8).map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <div className="h-8 w-8 rounded-full bg-[#c8864e]/10 flex items-center justify-center shrink-0 text-[#c8864e] font-bold text-xs">
                        {r.referredName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.referredName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          by{' '}
                          {r.referrerCustomerId
                            ? <Link href={`/customers/${r.referrerCustomerId}`} className="hover:underline text-[#c8864e]">{r.referrerName}</Link>
                            : r.referrerName
                          }
                          {' · '}{new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={cn('text-xs border-0', STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-600')}>
                        {r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )
            }
          </CardContent>
        </Card>
      </div>

      {/* Lead Source chart */}
      {showSales && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Share2 className="h-4 w-4 text-[#c8864e]" />
                Lead Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="flex items-center justify-center h-48"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                : leadSourceData.length === 0
                ? <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No lead source data yet</div>
                : (
                  <div style={{ height: `${Math.max(160, leadSourceData.length * 30)}px` }}>
                    <Bar
                      data={{
                        labels: leadSourceData.map((d) => d.source),
                        datasets: [{
                          label: 'Customers',
                          data: leadSourceData.map((d) => d.count),
                          backgroundColor: leadSourceData.map((_, i) => PALETTE[i % PALETTE.length] + 'cc'),
                          borderColor: leadSourceData.map((_, i) => PALETTE[i % PALETTE.length]),
                          borderWidth: 1,
                          borderRadius: 4,
                        }],
                      }}
                      options={{
                        indexAxis: 'y' as const,
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { font: { size: 11 } } },
                          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
                        },
                      } as any}
                    />
                  </div>
                )
              }
            </CardContent>
          </Card>

          {/* Motorized Orders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Share2 className="h-4 w-4 text-[#c8864e]" />
                Motorized Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="flex items-center justify-center h-48"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                : totalItems === 0
                ? <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No data yet</div>
                : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-44 w-full">
                      <Doughnut data={motorChartData} options={motorChartOptions as any} />
                    </div>
                    <p className="text-2xl font-bold text-[#c8864e]">{motorPct}%</p>
                    <p className="text-xs text-muted-foreground text-center">
                      {motorStats.motorized} motorized · {motorStats.manual} manual
                    </p>
                  </div>
                )
              }
            </CardContent>
          </Card>
        </div>
      )}

      {isAdmin && (
        <GoalsDialog open={goalsOpen} onClose={() => setGoalsOpen(false)} goals={goals} onSave={saveGoals} />
      )}

      <AddAppointmentModal
        open={apptOpen}
        onOpenChange={setApptOpen}
        initialDate={new Date(today.getFullYear(), today.getMonth(), selectedDay)}
        isAdmin={isAdmin}
        defaultAssignedTo={user?._id ?? ''}
        onSave={(ev) => {
          setLocalEvents((prev) => [...prev, ev])
          setApptOpen(false)
        }}
      />
    </div>
  )
}
