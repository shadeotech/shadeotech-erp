'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  MessageCircle,
  X,
  Send,
  CreditCard,
  Building2,
  Smartphone,
  Mail,
  Pen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Upload,
  Check,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { downloadElementAsPdf } from '@/lib/quotePreviewPdf'
import QuotePreviewContent from '@/components/quotes/QuotePreviewContent'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import type { Quote } from '@/stores/quotesStore'

interface QuoteCommentType {
  id: string
  itemIndex: number
  userId: string
  userRole: string
  userName: string
  body: string
  createdAt: string
}

type AcceptStep = null | 'confirming' | 'accepting' | 'celebrating' | 'agreement' | 'payment' | 'complete'
type PaymentMethod = 'card' | 'ach' | 'affirm' | 'zelle' | 'check' | null

const PAYMENT_METHODS = [
  {
    id: 'card' as PaymentMethod,
    label: 'Credit Card',
    desc: 'Visa, Mastercard, Amex',
    icon: CreditCard,
  },
  {
    id: 'ach' as PaymentMethod,
    label: 'ACH Transfer',
    desc: 'Direct bank transfer',
    icon: Building2,
  },
  {
    id: 'affirm' as PaymentMethod,
    label: 'Affirm',
    desc: 'Pay over time, 0% APR options',
    icon: Sparkles,
  },
  {
    id: 'zelle' as PaymentMethod,
    label: 'Zelle',
    desc: 'Fast bank-to-bank transfer',
    icon: Smartphone,
  },
  {
    id: 'check' as PaymentMethod,
    label: 'Check',
    desc: 'Mail a personal or cashier\'s check',
    icon: Mail,
  },
]

export default function PortalQuoteDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { token, user } = useAuthStore()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Comments
  const [comments, setComments] = useState<QuoteCommentType[]>([])
  const [activeCommentIdx, setActiveCommentIdx] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  // Accept flow
  const [acceptStep, setAcceptStep] = useState<AcceptStep>(null)
  const [signatureName, setSignatureName] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [bankRouting, setBankRouting] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)
  const [paymentAmountType, setPaymentAmountType] = useState<'full' | 'deposit'>('full')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // Reject
  const [rejecting, setRejecting] = useState(false)

  // PDF
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Expanded items (for mobile)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    Promise.all([
      fetch(`/api/quotes/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/quotes/${params.id}/comments`, { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(async ([qRes, cRes]) => {
      if (qRes.status === 404 || qRes.status === 403) { setNotFound(true); return }
      if (qRes.ok) {
        const d = await qRes.json()
        setQuote(d.quote)
      }
      if (cRes.ok) {
        const d = await cRes.json()
        setComments(d.comments ?? [])
      }
    }).catch(() => setNotFound(true))
    .finally(() => setLoading(false))
  }, [token, params.id])

  useEffect(() => {
    if (activeCommentIdx !== null) {
      setTimeout(() => commentInputRef.current?.focus(), 50)
    }
  }, [activeCommentIdx])

  const commentsForItem = (idx: number) => comments.filter((c) => c.itemIndex === idx)

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !token || activeCommentIdx === null) return
    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/quotes/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemIndex: activeCommentIdx, text: commentText.trim() }),
      })
      if (res.ok) {
        const d = await res.json()
        setComments((prev) => [...prev, d.comment])
        setCommentText('')
      }
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleAccept = async () => {
    if (!quote || !token) return
    setAcceptStep('accepting')
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'accept' }),
      })
      if (res.ok) {
        setQuote((prev) => prev ? { ...prev, status: 'WON' } : prev)
        setAcceptStep('celebrating')
      } else {
        setAcceptStep(null)
        toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' })
      }
    } catch {
      setAcceptStep(null)
    }
  }

  const handleReject = async () => {
    if (!quote || !token || rejecting) return
    setRejecting(true)
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'reject' }),
      })
      if (res.ok) setQuote((prev) => prev ? { ...prev, status: 'LOST' } : prev)
    } finally {
      setRejecting(false)
    }
  }

  const handleSignAgreement = () => {
    if (!signatureName.trim() || !agreedToTerms) return
    setAcceptStep('payment')
  }

  const handleSubmitPayment = async () => {
    setPaymentSubmitting(true)
    await new Promise((r) => setTimeout(r, 1500))
    setPaymentSubmitting(false)
    setAcceptStep('complete')
  }

  const handleDownloadPdf = async () => {
    if (!quote || downloadingPdf) return
    setDownloadingPdf(true)
    try {
      await downloadElementAsPdf('portal-quote-pdf-ghost', `Quote-${quote.quoteNumber}.pdf`)
    } finally {
      setDownloadingPdf(false)
    }
  }

  const depositAmount = quote ? quote.totalAmount * 0.5 : 0

  // ─── Loading / not found ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[#c8864e]" />
      </div>
    )
  }

  if (notFound || !quote) {
    return (
      <div className="max-w-xl mx-auto space-y-6 py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#888] hover:text-gray-900 dark:hover:text-[#e8e2db]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="rounded-xl bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a] p-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-gray-200 dark:text-[#333] mb-4" />
          <h3 className="text-base font-medium text-gray-900 dark:text-[#e8e2db]">Estimate not found</h3>
          <p className="text-sm text-gray-500 dark:text-[#888] mt-1">
            This estimate does not exist or you don&apos;t have access.
          </p>
        </div>
      </div>
    )
  }

  const canAct = quote.status === 'SENT'
  const statusConfig = {
    SENT: { label: 'Awaiting Approval', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' },
    WON: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400' },
    LOST: { label: 'Declined', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
    DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-600 dark:bg-[#222] dark:text-[#888]' },
  } as Record<string, { label: string; color: string }>

  const sc = statusConfig[quote.status] ?? { label: quote.status, color: 'bg-gray-100 text-gray-600' }

  // ─── Main render ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop {
          0% { transform: scale(0.6); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .anim-fade-up { animation: fadeUp 0.5s ease both; }
        .anim-pop { animation: pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
        .anim-float { animation: float 3s ease-in-out infinite; }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-[#888] hover:bg-gray-100 dark:hover:bg-[#1e1e1e] hover:text-gray-900 dark:hover:text-[#e8e2db] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-[#e8e2db]">
                  {quote.quoteNumber}
                </h1>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.color}`}>
                  {sc.label}
                </span>
              </div>
              {quote.sideMark && (
                <p className="text-xs text-gray-400 dark:text-[#666] mt-0.5">{quote.sideMark}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canAct && (
              <>
                <button
                  onClick={() => setAcceptStep('confirming')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c8864e] text-white text-sm font-medium hover:bg-[#b8764e] transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Accept Estimate
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-sm text-gray-600 dark:text-[#999] hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Decline
                </button>
              </>
            )}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-sm text-gray-600 dark:text-[#999] hover:border-gray-300 dark:hover:border-[#444] transition-colors"
            >
              {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              PDF
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Created', value: quote.createdAt ? format(new Date(quote.createdAt), 'MMM d, yyyy') : '—' },
            { label: 'Expires', value: quote.expiryDate ? format(new Date(quote.expiryDate), 'MMM d, yyyy') : '—' },
            { label: 'Items', value: String(quote.items.length) },
            { label: 'Total', value: formatCurrency(quote.totalAmount), highlight: true },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-xl p-4 ${
                card.highlight
                  ? 'bg-[#c8864e]/10 border border-[#c8864e]/20'
                  : 'bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a]'
              }`}
            >
              <p className="text-xs text-gray-500 dark:text-[#888] mb-1">{card.label}</p>
              <p
                className={`text-base font-semibold ${
                  card.highlight ? 'text-[#c8864e]' : 'text-gray-900 dark:text-[#e8e2db]'
                }`}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Line items */}
        <div className="rounded-xl bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">Products</h2>
            <p className="text-xs text-gray-400 dark:text-[#666]">{quote.items.length} items</p>
          </div>

          {quote.items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400 dark:text-[#666]">No items</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
              {quote.items.map((item, idx) => {
                const itemComments = commentsForItem(idx)
                const isExpanded = expandedIdx === idx
                const isCommentOpen = activeCommentIdx === idx

                return (
                  <div key={idx} className="group">
                    <div
                      className={`flex items-start gap-3 px-5 py-4 transition-colors ${
                        isCommentOpen ? 'bg-[#c8864e]/5' : 'hover:bg-gray-50 dark:hover:bg-[#161616]'
                      }`}
                    >
                      {/* Item number */}
                      <div className="h-7 w-7 rounded-md bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-gray-500 dark:text-[#666]">
                          {idx + 1}
                        </span>
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-[#e8e2db] truncate">
                              {item.category || item.productName}
                            </p>
                            {item.productName && (
                              <p className="text-xs text-gray-500 dark:text-[#888] truncate mt-0.5">
                                {item.productName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">
                              {formatCurrency(item.totalPrice)}
                            </p>
                            {/* Comment icon */}
                            <button
                              onClick={() =>
                                setActiveCommentIdx((prev) => (prev === idx ? null : idx))
                              }
                              className={`relative p-1.5 rounded-lg transition-all ${
                                isCommentOpen
                                  ? 'bg-[#c8864e]/15 text-[#c8864e]'
                                  : 'text-gray-400 dark:text-[#555] hover:text-[#c8864e] hover:bg-[#c8864e]/10 opacity-0 group-hover:opacity-100'
                              }`}
                              title="Comments"
                            >
                              <MessageCircle className="h-4 w-4" />
                              {itemComments.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#c8864e] text-white text-[9px] flex items-center justify-center font-medium">
                                  {itemComments.length}
                                </span>
                              )}
                            </button>
                            {/* Expand toggle */}
                            <button
                              onClick={() => setExpandedIdx((prev) => (prev === idx ? null : idx))}
                              className="p-1.5 rounded-lg text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-[#888] opacity-0 group-hover:opacity-100 transition-all"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-1">
                          {item.roomType && (
                            <span className="text-xs text-gray-400 dark:text-[#666]">
                              {item.roomType}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 dark:text-[#555]">·</span>
                          <span className="text-xs text-gray-400 dark:text-[#666]">
                            {item.quantity} × {formatCurrency(item.unitPrice)}
                          </span>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#2a2a2a] grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
                            {[
                              { k: 'Control', v: item.controlType },
                              { k: 'Mount', v: item.mountType },
                              { k: 'Cassette', v: item.cassetteType === 'SQUARE CASETTE' ? 'Square' : item.cassetteType === 'ROUND CASETTE' ? 'Round' : item.cassetteType === 'OPEN_ROLL' ? 'Open Roll' : item.cassetteType },
                              { k: 'Cassette Color', v: item.cassetteColor },
                              { k: 'Cassette Wrap', v: item.fabricWrap === 'none' ? 'No Wrap' : item.fabricWrap === 'same' ? 'Same Fabric' : item.fabricWrap === 'other' ? 'Other Fabric' : item.fabricWrap },
                              { k: 'Bottom Rail', v: item.bottomRailType === 'Wrapped' ? 'BR. Wrapped' : item.bottomRailType === 'Exposed' ? 'BR. Exposed' : item.bottomRailType },
                              { k: 'Bottom Rail Color', v: item.bottomRailColor },
                              { k: 'Side Channel', v: item.sideChannel && item.sideChannel !== 'None' ? item.sideChannel : undefined },
                              { k: 'Room', v: item.roomType },
                              { k: 'Roll', v: item.roll },
                            ]
                              .filter((x) => x.v)
                              .map(({ k, v }) => (
                                <div key={k}>
                                  <p className="text-[10px] text-gray-400 dark:text-[#555] uppercase tracking-wider">
                                    {k}
                                  </p>
                                  <p className="text-xs text-gray-700 dark:text-[#ccc] mt-0.5">{v}</p>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inline comment panel */}
                    {isCommentOpen && (
                      <div className="border-t border-[#c8864e]/10 bg-[#c8864e]/5 px-5 py-4">
                        <div className="max-w-2xl">
                          <p className="text-xs font-medium text-[#c8864e] mb-3">
                            Comments on item {idx + 1}
                          </p>

                          {/* Existing comments */}
                          {itemComments.length > 0 && (
                            <div className="space-y-2.5 mb-3">
                              {itemComments.map((c) => (
                                <div key={c.id} className="flex gap-2.5">
                                  <div
                                    className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold ${
                                      c.userRole === 'CUSTOMER'
                                        ? 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-600 dark:text-[#888]'
                                        : 'bg-[#c8864e]/20 text-[#c8864e]'
                                    }`}
                                  >
                                    {c.userName?.[0]?.toUpperCase() ?? '?'}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-xs font-medium text-gray-800 dark:text-[#ddd]">
                                        {c.userName}
                                      </span>
                                      <span className="text-[10px] text-gray-400 dark:text-[#666]">
                                        {c.createdAt
                                          ? format(new Date(c.createdAt), 'MMM d, h:mm a')
                                          : ''}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-[#ccc] mt-0.5 leading-relaxed">
                                      {c.body}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Input */}
                          <div className="flex gap-2">
                            <textarea
                              ref={commentInputRef}
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  handleSubmitComment()
                                }
                              }}
                              placeholder="Leave a comment or ask a question…"
                              rows={2}
                              className="flex-1 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#111] px-3 py-2 text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] resize-none focus:outline-none focus:ring-1 focus:ring-[#c8864e]/50"
                            />
                            <button
                              onClick={handleSubmitComment}
                              disabled={!commentText.trim() || submittingComment}
                              className="self-end flex items-center justify-center h-9 w-9 rounded-lg bg-[#c8864e] text-white disabled:opacity-40 hover:bg-[#b8764e] transition-colors"
                            >
                              {submittingComment ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Totals */}
          <div className="px-5 py-4 border-t border-gray-100 dark:border-[#2a2a2a] space-y-2">
            {quote.addOns && quote.addOns.length > 0 && (
              <>
                {quote.addOns.map((ao, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-[#888]">{ao.name}</span>
                    <span className="text-gray-700 dark:text-[#ccc]">{formatCurrency(ao.total)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 dark:border-[#2a2a2a] my-1" />
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-[#888]">Subtotal</span>
              <span className="text-gray-700 dark:text-[#ccc]">{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-[#888]">Tax ({quote.taxRate}%)</span>
                <span className="text-gray-700 dark:text-[#ccc]">{formatCurrency(quote.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold border-t border-gray-100 dark:border-[#2a2a2a] pt-2">
              <span className="text-gray-900 dark:text-[#e8e2db]">Total</span>
              <span className="text-[#c8864e]">{formatCurrency(quote.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="rounded-xl bg-white dark:bg-[#111] border border-gray-100 dark:border-[#2a2a2a] px-5 py-4">
            <h3 className="text-xs font-medium text-gray-500 dark:text-[#888] uppercase tracking-wider mb-2">
              Notes
            </h3>
            <p className="text-sm text-gray-700 dark:text-[#ccc] whitespace-pre-wrap leading-relaxed">
              {quote.notes}
            </p>
          </div>
        )}

        {/* Accept CTA banner (if SENT) */}
        {canAct && (
          <div className="rounded-xl bg-gradient-to-r from-[#c8864e]/10 to-[#c8864e]/5 border border-[#c8864e]/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">
                Ready to move forward?
              </p>
              <p className="text-xs text-gray-500 dark:text-[#888] mt-0.5">
                Accept this estimate to sign your agreement and make a deposit.
              </p>
            </div>
            <button
              onClick={() => setAcceptStep('confirming')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c8864e] text-white text-sm font-medium hover:bg-[#b8764e] transition-colors shrink-0"
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept Estimate
            </button>
          </div>
        )}
      </div>

      {/* ── Hidden PDF ghost ─────────────────────────────────────────────── */}
      <div
        id="portal-quote-pdf-ghost"
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '816px', background: 'white', zIndex: -1 }}
        aria-hidden="true"
      >
        <QuotePreviewContent quote={quote} customerDetails={null} excludeMeasurements={true} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ACCEPT FLOW OVERLAYS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* ── Confirmation dialog ─────────────────────────────────────────── */}
      {acceptStep === 'confirming' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-8 max-w-sm w-full anim-fade-up">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-[#e8e2db]">
              Accept estimate?
            </h3>
            <p className="text-sm text-gray-500 dark:text-[#888] mt-2">
              You&apos;re accepting{' '}
              <span className="font-medium text-gray-700 dark:text-[#ccc]">
                {quote.quoteNumber}
              </span>{' '}
              for{' '}
              <span className="font-semibold text-[#c8864e]">
                {formatCurrency(quote.totalAmount)}
              </span>
              . You&apos;ll sign an agreement and make a deposit to start production.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setAcceptStep(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-sm text-gray-600 dark:text-[#999] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 py-2.5 rounded-lg bg-[#c8864e] text-white text-sm font-medium hover:bg-[#b8764e] transition-colors"
              >
                Yes, Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Accepting spinner ───────────────────────────────────────────── */}
      {acceptStep === 'accepting' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#c8864e]" />
        </div>
      )}

      {/* ── Celebration screen ──────────────────────────────────────────── */}
      {acceptStep === 'celebrating' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]">
          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(200,134,78,0.15) 0%, transparent 70%)',
            }}
          />

          <div className="relative text-center px-6 max-w-lg mx-auto">
            {/* Animated check */}
            <div className="anim-pop mx-auto mb-6 h-24 w-24 rounded-full bg-[#c8864e]/15 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-[#c8864e]/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-[#c8864e]" />
              </div>
            </div>

            <div className="anim-fade-up" style={{ animationDelay: '0.2s' }}>
              <h1 className="text-4xl font-bold text-white mb-2">Woohoo! 🎉</h1>
              <p className="text-lg text-[#e8e2db] font-medium">
                Thank you for choosing Shadeotech.
              </p>
              <p className="text-[#888] text-sm mt-2 leading-relaxed">
                We just need a couple more things to get your order into production.
              </p>
            </div>

            {/* Progress steps */}
            <div
              className="anim-fade-up flex items-center justify-center gap-0 mt-8 mb-8"
              style={{ animationDelay: '0.35s' }}
            >
              {['Sign Agreement', 'Pay Deposit', 'Production Starts'].map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                        i === 0
                          ? 'bg-[#c8864e] text-white'
                          : 'bg-[#2a2a2a] text-[#555]'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <p className="text-[11px] text-[#666] whitespace-nowrap">{s}</p>
                  </div>
                  {i < 2 && (
                    <div className="w-12 h-px bg-[#2a2a2a] mx-1 mb-4" />
                  )}
                </div>
              ))}
            </div>

            <div
              className="anim-fade-up"
              style={{ animationDelay: '0.5s' }}
            >
              <button
                onClick={() => setAcceptStep('agreement')}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#c8864e] text-white font-semibold text-base hover:bg-[#b8764e] transition-colors anim-float"
              >
                <Pen className="h-4 w-4" />
                Sign Agreement
              </button>
              <p className="text-xs text-[#555] mt-3">Takes less than 2 minutes</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Agreement (DocuSign-style) ──────────────────────────────────── */}
      {acceptStep === 'agreement' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] flex flex-col anim-fade-up">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded bg-[#c8864e]/10 flex items-center justify-center">
                  <Pen className="h-3.5 w-3.5 text-[#c8864e]" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">
                  Service Agreement
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#666]">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Secure & encrypted
              </div>
            </div>

            {/* Scrollable document */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Document letterhead */}
              <div className="text-center mb-6 pb-5 border-b border-gray-100 dark:border-[#2a2a2a]">
                <p className="text-xs text-gray-400 dark:text-[#666] uppercase tracking-widest mb-1">
                  Shadeotech Inc.
                </p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-[#e8e2db]">
                  Window Treatment Service Agreement
                </h2>
                <p className="text-xs text-gray-400 dark:text-[#666] mt-2">
                  Reference: {quote.quoteNumber} &nbsp;·&nbsp; Date:{' '}
                  {format(new Date(), 'MMMM d, yyyy')}
                </p>
              </div>

              <div className="space-y-4 text-sm text-gray-700 dark:text-[#bbb] leading-relaxed">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-[#e8e2db] mb-1">
                    1. Parties
                  </p>
                  <p>
                    This Service Agreement (&quot;Agreement&quot;) is entered into between{' '}
                    <strong>Shadeotech Inc.</strong> (&quot;Company&quot;) and{' '}
                    <strong>{quote.customerName}</strong> (&quot;Client&quot;), collectively referred
                    to as the &quot;Parties.&quot;
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-[#e8e2db] mb-1">
                    2. Scope of Work
                  </p>
                  <p>
                    The Company agrees to custom-manufacture and install window treatments as
                    specified in Estimate <strong>{quote.quoteNumber}</strong>, totaling{' '}
                    <strong>{formatCurrency(quote.totalAmount)}</strong>. All products will be
                    manufactured to the specifications outlined in the estimate and installed by
                    Shadeotech-certified technicians.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-[#e8e2db] mb-1">
                    3. Payment Terms
                  </p>
                  <p>
                    A <strong>50% deposit of {formatCurrency(depositAmount)}</strong> is due upon
                    signing this Agreement. The remaining balance of{' '}
                    <strong>{formatCurrency(depositAmount)}</strong> is due upon completion of
                    installation. All payments must be received in full before final products are
                    released to the client.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-[#e8e2db] mb-1">
                    4. Timeline
                  </p>
                  <p>
                    Production lead time is approximately 4–6 weeks from receipt of deposit and
                    signed agreement. Installation will be scheduled at a mutually convenient time
                    following production completion. Shadeotech will notify the Client when products
                    are ready for installation.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-[#e8e2db] mb-1">
                    5. Changes & Cancellations
                  </p>
                  <p>
                    Custom orders cannot be cancelled or modified once production has begun. Changes
                    requested after production starts will be assessed on a case-by-case basis and
                    may incur additional charges. Deposit payments are non-refundable once
                    production commences.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-[#e8e2db] mb-1">6. Warranty</p>
                  <p>
                    All Shadeotech products are covered by a <strong>5-year manufacturer&apos;s
                    warranty</strong> against defects in materials and workmanship. Installation
                    labor is warranted for <strong>1 year</strong> from the date of installation.
                    Normal wear, improper use, or damage from external causes are not covered.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 dark:text-[#e8e2db] mb-1">
                    7. Governing Law
                  </p>
                  <p>
                    This Agreement shall be governed by the laws of the state in which the
                    installation occurs. Any disputes shall be resolved through binding arbitration
                    prior to litigation.
                  </p>
                </div>
              </div>

              {/* Signature block */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#2a2a2a]">
                <p className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db] mb-4">
                  Electronic Signature
                </p>
                <p className="text-xs text-gray-500 dark:text-[#888] mb-4">
                  By typing your full legal name below and checking the confirmation box, you
                  acknowledge that you have read, understand, and agree to the terms of this
                  Service Agreement. This constitutes a legally binding electronic signature.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-[#888] uppercase tracking-wider">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="Type your full name"
                      className="mt-1.5 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] px-3 py-2.5 text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#c8864e]/50"
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="agree-terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-[#444] accent-[#c8864e]"
                    />
                    <label
                      htmlFor="agree-terms"
                      className="text-xs text-gray-600 dark:text-[#999] cursor-pointer"
                    >
                      I agree to the terms of this Service Agreement and confirm that{' '}
                      <strong className="text-gray-800 dark:text-[#ccc]">
                        {signatureName || '[your name]'}
                      </strong>{' '}
                      is my legal name.
                    </label>
                  </div>

                  {/* Signature preview */}
                  {signatureName && (
                    <div className="rounded-lg border border-[#c8864e]/20 bg-[#c8864e]/5 px-4 py-3">
                      <p className="text-[10px] text-gray-400 dark:text-[#666] uppercase tracking-wider mb-1">
                        Signature preview
                      </p>
                      <p
                        className="text-xl text-[#c8864e]"
                        style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                      >
                        {signatureName}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-[#666] mt-1">
                        Signed electronically · {format(new Date(), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-[#2a2a2a]">
              <button
                onClick={() => setAcceptStep('celebrating')}
                className="text-sm text-gray-500 dark:text-[#666] hover:text-gray-700 dark:hover:text-[#999]"
              >
                ← Back
              </button>
              <button
                onClick={handleSignAgreement}
                disabled={!signatureName.trim() || !agreedToTerms}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#c8864e] text-white text-sm font-medium hover:bg-[#b8764e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Pen className="h-4 w-4" />
                Sign & Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment modal ────────────────────────────────────────────────── */}
      {acceptStep === 'payment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] w-full max-w-xl max-h-[90vh] flex flex-col anim-fade-up">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-[#e8e2db]">
                  Payment
                </h3>
                <p className="text-lg font-bold text-[#c8864e]">
                  {formatCurrency(paymentAmountType === 'full' ? quote.totalAmount : depositAmount)}
                </p>
              </div>
              {/* Amount toggle */}
              <div className="flex rounded-lg border border-gray-200 dark:border-[#2a2a2a] overflow-hidden text-xs">
                <button
                  onClick={() => setPaymentAmountType('full')}
                  className={`flex-1 py-2 font-medium transition-colors ${
                    paymentAmountType === 'full'
                      ? 'bg-[#c8864e] text-white'
                      : 'text-gray-600 dark:text-[#999] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                  }`}
                >
                  Full {formatCurrency(quote.totalAmount)}
                </button>
                <button
                  onClick={() => setPaymentAmountType('deposit')}
                  className={`flex-1 py-2 font-medium transition-colors border-l border-gray-200 dark:border-[#2a2a2a] ${
                    paymentAmountType === 'deposit'
                      ? 'bg-[#c8864e] text-white'
                      : 'text-gray-600 dark:text-[#999] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                  }`}
                >
                  50% Deposit {formatCurrency(depositAmount)}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Method selection */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-[#888] uppercase tracking-wider mb-3">
                  Choose payment method
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon
                    const isSelected = paymentMethod === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-[#c8864e] bg-[#c8864e]/5'
                            : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Icon
                            className={`h-4 w-4 ${isSelected ? 'text-[#c8864e]' : 'text-gray-400 dark:text-[#555]'}`}
                          />
                          {isSelected && (
                            <div className="h-4 w-4 rounded-full bg-[#c8864e] flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <p
                          className={`text-xs font-medium ${
                            isSelected ? 'text-[#c8864e]' : 'text-gray-800 dark:text-[#ccc]'
                          }`}
                        >
                          {m.label}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-[#666]">{m.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Credit card form */}
              {paymentMethod === 'card' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-[#888]">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="mt-1 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] px-3 py-2.5 text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#c8864e]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-[#888]">Name on Card</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Full name"
                      className="mt-1 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] px-3 py-2.5 text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#c8864e]/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-[#888]">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] px-3 py-2.5 text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#c8864e]/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-[#888]">CVV</label>
                      <input
                        type="text"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] px-3 py-2.5 text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#c8864e]/50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ACH form */}
              {paymentMethod === 'ach' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-[#888]">Routing Number</label>
                    <input
                      type="text"
                      value={bankRouting}
                      onChange={(e) => setBankRouting(e.target.value)}
                      placeholder="9-digit routing number"
                      maxLength={9}
                      className="mt-1 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] px-3 py-2.5 text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#c8864e]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-[#888]">Account Number</label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Account number"
                      className="mt-1 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] px-3 py-2.5 text-sm text-gray-900 dark:text-[#e8e2db] placeholder:text-gray-400 dark:placeholder:text-[#555] focus:outline-none focus:ring-1 focus:ring-[#c8864e]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-[#888]">Account Type</label>
                    <select className="mt-1 w-full rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] px-3 py-2.5 text-sm text-gray-900 dark:text-[#e8e2db] focus:outline-none focus:ring-1 focus:ring-[#c8864e]/50">
                      <option>Checking</option>
                      <option>Savings</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Affirm info */}
              {paymentMethod === 'affirm' && (
                <div className="rounded-xl bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-[#2a2a2a] p-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-[#e8e2db] mb-1">
                    Financing with Affirm
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[#888] leading-relaxed">
                    Split your {formatCurrency(depositAmount)} deposit into easy monthly payments.
                    Rates from 0%–36% APR. Checking eligibility won&apos;t affect your credit score.
                    You&apos;ll be redirected to Affirm to complete your application.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-[#666] mt-3">
                    Est. from <strong className="text-gray-700 dark:text-[#ccc]">$XX/mo</strong>{' '}
                    depending on your plan.
                  </p>
                </div>
              )}

              {/* Zelle */}
              {paymentMethod === 'zelle' && (
                <div className="rounded-xl bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-[#2a2a2a] p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-[#e8e2db]">
                    Send via Zelle
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-[#888]">Send to (email)</span>
                      <span className="font-medium text-gray-800 dark:text-[#ccc]">
                        billing@shadeotech.com
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-[#888]">Amount</span>
                      <span className="font-semibold text-[#c8864e]">
                        {formatCurrency(depositAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-[#888]">Memo</span>
                      <span className="font-medium text-gray-800 dark:text-[#ccc]">
                        {quote.quoteNumber}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                    <p className="text-xs text-gray-500 dark:text-[#888] mb-2">
                      After sending, upload your payment confirmation:
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-[#333] hover:border-[#c8864e]/50 transition-colors text-xs text-gray-500 dark:text-[#777]">
                      <Upload className="h-4 w-4" />
                      {uploadedFile ? uploadedFile.name : 'Upload payment screenshot'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Check */}
              {paymentMethod === 'check' && (
                <div className="rounded-xl bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-[#2a2a2a] p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-[#e8e2db]">
                    Mail a Check
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-[#888]">Make payable to: </span>
                      <span className="font-semibold text-gray-800 dark:text-[#ccc]">
                        Shadeotech Inc.
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-[#888]">Amount: </span>
                      <span className="font-semibold text-[#c8864e]">
                        {formatCurrency(depositAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-[#888]">Memo: </span>
                      <span className="font-medium text-gray-800 dark:text-[#ccc]">
                        {quote.quoteNumber}
                      </span>
                    </div>
                    <div className="pt-1">
                      <p className="text-gray-500 dark:text-[#888]">Mail to:</p>
                      <p className="text-gray-700 dark:text-[#ccc] mt-0.5">
                        Shadeotech Inc.
                        <br />
                        [Mailing Address]
                        <br />
                        [City, State ZIP]
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                    <p className="text-xs text-gray-500 dark:text-[#888] mb-2">
                      Upload a photo of your check (optional):
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-[#333] hover:border-[#c8864e]/50 transition-colors text-xs text-gray-500 dark:text-[#777]">
                      <Upload className="h-4 w-4" />
                      {uploadedFile ? uploadedFile.name : 'Upload check photo'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-[#2a2a2a]">
              <button
                onClick={() => setAcceptStep('agreement')}
                className="text-sm text-gray-500 dark:text-[#666] hover:text-gray-700 dark:hover:text-[#999]"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={!paymentMethod || paymentSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#c8864e] text-white text-sm font-medium hover:bg-[#b8764e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {paymentSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : paymentMethod === 'zelle' || paymentMethod === 'check' ? (
                  <>
                    <Check className="h-4 w-4" />
                    Submit Payment Info
                  </>
                ) : paymentMethod === 'affirm' ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Continue with Affirm
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay {formatCurrency(paymentAmountType === 'full' ? quote.totalAmount : depositAmount)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Complete screen ──────────────────────────────────────────────── */}
      {acceptStep === 'complete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-10 max-w-sm w-full text-center anim-fade-up">
            <div className="anim-pop mx-auto mb-5 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-[#e8e2db] mb-2">
              You&apos;re all set!
            </h3>
            <p className="text-sm text-gray-500 dark:text-[#888] leading-relaxed">
              Your order has been confirmed. Our team will reach out shortly to coordinate
              installation scheduling.
            </p>
            <div className="mt-3 rounded-lg bg-gray-50 dark:bg-[#161616] px-4 py-3 text-xs text-gray-500 dark:text-[#777]">
              Reference: <span className="font-medium text-gray-700 dark:text-[#ccc]">{quote.quoteNumber}</span>
              <br />
              Deposit: <span className="font-medium text-[#c8864e]">{formatCurrency(depositAmount)}</span>
            </div>
            <button
              onClick={() => { setAcceptStep(null); router.push('/portal') }}
              className="mt-6 w-full py-2.5 rounded-lg bg-[#c8864e] text-white text-sm font-medium hover:bg-[#b8764e] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </>
  )
}
