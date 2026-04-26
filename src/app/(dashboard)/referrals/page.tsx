'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, UserPlus, Search } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Referral {
  id: string
  referredName: string
  referredEmail: string | null
  referredPhone: string | null
  status: 'PENDING' | 'CONTACTED' | 'PURCHASED'
  pointsAwarded: number
  createdAt: string
  referrerName: string
  referrerCustomerId: string | null
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  CONTACTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  PURCHASED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
}

export default function ReferralsPage() {
  const { token } = useAuthStore()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!token) return
    fetch('/api/admin/referrals', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setReferrals(d.referrals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const filtered = referrals.filter((r) => {
    const q = search.toLowerCase()
    return (
      r.referredName.toLowerCase().includes(q) ||
      r.referrerName.toLowerCase().includes(q) ||
      (r.referredEmail ?? '').toLowerCase().includes(q)
    )
  })

  const total = referrals.length
  const purchased = referrals.filter((r) => r.status === 'PURCHASED').length
  const pending = referrals.filter((r) => r.status === 'PENDING').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-[#e8e2db]">Referrals</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All customer referrals</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Referrals', value: total, color: '#c8864e' },
          { label: 'Converted', value: purchased, color: '#10b981' },
          { label: 'Pending', value: pending, color: '#f59e0b' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              {loading
                ? <div className="h-8 w-12 rounded bg-muted animate-pulse mt-1" />
                : <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              }
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#c8864e]" />
              All Referrals
            </CardTitle>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{search ? 'No results found' : 'No referrals yet'}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((r) => (
                <div key={r.id} className="flex items-center gap-4 py-3">
                  <div className="h-9 w-9 rounded-full bg-[#c8864e]/10 flex items-center justify-center shrink-0 text-[#c8864e] font-bold text-sm">
                    {r.referredName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.referredName}</p>
                    <p className="text-xs text-muted-foreground">
                      Referred by{' '}
                      {r.referrerCustomerId
                        ? <Link href={`/customers/${r.referrerCustomerId}`} className="text-[#c8864e] hover:underline">{r.referrerName}</Link>
                        : r.referrerName
                      }
                      {r.referredEmail && ` · ${r.referredEmail}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className={cn('text-xs border-0 mb-1', STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-600')}>
                      {r.status}
                    </Badge>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
