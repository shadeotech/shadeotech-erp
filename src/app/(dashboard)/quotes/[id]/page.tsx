'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import {
  Send,
  FileText,
  Edit,
  Copy,
  User,
  Calendar,
  Clock,
  PenLine,
  CreditCard,
  CheckCircle2,
  Eye,
  Package,
  Loader2,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { captureElementAsPdfBase64, downloadElementAsPdf } from '@/lib/quotePreviewPdf'
import { useQuotesStore, QuoteStatus } from '@/stores/quotesStore'
import QuotePreviewContent from '@/components/quotes/QuotePreviewContent'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import { canPerformActions } from '@/lib/permissions'
import { normalizeStoredContractTemplates } from '@/lib/contract-templates'
import SignatureComponent from '@/components/shared/SignatureComponent'
import { useToast } from '@/components/ui/use-toast'

function SendToProductionButton({ quoteId, token }: { quoteId: string; token: string | null }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { updateStatus } = useQuotesStore()

  const handle = async () => {
    if (!token || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/quotes/${quoteId}/send-to-production`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast({ title: 'Sent to Pending Approval', description: `Order ${data.orderNumber} created.` })
      updateStatus(quoteId, 'WON')
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
      onClick={handle}
      disabled={loading}
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
      {loading ? 'Sending…' : 'Send to Pending Approval'}
    </Button>
  )
}

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  SENT: 'bg-amber-500/10 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  NEGOTIATION: 'bg-yellow-500/10 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  POSTPONED: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300',
  WON: 'bg-green-500/10 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  LOST: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  EXPIRED: 'bg-gray-500/10 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  NEGOTIATION: 'Negotiating',
  POSTPONED: 'Postponed',
  WON: 'Confirmed',
  LOST: 'Archived',
  EXPIRED: 'Expired',
}

interface QuoteDetailPageProps {
  params: { id: string }
}

export default function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const router = useRouter()
  const { quotes, updateStatus, requestExtend, duplicateQuote, fetchQuotes } = useQuotesStore()
  const { user, token } = useAuthStore()
  const [duplicateLoading, setDuplicateLoading] = useState(false)
  const quote = quotes.find((q) => q.id === params.id)
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [signature, setSignature] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Credit Card')
  const [paymentAmountType, setPaymentAmountType] = useState<'100' | '50' | 'custom'>('50')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [contractSignOpen, setContractSignOpen] = useState(false)
  const [contractSignature, setContractSignature] = useState('')
  const [contractSigned, setContractSigned] = useState(false)
  const [contractSigning, setContractSigning] = useState(false)
  const [contractSending, setContractSending] = useState(false)
  const [contractEmailing, setContractEmailing] = useState(false)
  const [contractId, setContractId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [sendEmail, setSendEmail] = useState('')
  const [sendSubject, setSendSubject] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)
  const [hasPortalAccount, setHasPortalAccount] = useState<boolean | null>(null)
  const [customerDetails, setCustomerDetails] = useState<{
    email?: string; phone?: string; street?: string; city?: string;
    town?: string; postcode?: string; country?: string;
  } | null>(null)
  const [adminSigDataURL, setAdminSigDataURL] = useState<string | null>(null)
  const [contractTemplate, setContractTemplate] = useState<string>('')
  const [contractPaymentOption, setContractPaymentOption] = useState<'50' | '100' | 'custom'>('50')
  const [contractPaymentAmount, setContractPaymentAmount] = useState(0)
  const [convertingInvoice, setConvertingInvoice] = useState(false)

  useEffect(() => {
    if (acceptOpen) {
      setPaymentAmountType('50')
      setPaymentAmount(0)
    }
  }, [acceptOpen])

  useEffect(() => {
    if (token) fetchQuotes(token)
  }, [token, fetchQuotes])

  // Fetch customer details for preview
  useEffect(() => {
    if (!token || !quote?.customerId) return
    fetch(`/api/customers/${quote.customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setCustomerDetails({
            email: data.email,
            phone: data.phone,
            street: data.street,
            city: data.city,
            town: data.town,
            postcode: data.postcode,
            country: data.country,
          })
        }
      })
      .catch(() => {})
  }, [token, quote?.customerId])

  // Fetch contract template whenever the quote is WON and has a contract type
  useEffect(() => {
    if (quote?.status !== 'WON' || !quote?.contractType) return
    setContractTemplate('')
    fetch('/api/settings/company', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const templates = normalizeStoredContractTemplates(data.contractTemplates)
        if (templates && quote.contractType) {
          const raw = templates[quote.contractType]
          setContractTemplate(
            raw
              .replace(/\[CUSTOMER_NAME\]/g, quote.customerName)
              .replace(/\[WARRANTY_PERIOD\]/g, '5')
              .replace(/\[IMAGE_PLACEHOLDER\]/g, '')
          )
        }
      })
      .catch(() => {})
  }, [quote?.status, quote?.contractType, quote?.customerName])

  // Check if a contract already exists for this quote
  useEffect(() => {
    if (!token || !quote || quote.status !== 'WON' || !quote.contractType) return
    fetch(`/api/contracts?quoteId=${quote.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.contracts?.length > 0) {
          setContractSigned(true)
          setContractId(data.contracts[0].id || data.contracts[0]._id || null)
        }
      })
      .catch(() => {})
  }, [token, quote?.id, quote?.status, quote?.contractType])

  if (!quote) {
    return <div className="space-y-4"><h2 className="text-lg font-medium">Estimate not found</h2></div>
  }

  const isExpired = new Date(quote.expiryDate) < new Date() && quote.status !== 'WON'
  const minPayment = quote.totalAmount * 0.5
  const halfAmount = quote.totalAmount * 0.5

  const effectivePaymentAmount = paymentAmountType === '100'
    ? quote.totalAmount
    : paymentAmountType === '50'
      ? halfAmount
      : paymentAmount

  const handleAccept = () => {
    if (effectivePaymentAmount < minPayment || !signature.trim()) return
    const surcharge = paymentMethod === 'Financing' ? effectivePaymentAmount * 0.1 : 0
    const newStatus: QuoteStatus = 'WON'
    updateStatus(quote.id, newStatus, `Accepted with ${paymentMethod} - ${formatCurrency(effectivePaymentAmount)}${surcharge > 0 ? ' +10% surcharge' : ''}`, token ?? undefined)
    setAcceptOpen(false)
  }

  const handleRequestExtend = () => requestExtend(quote.id, 14)

  const handleConvertToInvoice = async () => {
    if (!token) return
    try {
      setConvertingInvoice(true)
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quoteId: quote.id,
          customerId: quote.customerId,
          customerName: quote.customerName,
          sideMark: quote.sideMark,
          items: quote.items,
          taxRate: quote.taxRate,
          notes: quote.notes,
          status: 'SENT',
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to convert quote to invoice')
        return
      }

      const data = await res.json()
      const invoiceId = data?.invoice?.id || data?.invoice?._id
      if (invoiceId) {
        router.push(`/invoices/${invoiceId}`)
      } else {
        router.push('/invoices')
      }
    } catch {
      alert('Failed to convert quote to invoice')
    } finally {
      setConvertingInvoice(false)
    }
  }

  const handleDuplicate = async () => {
    if (!token) return
    setDuplicateLoading(true)
    try {
      const newId = await duplicateQuote(quote.id, token)
      router.push(`/quotes/${newId}`)
    } catch (err) {
      console.error('Duplicate failed:', err)
    } finally {
      setDuplicateLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    await downloadElementAsPdf('quote-pdf-ghost', `Estimate-${quote.quoteNumber}.pdf`)
  }

  const handleOpenSendDialog = async () => {
    const email = customerDetails?.email ?? ''
    setSendEmail(email)
    setSendSubject(`Estimate ${quote.quoteNumber} from Shadeotech`)
    setSendMessage(
      `Dear ${quote.customerName},\n\nPlease find your estimate details below.\n\nEstimate #: ${quote.quoteNumber}\nDate: ${new Date(quote.createdAt).toLocaleDateString()}${quote.expiryDate ? `\nValid Until: ${new Date(quote.expiryDate).toLocaleDateString()}` : ''}\n\nItems:\n${quote.items.map(i => `- ${i.productName} (${i.width} × ${i.length}) × ${i.quantity} = ${formatCurrency(i.totalPrice)}`).join('\n')}\n\nSubtotal: ${formatCurrency(quote.subtotal)}\nTax (${quote.taxRate}%): ${formatCurrency(quote.taxAmount)}\nTotal: ${formatCurrency(quote.totalAmount)}\n\nThank you for considering Shadeotech!\n\nBest regards,\nShadeotech Team`
    )
    setHasPortalAccount(null)
    setSendOpen(true)
    // Check portal account in background after dialog opens
    if (email && token) {
      try {
        const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setHasPortalAccount(data.hasPortalAccount ?? false)
        } else {
          setHasPortalAccount(false)
        }
      } catch {
        setHasPortalAccount(false)
      }
    } else {
      setHasPortalAccount(false)
    }
  }

  const handleSendQuote = async () => {
    if (!token || !sendEmail.trim()) return
    setSendLoading(true)
    try {
      const pdfBase64 = await captureElementAsPdfBase64('quote-pdf-ghost')
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to: sendEmail.trim(),
          subject: sendSubject,
          message: sendMessage,
          attachments: [{
            name: `Quote-${quote.quoteNumber}.pdf`,
            contentType: 'application/pdf',
            contentBytes: pdfBase64,
          }],
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to send email')
        return
      }
      await updateStatus(quote.id, 'SENT', 'Quote sent via email', token)
      setSendOpen(false)
    } catch {
      alert('An error occurred. Please try again.')
    } finally {
      setSendLoading(false)
    }
  }

  const handleSendContract = async () => {
    if (!token) return
    setContractSending(true)
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          quoteId: quote.id,
          adminPaymentOption: contractPaymentOption,
          adminPaymentAmount:
            contractPaymentOption === '100' ? quote.totalAmount :
            contractPaymentOption === 'custom' ? contractPaymentAmount :
            quote.totalAmount * 0.5,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to send contract')
        return
      }
      const data = await res.json().catch(() => ({}))
      const createdId = data?.contract?.id || data?.contract?._id
      if (createdId) setContractId(createdId)
      setContractSigned(true)
    } catch {
      alert('An error occurred. Please try again.')
    } finally {
      setContractSending(false)
    }
  }

  const handleEmailContract = async () => {
    if (!token || !quote?.contractType) return
    if (!customerDetails?.email) {
      alert('Customer email is required to send contract.')
      return
    }

    setContractEmailing(true)
    try {
      let activeContractId = contractId

      // Ensure contract exists before emailing link.
      if (!contractSigned) {
        const createRes = await fetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            quoteId: quote.id,
            adminPaymentOption: contractPaymentOption,
            adminPaymentAmount:
              contractPaymentOption === '100' ? quote.totalAmount :
              contractPaymentOption === 'custom' ? contractPaymentAmount :
              quote.totalAmount * 0.5,
          }),
        })
        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}))
          alert(err.error || 'Failed to prepare contract')
          return
        }
        const createData = await createRes.json().catch(() => ({}))
        activeContractId = createData?.contract?.id || createData?.contract?._id || null
        setContractSigned(true)
        setContractId(activeContractId)
      }

      const contractUrl = activeContractId
        ? `${window.location.origin}/portal/contracts/${activeContractId}`
        : `${window.location.origin}/portal/contracts`

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          to: customerDetails.email,
          subject: `Contract for Quote ${quote.quoteNumber} from Shadeotech`,
          message: `Hi ${quote.customerName},\n\nYour contract is ready for review and signature.\n\nPlease open the contract here:\n${contractUrl}\n\nIf you have any questions, reply to this email.\n\nThank you,\nShadeotech Team`,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to send contract email')
        return
      }

      alert('Contract email sent successfully.')
    } catch {
      alert('An error occurred while sending contract email.')
    } finally {
      setContractEmailing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{quote.quoteNumber}</h2>
            <Badge 
              variant="outline" 
              className={cn('border-0', statusStyles[quote.status])}
            >
              {STATUS_LABELS[quote.status] ?? quote.status}
            </Badge>
            {isExpired && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Expired
              </Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">
            Created on {new Date(quote.createdAt).toLocaleDateString()}
          </p>
        </div>
        {canPerformActions(user, 'sales') && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                <Eye className="mr-1.5 h-4 w-4" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push(`/quotes/${quote.id}/edit`)}>
                <Edit className="mr-1.5 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={duplicateLoading}>
                <Copy className="mr-1.5 h-4 w-4" />
                {duplicateLoading ? 'Duplicating…' : 'Duplicate'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                <FileText className="mr-1.5 h-4 w-4" />
                Download PDF
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Button size="sm" onClick={handleOpenSendDialog}>
                <Send className="mr-1.5 h-4 w-4" />
                Send Estimate
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Estimate Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                      <th className="px-4 py-3 text-left font-medium w-8">#</th>
                      <th className="px-4 py-3 text-left font-medium">Product</th>
                      <th className="px-4 py-3 text-center font-medium w-28">Dimensions</th>
                      <th className="px-4 py-3 text-center font-medium w-16">Qty</th>
                      <th className="px-4 py-3 text-right font-medium w-28">Unit Price</th>
                      <th className="px-4 py-3 text-right font-medium w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {quote.items.map((item, index) => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground text-xs">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{item.productName}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {item.category}{item.subcategory && ` · ${item.subcategory}`}{item.subSubcategory && ` · ${item.subSubcategory}`}
                            </Badge>
                            {item.controlType && (
                              <span className="text-xs text-muted-foreground">{item.controlType}</span>
                            )}
                          </div>
                          {(item.fabricImage || item.cassetteImage || (item.fabricWrap === 'other' && item.fabricWrapImage)) && (
                            <div className="mt-2 flex gap-2">
                              {item.fabricImage && (
                                <img src={item.fabricImage} alt="Fabric" className="h-10 w-10 rounded border object-cover" title="Fabric" />
                              )}
                              {item.cassetteImage && (
                                <img src={item.cassetteImage} alt="Cassette" className="h-10 w-10 rounded border object-cover" title="Cassette" />
                              )}
                              {item.fabricWrap === 'other' && item.fabricWrapImage && (
                                <img src={item.fabricWrapImage} alt="Wrap Fabric" className="h-10 w-10 rounded border object-cover" title="Wrap Fabric" />
                              )}
                            </div>
                          )}
                          {item.sequenceImage && (
                            <img src={item.sequenceImage} alt="Sequence" className="mt-2 h-14 w-14 rounded border object-cover" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-muted-foreground whitespace-nowrap">
                          {item.width} × {item.length}
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 pb-4">
                {quote.addOns && quote.addOns.length > 0 && (() => {
                  const HARD_WIRED_TYPES = ['AC 110 V', 'AC 110V Motor']
                  const RECHARGEABLE_TYPES = ['Motorized', 'Battery Powered', 'Battery powered motor', 'Wand Motor']
                  const hasAnyMotorized = quote.items.some((i) => i.controlType && (i.controlType.toLowerCase().includes('motor') || i.controlType.toLowerCase().includes('battery') || i.controlType.toLowerCase().includes('ac 12') || i.controlType.toLowerCase().includes('ac 110')))
                  const hasHardWired = quote.items.some((i) => HARD_WIRED_TYPES.includes(i.controlType || ''))
                  const hasRechargeable = quote.items.some((i) => RECHARGEABLE_TYPES.includes(i.controlType || ''))
                  const resolveMotorName = (name: string) => {
                    if (!name.toLowerCase().includes('motor') || name.toLowerCase().includes('uni')) return name
                    if (hasRechargeable && !hasHardWired) return 'Rechargeable Motor'
                    if (hasHardWired && !hasRechargeable) return 'Hard Wired Motor'
                    return name
                  }
                  const visibleAddOns = quote.addOns.filter((ao) =>
                    !(ao.name?.toLowerCase().includes('solar') && !hasAnyMotorized)
                  )
                  if (!visibleAddOns.length) return null
                  return (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold">Add-ons</p>
                        {visibleAddOns.map((ao, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{resolveMotorName(ao.name)}</span>
                            <span>{formatCurrency(ao.pricePerFabric)} × {ao.quantity != null && ao.quantity > 0 ? ao.quantity : ao.fabricCount} = {formatCurrency(ao.total)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}

                <Separator className="my-4" />

                {/* Totals */}
                <div className="space-y-2 ml-auto w-56">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax ({quote.taxRate}%)</span>
                    <span>{formatCurrency(quote.taxAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(quote.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-900 dark:text-white">{quote.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Admin Note */}
          {quote.adminNote && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenLine className="h-4 w-4" />
                  Admin Note
                </CardTitle>
                <CardDescription>Internal note — not visible to customer</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{quote.adminNote}</p>
              </CardContent>
            </Card>
          )}

          {/* Contract Section - Only show if quote is accepted and has contract type and not franchisee */}
          {quote.status === 'WON' && quote.contractType && !quote.isFranchisee && (
            <Card>
              <CardHeader>
                <CardTitle>Contract</CardTitle>
                <CardDescription>
                  Review the contract and send it to the customer for e-signing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contractSigned ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Contract sent to customer</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The customer will see the contract in their portal and can sign it there.
                    </p>
                    <Link href="/contracts">
                      <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        View in Contracts
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Contract type label */}
                    <p className="text-sm font-medium">
                      Contract Type:{' '}
                      {quote.contractType === 'INTERIOR' ? 'Interior Shades' :
                       quote.contractType === 'EXTERIOR' ? 'Exterior Shades' :
                       'Interior & Exterior Shades'}
                    </p>

                    {/* Contract content preview */}
                    <div className="bg-gray-50 dark:bg-gray-800 border rounded-lg p-4 max-h-60 overflow-y-auto">
                      {contractTemplate ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 dark:text-white leading-relaxed">
                          {contractTemplate}
                        </pre>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Loading contract template…</p>
                      )}
                    </div>

                    {/* Invoice amount */}
                    <div className="space-y-2">
                      <Label>Invoice Amount to Generate</Label>
                      <Select
                        value={contractPaymentOption}
                        onValueChange={(v) => setContractPaymentOption(v as '50' | '100' | 'custom')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50% deposit — {formatCurrency(quote.totalAmount * 0.5)}</SelectItem>
                          <SelectItem value="100">100% full payment — {formatCurrency(quote.totalAmount)}</SelectItem>
                          <SelectItem value="custom">Custom amount</SelectItem>
                        </SelectContent>
                      </Select>
                      {contractPaymentOption === 'custom' && (
                        <Input
                          type="number"
                          min={0}
                          max={quote.totalAmount}
                          step="0.01"
                          value={contractPaymentAmount}
                          onChange={e => setContractPaymentAmount(parseFloat(e.target.value || '0') || 0)}
                          placeholder={`Enter amount (max ${formatCurrency(quote.totalAmount)})`}
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        Invoice will be generated when the customer signs.
                      </p>
                    </div>

                    <Button onClick={handleSendContract} disabled={contractSending}>
                      {contractSending ? (
                        <><CheckCircle2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
                      ) : (
                        <><Send className="mr-2 h-4 w-4" />Accept &amp; Send Contract</>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link 
                href={`/customers/${quote.customerId}`}
                className="flex items-center gap-3 hover:underline"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{quote.customerName}</p>
                  <p className="text-sm text-muted-foreground">{quote.sideMark}</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quote.history.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{entry.status}</p>
                    <p className="text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Expires</p>
                  <p className="text-muted-foreground">
                    {new Date(quote.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {quote.status !== 'LOST' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(quote as any).dealerId && quote.status === 'SENT' && (
                  <>
                    <Button className="w-full" onClick={() => updateStatus(quote.id, 'WON', undefined, token ?? undefined)}>
                      Accept Dealer Order
                    </Button>
                    <Button className="w-full" variant="destructive" onClick={() => updateStatus(quote.id, 'LOST', undefined, token ?? undefined)}>
                      Reject Dealer Order
                    </Button>
                  </>
                )}
                {!(quote as any).dealerId && (
                  <Button className="w-full" variant="outline" onClick={handleConvertToInvoice} disabled={convertingInvoice}>
                    {convertingInvoice ? 'Converting…' : 'Convert to Invoice'}
                  </Button>
                )}
                <SendToProductionButton quoteId={quote.id} token={token} />
                <Button className="w-full text-gray-500" variant="outline" onClick={() => updateStatus(quote.id, 'LOST', undefined, token ?? undefined)}>
                  Archive Estimate
                </Button>
                {quote.status === 'WON' && quote.contractType && !quote.isFranchisee && !contractSigned && (
                  <Button className="w-full" variant="outline" onClick={handleSendContract} disabled={contractSending}>
                    {contractSending ? 'Sending Contract…' : 'Send Contract'}
                  </Button>
                )}
                {quote.status === 'WON' && quote.contractType && !quote.isFranchisee && (
                  <Button className="w-full" variant="outline" onClick={handleEmailContract} disabled={contractEmailing}>
                    {contractEmailing ? 'Emailing Contract…' : 'Send Contract via Email'}
                  </Button>
                )}
                {isExpired && (
                  <Button className="w-full" variant="outline" onClick={handleRequestExtend}>
                    Request to Extend (adds 14 days)
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Accept dialog */}
      <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Estimate & e-Sign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Signature (type your name)</Label>
              <Input value={signature} onChange={(e) => setSignature(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit Card">Credit Card / ACH (Stripe)</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Financing">Financing (+10% surcharge)</SelectItem>
                  <SelectItem value="Zelle">Zelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Payment Amount (min 50%)</Label>
                <span className="text-sm font-medium">Estimate Total: {formatCurrency(quote.totalAmount)}</span>
              </div>
              <Select
                value={paymentAmountType}
                onValueChange={(v) => {
                  setPaymentAmountType(v as '100' | '50' | 'custom')
                  if (v === 'custom') setPaymentAmount(minPayment)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100% — {formatCurrency(quote.totalAmount)}</SelectItem>
                  <SelectItem value="50">50% — {formatCurrency(halfAmount)}</SelectItem>
                  <SelectItem value="custom">Custom amount</SelectItem>
                </SelectContent>
              </Select>
              {paymentAmountType === 'custom' && (
                <Input
                  type="number"
                  min={minPayment}
                  max={quote.totalAmount}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value || '0') || 0)}
                  placeholder={`Enter amount (min ${formatCurrency(minPayment)})`}
                />
              )}
              <p className="text-xs text-muted-foreground">
                {paymentAmountType === 'custom'
                  ? `Min 50%: ${formatCurrency(minPayment)}. Amount: ${formatCurrency(effectivePaymentAmount)}`
                  : `Selected: ${formatCurrency(effectivePaymentAmount)}`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptOpen(false)}>Cancel</Button>
            <Button onClick={handleAccept} disabled={effectivePaymentAmount < minPayment || !signature}>
              <CreditCard className="mr-2 h-4 w-4" />
              Confirm & Sign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Signing Dialog — commented out (admin e-sign not yet implemented) */}
      {/* <Dialog open={contractSignOpen} onOpenChange={setContractSignOpen}>
        ...admin e-sign dialog...
      </Dialog> */}

      {/* Send Quote Dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Estimate</DialogTitle>
            <DialogDescription>Email this estimate to the customer. Status will be updated to Sent.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>To (Email)</Label>
              <Input value={sendEmail} onChange={e => setSendEmail(e.target.value)} placeholder="customer@email.com" />
            </div>
            <div className="space-y-1">
              <Label>Subject</Label>
              <Input value={sendSubject} onChange={e => setSendSubject(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Message</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[180px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                value={sendMessage}
                onChange={e => setSendMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" className="sm:mr-auto" onClick={() => setPdfPreviewOpen(true)}>
              Preview Attachment
            </Button>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button onClick={handleSendQuote} disabled={sendLoading || !sendEmail.trim()}>
              <Send className="mr-1.5 h-4 w-4" />
              {sendLoading ? 'Sending…' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF attachment preview (excludes measurements — exactly what gets attached) */}
      <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>PDF Attachment Preview – {quote.quoteNumber}</DialogTitle>
            <DialogDescription>This is exactly what will be attached to the email (measurements excluded)</DialogDescription>
          </DialogHeader>
          <QuotePreviewContent quote={quote} customerDetails={customerDetails} excludeMeasurements={true} />
        </DialogContent>
      </Dialog>

      {/* Hidden offscreen div for PDF capture — always rendered, never visible */}
      <div
        id="quote-pdf-ghost"
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '816px', background: 'white', zIndex: -1 }}
        aria-hidden="true"
      >
        <QuotePreviewContent quote={quote} customerDetails={customerDetails} excludeMeasurements={true} />
      </div>

      {/* Quote Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Estimate Preview – {quote.quoteNumber}</DialogTitle>
            <DialogDescription>Preview as the estimate will appear</DialogDescription>
          </DialogHeader>
          <QuotePreviewContent quote={quote} customerDetails={customerDetails} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

