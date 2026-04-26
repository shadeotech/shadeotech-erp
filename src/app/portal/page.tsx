'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  FileText,
  Receipt,
  CheckCircle2,
  Circle,
  ArrowRight,
  Loader2,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'

interface QuoteSummary {
  id: string
  quoteNumber: string
  status: string
  totalAmount: number
  createdAt: string
  expiryDate?: string
}

interface InvoiceSummary {
  id: string
  invoiceNumber: string
  status: string
  totalAmount: number
  dueAmount: number
  paidAmount: number
  dueDate?: string
}

const statusLabel: Record<string, string> = {
  SENT: 'Pending Review',
  WON: 'Accepted',
  LOST: 'Declined',
  DRAFT: 'Draft',
  EXPIRED: 'Expired',
  NEGOTIATION: 'In Review',
}

const statusStyle: Record<string, string> = {
  SENT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  WON: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  LOST: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-[#222] dark:text-[#888]',
  EXPIRED: 'bg-gray-100 text-gray-500 dark:bg-[#222] dark:text-[#666]',
}

const invoiceStatusStyle: Record<string, string> = {
  Unpaid: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  'Partially Paid': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  Paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  Overdue: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  Draft: 'bg-gray-100 text-gray-600 dark:bg-[#222] dark:text-[#888]',
}

export default function CustomerPortalPage() {
  const { user, token } = useAuthStore()
  const [quotes, setQuotes] = useState<QuoteSummary[]>([])
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!token) { setLoading(false); return }
    try {
      const [qRes, iRes] = await Promise.all([
        fetch('/api/quotes', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/invoices', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (qRes.ok) { const d = await qRes.json(); setQuotes(d.quotes ?? []) }
      if (iRes.ok) { const d = await iRes.json(); setInvoices(d.invoices ?? []) }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  // Refresh when tab regains focus so data is always current
  useEffect(() => {
    const onFocus = () => fetchData()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchData])

  const invoiceDue = invoices.reduce((s, i) => s + (i.dueAmount ?? 0), 0)
  const totalPaid = invoices.reduce((s, i) => s + (i.paidAmount ?? 0), 0)
  const pendingQuotes = quotes.filter((q) => q.status === 'SENT')
  const acceptedQuotes = quotes.filter((q) => q.status === 'WON')
  // Total due = unpaid invoices + accepted quotes with no invoice yet
  const invoicedQuoteIds = new Set(invoices.map((i: any) => i.quoteId).filter(Boolean))
  const uninvoicedAcceptedTotal = acceptedQuotes
    .filter((q) => !invoicedQuoteIds.has(q.id))
    .reduce((s, q) => s + (q.totalAmount ?? 0), 0)
  const totalDue = invoiceDue + uninvoicedAcceptedTotal

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  // Journey step logic
  const hasAccepted = acceptedQuotes.length > 0
  const hasPending = pendingQuotes.length > 0
  const hasDue = totalDue > 0
  const allPaid = invoices.length > 0 && totalDue === 0

  const steps = [
    {
      n: 1,
      title: 'Review & Accept Estimate',
      desc: 'Review your estimate and approve it to get started',
      href: '/portal/quotes',
      status: hasAccepted ? 'done' : hasPending ? 'active' : 'pending',
    },
    {
      n: 2,
      title: 'Sign Agreement',
      desc: 'Sign the service agreement to confirm your order',
      href: '/portal/contracts',
      status: hasAccepted ? 'active' : 'pending',
    },
    {
      n: 3,
      title: 'Make Deposit',
      desc: 'Pay the 50% deposit to begin production',
      href: '/portal/invoices',
      status: allPaid ? 'done' : hasDue ? 'active' : 'pending',
    },
    {
      n: 4,
      title: 'Final Balance',
      desc: 'Complete remaining payment upon installation',
      href: '/portal/payments',
      status: allPaid ? 'done' : 'pending',
    },
  ]

  const currentStep = steps.find((s) => s.status === 'active') ?? steps[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#c8864e]" />
      </div>
    )
  }

  const hasNoData = quotes.length === 0 && invoices.length === 0

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-[13px] text-gray-400 dark:text-[#666] uppercase tracking-widest mb-1">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-[#e8e2db]">
            {greeting}, {user?.firstName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-[#888] mt-0.5">
            {hasNoData
              ? "Your Shadeotech journey is about to begin."
              : "Here's your current project overview."}
          </p>
        </div>
        {pendingQuotes.length > 0 && (
          <Link
            href="/portal/quotes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c8864e] text-white text-sm font-medium hover:bg-[#b8764e] transition-colors shrink-0"
          >
            <AlertCircle className="h-4 w-4" />
            {pendingQuotes.length} estimate{pendingQuotes.length > 1 ? 's' : ''} awaiting review
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Due — copper highlight */}
        <div className={`rounded-xl p-5 col-span-2 lg:col-span-1 ${
          totalDue > 0
            ? 'bg-[#c8864e]/10 border border-[#c8864e]/20'
            : 'bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a]'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 dark:text-[#888] font-medium">Total Due</span>
            <DollarSign className={`h-4 w-4 ${totalDue > 0 ? 'text-[#c8864e]' : 'text-gray-400 dark:text-[#555]'}`} />
          </div>
          <p className={`text-2xl font-semibold ${
            totalDue > 0 ? 'text-[#c8864e]' : 'text-gray-900 dark:text-[#e8e2db]'
          }`}>
            {formatCurrency(totalDue)}
          </p>
          <p className="text-xs text-gray-500 dark:text-[#666] mt-1">
            {invoices.filter((i) => i.dueAmount > 0).length} invoice
            {invoices.filter((i) => i.dueAmount > 0).length !== 1 ? 's' : ''} outstanding
          </p>
        </div>

        {/* Total Paid */}
        <div className="rounded-xl p-5 bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 dark:text-[#888] font-medium">Total Paid</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-[#e8e2db]">
            {formatCurrency(totalPaid)}
          </p>
          <p className="text-xs text-gray-500 dark:text-[#666] mt-1">
            {invoices.filter((i) => i.status === 'Paid').length} paid in full
          </p>
        </div>

        {/* Open Quotes */}
        <div className="rounded-xl p-5 bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 dark:text-[#888] font-medium">Estimates</span>
            <FileText className="h-4 w-4 text-gray-400 dark:text-[#555]" />
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-[#e8e2db]">{quotes.length}</p>
          <p className="text-xs text-gray-500 dark:text-[#666] mt-1">
            {pendingQuotes.length} pending review
          </p>
        </div>

        {/* Invoices */}
        <div className="rounded-xl p-5 bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 dark:text-[#888] font-medium">Invoices</span>
            <Receipt className="h-4 w-4 text-gray-400 dark:text-[#555]" />
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-[#e8e2db]">{invoices.length}</p>
          <p className="text-xs text-gray-500 dark:text-[#666] mt-1">
            {invoices.filter((i) => i.status === 'Paid').length} paid
          </p>
        </div>
      </div>

      {/* Journey Steps */}
      <div className="rounded-xl bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-[#2a2a2a]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">Your Journey</h2>
          <p className="text-xs text-gray-400 dark:text-[#666] mt-0.5">
            Follow these steps to complete your order
          </p>
        </div>
        <div className="p-5">
          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-[18px] top-8 bottom-8 w-px bg-gray-100 dark:bg-[#2a2a2a]" />

            <div className="space-y-5">
              {steps.map((step) => {
                const isDone = step.status === 'done'
                const isActive = step.status === 'active'
                return (
                  <div key={step.n} className="flex items-start gap-4 relative">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-500'
                          : isActive
                          ? 'border-[#c8864e] bg-[#c8864e]/10'
                          : 'border-gray-200 dark:border-[#333] bg-white dark:bg-[#111]'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : isActive ? (
                        <Circle className="h-4 w-4 text-[#c8864e] fill-[#c8864e]" />
                      ) : (
                        <span className="text-xs font-medium text-gray-400 dark:text-[#555]">
                          {step.n}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1 pb-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm font-medium ${
                            isDone
                              ? 'text-gray-500 dark:text-[#777] line-through'
                              : isActive
                              ? 'text-gray-900 dark:text-[#e8e2db]'
                              : 'text-gray-400 dark:text-[#555]'
                          }`}
                        >
                          {step.title}
                        </p>
                        {isActive && (
                          <Link
                            href={step.href}
                            className="flex items-center gap-1 text-xs text-[#c8864e] hover:text-[#b8764e] font-medium shrink-0"
                          >
                            Continue <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                        {isDone && (
                          <Link
                            href={step.href}
                            className="flex items-center gap-1 text-xs text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-[#888] shrink-0"
                          >
                            View <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-[#666] mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Quotes + Invoices */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Quotes */}
        <div className="rounded-xl bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">Estimates</h3>
              <p className="text-xs text-gray-400 dark:text-[#666] mt-0.5">Your estimate history</p>
            </div>
            <Link
              href="/portal/quotes"
              className="text-xs text-[#c8864e] hover:text-[#b8764e] flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {quotes.length === 0 ? (
            <div className="py-10 text-center px-5">
              <FileText className="h-8 w-8 mx-auto text-gray-200 dark:text-[#333] mb-2" />
              <p className="text-sm text-gray-400 dark:text-[#666]">No quotes yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
              {quotes.slice(0, 4).map((q) => (
                <Link
                  key={q.id}
                  href={`/portal/quotes/${q.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-[#161616] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center shrink-0">
                      <FileText className="h-3.5 w-3.5 text-gray-400 dark:text-[#555]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-[#e8e2db]">
                        {q.quoteNumber}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-[#666]">
                        {q.createdAt ? format(new Date(q.createdAt), 'MMM d, yyyy') : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        statusStyle[q.status] ?? 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {statusLabel[q.status] ?? q.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">
                      {formatCurrency(q.totalAmount)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="rounded-xl bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">Invoices</h3>
              <p className="text-xs text-gray-400 dark:text-[#666] mt-0.5">Your billing statements</p>
            </div>
            <Link
              href="/portal/invoices"
              className="text-xs text-[#c8864e] hover:text-[#b8764e] flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {invoices.length === 0 ? (
            <div className="py-10 text-center px-5">
              <Receipt className="h-8 w-8 mx-auto text-gray-200 dark:text-[#333] mb-2" />
              <p className="text-sm text-gray-400 dark:text-[#666]">No invoices yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
              {invoices.slice(0, 4).map((inv) => (
                <Link
                  key={inv.id}
                  href={`/portal/invoices/${inv.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-[#161616] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center shrink-0">
                      <Receipt className="h-3.5 w-3.5 text-gray-400 dark:text-[#555]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-[#e8e2db]">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-[#666]">
                        {inv.dueDate ? `Due ${format(new Date(inv.dueDate), 'MMM d')}` : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        invoiceStatusStyle[inv.status] ?? 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {inv.status}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">
                        {formatCurrency(inv.totalAmount)}
                      </p>
                      {inv.dueAmount > 0 && (
                        <p className="text-[11px] text-[#c8864e]">
                          {formatCurrency(inv.dueAmount)} due
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Next action CTA */}
      {currentStep && currentStep.status === 'active' && (
        <div className="rounded-xl bg-gradient-to-r from-[#c8864e]/10 to-[#c8864e]/5 border border-[#c8864e]/20 p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#c8864e]/15 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-[#c8864e]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">
                Next step: {currentStep.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-[#888] mt-0.5">{currentStep.desc}</p>
            </div>
          </div>
          <Link
            href={currentStep.href}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c8864e] text-white text-sm font-medium hover:bg-[#b8764e] transition-colors shrink-0"
          >
            Continue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
