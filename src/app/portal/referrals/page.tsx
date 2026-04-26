'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { format } from 'date-fns'
import {
  UserPlus,
  Star,
  Smartphone,
  Zap,
  Radio,
  Wifi,
  Gift,
  CheckCircle2,
  Clock,
  Users,
  Loader2,
  ChevronRight,
  ExternalLink,
  Trophy,
  X,
  Send,
} from 'lucide-react'
import { validatePhone, sanitizePhoneInput } from '@/lib/phoneValidation'

interface PointsTransaction {
  id: string
  type: string
  amount: number
  description: string
  status: string
  redemptionReward?: string
  createdAt: string
}

interface Referral {
  id: string
  referredName: string
  referredEmail: string
  referredPhone: string
  status: 'PENDING' | 'CONTACTED' | 'PURCHASED'
  pointsAwarded: boolean
  purchasedAt?: string
  createdAt: string
}

const REWARDS = [
  {
    id: 'MOTOR',
    name: 'Free Motor Upgrade',
    desc: 'Motorize any shade in your next order',
    icon: Zap,
    value: '$199',
    cost: 200,
    color: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
    iconColor: 'text-amber-500',
  },
  {
    id: 'REMOTE',
    name: 'Free Remote Control',
    desc: 'Handheld remote for your motorized shades',
    icon: Radio,
    value: '$49',
    cost: 200,
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    iconColor: 'text-blue-500',
  },
  {
    id: 'SMART_HUB',
    name: 'Free Smart Hub',
    desc: 'Control your shades from any smart home app',
    icon: Wifi,
    value: '$129',
    cost: 200,
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
    iconColor: 'text-emerald-500',
  },
]

const EARN_ACTIONS = [
  {
    id: 'referral',
    label: 'Refer a Friend',
    points: 200,
    desc: 'Earn when they make a purchase',
    icon: UserPlus,
    cta: 'Refer Now',
    action: 'form',
  },
  {
    id: 'GOOGLE_REVIEW',
    label: 'Leave a Google Review',
    points: 30,
    desc: 'Share your experience on Google',
    icon: Star,
    cta: 'Leave Review',
    action: 'google',
  },
  {
    id: 'SOCIAL_FOLLOW',
    label: 'Follow on Social Media',
    points: 10,
    desc: 'Follow @shadeotech on Instagram',
    icon: Smartphone,
    cta: 'Follow Us',
    action: 'social',
  },
]

const statusStyle = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  CONTACTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  PURCHASED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
}

export default function CustomerReferralsPage() {
  const { token, user } = useAuthStore()

  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<PointsTransaction[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)

  // Referral form
  const [referralOpen, setReferralOpen] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Earn actions
  const [claimingType, setClaimingType] = useState<string | null>(null)
  const [claimedTypes, setClaimedTypes] = useState<Set<string>>(new Set())

  // Redemption
  const [redeemingReward, setRedeemingReward] = useState<string | null>(null)
  const [redeemConfirm, setRedeemConfirm] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!token) { setLoading(false); return }
    try {
      const [pRes, rRes] = await Promise.all([
        fetch('/api/portal/points', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/portal/referrals', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (pRes.ok) {
        const d = await pRes.json()
        setBalance(d.balance ?? 0)
        setTransactions(d.transactions ?? [])
        const pendingTypes = new Set<string>(
          (d.transactions ?? [])
            .filter((t: PointsTransaction) => t.status !== 'REJECTED')
            .map((t: PointsTransaction) => t.type)
        )
        setClaimedTypes(pendingTypes)
      }
      if (rRes.ok) {
        const d = await rRes.json()
        setReferrals(d.referrals ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const handleEarnAction = async (actionId: string, actionType: string) => {
    if (actionType === 'form') { setReferralOpen(true); return }
    if (actionType === 'google') {
      window.open('https://maps.google.com/?q=Shadeotech', '_blank')
      // Submit claim
      if (!claimedTypes.has('GOOGLE_REVIEW')) await submitEarnClaim('GOOGLE_REVIEW')
      return
    }
    if (actionType === 'social') {
      window.open('https://instagram.com/shadeotech', '_blank')
      if (!claimedTypes.has('SOCIAL_FOLLOW')) await submitEarnClaim('SOCIAL_FOLLOW')
      return
    }
  }

  const submitEarnClaim = async (type: string) => {
    if (!token) return
    setClaimingType(type)
    try {
      const res = await fetch('/api/portal/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type }),
      })
      if (res.ok) {
        const d = await res.json()
        setTransactions((prev) => [d.transaction, ...prev])
        setClaimedTypes((prev) => new Set(Array.from(prev).concat(type)))
      }
    } finally {
      setClaimingType(null)
    }
  }

  const validateForm = () => {
    const errs: Record<string, string> = {}
    if (!form.firstName.trim()) errs.firstName = 'Required'
    if (!form.lastName.trim()) errs.lastName = 'Required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Valid email required'
    if (!form.phone.trim()) errs.phone = 'Required'
    else { const e = validatePhone(form.phone); if (e) errs.phone = e }
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !token) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/portal/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) {
        setFormErrors({ general: d.error || 'Failed to submit' })
        return
      }
      setReferrals((prev) => [d.referral, ...prev])
      setForm({ firstName: '', lastName: '', email: '', phone: '' })
      setReferralOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRedeem = async (rewardId: string) => {
    if (!token || redeemingReward) return
    setRedeemingReward(rewardId)
    try {
      const res = await fetch('/api/portal/points/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reward: rewardId }),
      })
      const d = await res.json()
      if (!res.ok) {
        alert(d.error || 'Redemption failed')
        return
      }
      setBalance(d.newBalance)
      setTransactions((prev) => [d.transaction, ...prev])
      setRedeemConfirm(d.reward)
    } finally {
      setRedeemingReward(null)
    }
  }

  const progressPct = Math.min((balance / 200) * 100, 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#c8864e]" />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anim-fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-[#e8e2db]">
            Rewards & Referrals
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#888] mt-1">
            Earn points and redeem them for free upgrades on your next order.
          </p>
        </div>

        {/* Points balance hero */}
        <div className="rounded-2xl bg-gradient-to-br from-[#1a0e06] via-[#1f1208] to-[#0f0a05] border border-[#c8864e]/20 p-6 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(200,134,78,0.12) 0%, transparent 70%)' }}
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-[#c8864e]/70 uppercase tracking-widest mb-2">Your Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">{balance}</span>
                  <span className="text-lg text-[#c8864e]">pts</span>
                </div>
                <p className="text-sm text-[#888] mt-1">
                  {balance >= 200
                    ? '🎉 You can redeem a reward!'
                    : `${200 - balance} more points to unlock a reward`}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-[#c8864e]/10 flex items-center justify-center shrink-0">
                <Trophy className="h-7 w-7 text-[#c8864e]" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs text-[#666] mb-1.5">
                <span>0 pts</span>
                <span>200 pts to redeem</span>
              </div>
              <div className="h-2 rounded-full bg-[#2a2a2a]">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#c8864e] to-[#e0a060] transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* How to earn */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db] mb-3">
            Earn Points
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {EARN_ACTIONS.map((action) => {
              const Icon = action.icon
              const claimed = action.id !== 'referral' && claimedTypes.has(action.id)
              const isClaiming = claimingType === action.id
              return (
                <div
                  key={action.id}
                  className="rounded-xl bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a] p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="h-9 w-9 rounded-lg bg-[#c8864e]/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4.5 w-4.5 text-[#c8864e]" style={{ height: 18, width: 18 }} />
                    </div>
                    <span className="text-sm font-bold text-[#c8864e]">+{action.points} pts</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-[#e8e2db]">{action.label}</p>
                    <p className="text-xs text-gray-400 dark:text-[#666] mt-0.5">{action.desc}</p>
                  </div>
                  <button
                    onClick={() => handleEarnAction(action.id, action.action)}
                    disabled={claimed || isClaiming}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      claimed
                        ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 cursor-default'
                        : 'bg-[#c8864e]/10 text-[#c8864e] hover:bg-[#c8864e]/20'
                    }`}
                  >
                    {isClaiming ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : claimed ? (
                      <><CheckCircle2 className="h-3.5 w-3.5" /> Submitted</>
                    ) : (
                      <>{action.cta} <ChevronRight className="h-3 w-3" /></>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Rewards shop */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db] mb-1">
            Rewards Shop
          </h2>
          <p className="text-xs text-gray-400 dark:text-[#666] mb-3">
            Redeem 200 points for any of these upgrades on your next order.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {REWARDS.map((reward) => {
              const Icon = reward.icon
              const canRedeem = balance >= reward.cost
              const isRedeeming = redeemingReward === reward.id
              return (
                <div
                  key={reward.id}
                  className={`rounded-xl border bg-gradient-to-br p-4 flex flex-col gap-3 ${reward.color} ${
                    !canRedeem ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`h-10 w-10 rounded-xl bg-white/10 dark:bg-black/20 flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${reward.iconColor}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-[#888] bg-white/50 dark:bg-black/20 rounded-full px-2 py-0.5">
                      Value {reward.value}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">{reward.name}</p>
                    <p className="text-xs text-gray-500 dark:text-[#888] mt-0.5">{reward.desc}</p>
                  </div>
                  <button
                    onClick={() => canRedeem && handleRedeem(reward.id)}
                    disabled={!canRedeem || !!redeemingReward}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      canRedeem
                        ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-[#e8e2db] hover:shadow-md'
                        : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 dark:text-[#555] cursor-not-allowed'
                    }`}
                  >
                    {isRedeeming ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : canRedeem ? (
                      <><Gift className="h-3.5 w-3.5" /> Redeem {reward.cost} pts</>
                    ) : (
                      `Need ${reward.cost - balance} more pts`
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Referrals list */}
        <div className="rounded-xl bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">Your Referrals</h3>
              <p className="text-xs text-gray-400 dark:text-[#666] mt-0.5">
                Earn 200 pts when someone you referred makes a purchase
              </p>
            </div>
            <button
              onClick={() => setReferralOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c8864e] text-white text-xs font-medium hover:bg-[#b8764e] transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Refer a Friend
            </button>
          </div>

          {referrals.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="h-8 w-8 mx-auto text-gray-200 dark:text-[#333] mb-2" />
              <p className="text-sm text-gray-400 dark:text-[#666]">No referrals yet</p>
              <button
                onClick={() => setReferralOpen(true)}
                className="mt-3 text-xs text-[#c8864e] hover:text-[#b8764e]"
              >
                Refer your first friend →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
              {referrals.map((ref) => (
                <div key={ref.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-gray-500 dark:text-[#666]">
                      {ref.referredName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-[#e8e2db] truncate">{ref.referredName}</p>
                    <p className="text-xs text-gray-400 dark:text-[#666] truncate">{ref.referredEmail}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ref.pointsAwarded && (
                      <span className="text-xs text-[#c8864e] font-medium">+200 pts</span>
                    )}
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusStyle[ref.status]}`}>
                      {ref.status === 'PENDING' && <Clock className="inline h-3 w-3 mr-1" />}
                      {ref.status === 'PURCHASED' && <CheckCircle2 className="inline h-3 w-3 mr-1" />}
                      {ref.status.charAt(0) + ref.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Points history */}
        {transactions.length > 0 && (
          <div className="rounded-xl bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">Points History</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-gray-800 dark:text-[#ccc]">{t.description}</p>
                    <p className="text-xs text-gray-400 dark:text-[#666] mt-0.5">
                      {t.createdAt ? format(new Date(t.createdAt), 'MMM d, yyyy') : ''}
                      {t.status === 'PENDING' && (
                        <span className="ml-2 text-amber-600 dark:text-amber-400">· Pending approval</span>
                      )}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${t.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {t.amount > 0 ? '+' : ''}{t.amount} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Referral form modal ────────────────────────────────────────── */}
      {referralOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] w-full max-w-md anim-fade-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">Refer a Friend</h3>
                <p className="text-xs text-gray-400 dark:text-[#666] mt-0.5">Earn 200 pts when they purchase</p>
              </div>
              <button
                onClick={() => { setReferralOpen(false); setFormErrors({}) }}
                className="text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-[#888]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReferral} className="px-6 py-5 space-y-4">
              {formErrors.general && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                  {formErrors.general}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-[#888]">First Name *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="John"
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] px-3 py-2 text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#c8864e]/50"
                  />
                  {formErrors.firstName && <p className="text-xs text-red-500 mt-0.5">{formErrors.firstName}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-[#888]">Last Name *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Doe"
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] px-3 py-2 text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#c8864e]/50"
                  />
                  {formErrors.lastName && <p className="text-xs text-red-500 mt-0.5">{formErrors.lastName}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-[#888]">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] px-3 py-2 text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#c8864e]/50"
                />
                {formErrors.email && <p className="text-xs text-red-500 mt-0.5">{formErrors.email}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-[#888]">Phone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: sanitizePhoneInput(e.target.value) })}
                  placeholder="(555) 123-4567"
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] px-3 py-2 text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#c8864e]/50"
                />
                {formErrors.phone && <p className="text-xs text-red-500 mt-0.5">{formErrors.phone}</p>}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setReferralOpen(false); setFormErrors({}) }}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-sm text-gray-600 dark:text-[#999] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#c8864e] text-white text-sm font-medium hover:bg-[#b8764e] transition-colors disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? 'Submitting…' : 'Submit Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Redemption success modal ───────────────────────────────────── */}
      {redeemConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] w-full max-w-sm p-8 text-center anim-fade-up">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[#c8864e]/10 flex items-center justify-center">
              <Gift className="h-8 w-8 text-[#c8864e]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#e8e2db] mb-2">Reward Redeemed!</h3>
            <p className="text-sm text-gray-500 dark:text-[#888] leading-relaxed">
              You&apos;ve redeemed your <strong className="text-gray-800 dark:text-[#ccc]">{redeemConfirm}</strong>.
              Our team will apply it to your next order. We&apos;ll be in touch shortly!
            </p>
            <p className="text-xs text-gray-400 dark:text-[#666] mt-3">
              Remaining balance: <strong className="text-[#c8864e]">{balance} pts</strong>
            </p>
            <button
              onClick={() => setRedeemConfirm(null)}
              className="mt-6 w-full py-2.5 rounded-lg bg-[#c8864e] text-white text-sm font-medium hover:bg-[#b8764e] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  )
}
