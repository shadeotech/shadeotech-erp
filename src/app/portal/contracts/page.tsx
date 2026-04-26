'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileText,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  PenLine,
  Loader2,
  Lock,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'
import { downloadContractPdf } from '@/lib/contractPdf'
import { normalizeStoredContractTemplates, type ContractType } from '@/lib/contract-templates'
import SignatureComponent from '@/components/shared/SignatureComponent'

interface Contract {
  id: string
  contractNumber: string
  quoteNumber: string
  customerName: string
  customerId: string
  contractType: ContractType
  status: string
  statusLegacy: 'pending_signature' | 'signed'
  createdAt: Date
  sentAt: Date | null
  signedAt: Date | null
  signature: string | null
  adminSignature: string | null
  adminSignatureData: string | null
  adminSignedAt: string | null
  customerSignatureData: string | null
  installationAddress: string | null
  customerFullName: string | null
  adminPaymentOption: string
  adminPaymentAmount: number | null
  locked: boolean
}

const contractTypeLabels: Record<ContractType, string> = {
  INTERIOR: 'Interior Shades',
  EXTERIOR: 'Exterior Shades',
  INTERIOR_AND_EXTERIOR: 'Interior & Exterior Shades',
}

const TEMPLATE_NOT_CONFIGURED = 'Contract template is not configured. Please contact us.'

const fallbackContractTemplates: Record<ContractType, string> = {
  INTERIOR: TEMPLATE_NOT_CONFIGURED,
  EXTERIOR: TEMPLATE_NOT_CONFIGURED,
  INTERIOR_AND_EXTERIOR: TEMPLATE_NOT_CONFIGURED,
}

export default function CustomerContractsPage() {
  const { user, token } = useAuthStore()
  const { toast } = useToast()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [contractTemplates, setContractTemplates] = useState<Record<ContractType, string>>(fallbackContractTemplates)
  const [selectedContract, setSelectedContract] = useState<string | null>(null)

  // View dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  // Signing wizard
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [customerFullName, setCustomerFullName] = useState('')
  const [installationAddress, setInstallationAddress] = useState('')
  const [hasReadTerms, setHasReadTerms] = useState(false)
  const [initialSigDataURL, setInitialSigDataURL] = useState<string | null>(null)
  const [mainSigDataURL, setMainSigDataURL] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)

  // Frozen signing date — set once when wizard opens
  const [signingDate, setSigningDate] = useState<Date>(new Date())

  // Fetch contract templates
  useEffect(() => {
    let isMounted = true
    fetch('/api/settings/company', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const templates = normalizeStoredContractTemplates(data.contractTemplates)
        if (templates && isMounted) setContractTemplates(templates)
      })
      .catch(() => {})
    return () => { isMounted = false }
  }, [])

  // Fetch contracts
  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch('/api/contracts', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { contracts: [] })
      .then(data => {
        const mapped: Contract[] = (data.contracts ?? []).map((c: any) => ({
          id: c.id,
          contractNumber: c.contractNumber,
          quoteNumber: c.quoteNumber ?? '',
          customerName: c.customerName ?? '',
          customerId: c.customerId ?? '',
          contractType: c.contractType ?? 'INTERIOR',
          status: c.status,
          statusLegacy: c.statusLegacy ?? (c.status === 'signed' ? 'signed' : 'pending_signature'),
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          sentAt: c.sentAt ? new Date(c.sentAt) : null,
          signedAt: c.signedAt ? new Date(c.signedAt) : null,
          signature: c.signature ?? null,
          adminSignature: c.adminSignature ?? null,
          adminSignatureData: c.adminSignatureData ?? null,
          adminSignedAt: c.adminSignedAt ?? null,
          customerSignatureData: c.customerSignatureData ?? null,
          installationAddress: c.installationAddress ?? null,
          customerFullName: c.customerFullName ?? null,
          adminPaymentOption: c.adminPaymentOption ?? '50',
          adminPaymentAmount: c.adminPaymentAmount ?? null,
          locked: c.locked ?? false,
        }))
        setContracts(mapped)
      })
      .catch(() => setContracts([]))
      .finally(() => setLoading(false))
  }, [token])

  const selectedContractData = contracts.find(c => c.id === selectedContract)

  const getContractContent = (contract: Contract) => {
    const template = contractTemplates[contract.contractType]
    return template
      .replace(/\[CUSTOMER_NAME\]/g, contract.customerName)
      .replace(/\[WARRANTY_PERIOD\]/g, '5')
      .replace(/\[IMAGE_PLACEHOLDER\]/g, '')
  }

  // ── View dialog ────────────────────────────────────────────────────────────
  const handleViewContract = (contractId: string) => {
    setSelectedContract(contractId)
    setViewDialogOpen(true)
  }

  // ── Signing wizard ─────────────────────────────────────────────────────────
  const openWizard = (contractId: string) => {
    setSelectedContract(contractId)
    setWizardStep(1)
    setCustomerFullName('')
    setInstallationAddress('')
    setHasReadTerms(false)
    setInitialSigDataURL(null)
    setMainSigDataURL(null)
    setSigningDate(new Date())
    setWizardOpen(true)
  }

  const canAdvance = () => {
    if (wizardStep === 1) return customerFullName.trim() !== '' && installationAddress.trim() !== '' && hasReadTerms
    if (wizardStep === 2) return initialSigDataURL !== null
    if (wizardStep === 3) return mainSigDataURL !== null
    return false
  }

  const handleNext = async () => {
    if (wizardStep < 3) {
      setWizardStep(s => s + 1)
    } else {
      // Submit
      if (!selectedContract || !mainSigDataURL || !token) return
      setSigning(true)
      try {
        const res = await fetch(`/api/contracts/${selectedContract}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            action: 'customer_sign',
            signature: customerFullName.trim(),
            signatureData: mainSigDataURL,
            installationAddress: installationAddress.trim(),
            customerFullName: customerFullName.trim(),
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          toast({ title: 'Error', description: err.error || 'Failed to sign contract.', variant: 'destructive' })
          return
        }
        const data = await res.json()
        const updated = data.contract
        setContracts(prev =>
          prev.map(c =>
            c.id === selectedContract
              ? {
                  ...c,
                  status: updated.status,
                  statusLegacy: 'signed',
                  signedAt: updated.signedAt ? new Date(updated.signedAt) : new Date(),
                  signature: updated.signature ?? customerFullName.trim(),
                  locked: true,
                  installationAddress: installationAddress.trim(),
                  customerFullName: customerFullName.trim(),
                  customerSignatureData: updated.customerSignatureData ?? mainSigDataURL,
                }
              : c
          )
        )
        toast({ title: 'Contract signed!', description: 'Your contract has been fully executed.' })
        setWizardOpen(false)
      } catch {
        toast({ title: 'Error', description: 'Failed to sign contract. Please try again.', variant: 'destructive' })
      } finally {
        setSigning(false)
      }
    }
  }

  const handleBack = () => {
    if (wizardStep > 1) setWizardStep(s => s - 1)
  }

  const closeWizard = (open: boolean) => {
    if (!open && !signing) setWizardOpen(false)
  }

  // ── PDF download ───────────────────────────────────────────────────────────
  const handleDownloadContract = (contractId: string) => {
    const contract = contracts.find(c => c.id === contractId)
    if (!contract) return
    downloadContractPdf({
      contractNumber: contract.contractNumber,
      quoteNumber: contract.quoteNumber,
      customerName: contract.customerName,
      contractTypeLabel: contractTypeLabels[contract.contractType],
      content: getContractContent(contract),
      signature: contract.signature,
      signedAt: contract.signedAt,
      adminSignature: contract.adminSignature,
      adminSignedAt: contract.adminSignedAt ? new Date(contract.adminSignedAt) : null,
      adminSignatureData: contract.adminSignatureData,
      customerSignatureData: contract.customerSignatureData,
      installationAddress: contract.installationAddress,
      customerFullName: contract.customerFullName,
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Contracts</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View and sign contracts for your approved quotes
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Loading contracts…</p>
          </CardContent>
        </Card>
      ) : contracts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Contracts</CardTitle>
            <CardDescription>Review and sign contracts associated with your approved quotes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract #</TableHead>
                    <TableHead>Quote</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Signed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map(contract => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                      <TableCell>
                        {contract.quoteNumber ? (
                          <Link href={`/portal/quotes/${contract.quoteNumber}`} className="text-blue-600 hover:underline dark:text-blue-400">
                            {contract.quoteNumber}
                          </Link>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{contractTypeLabels[contract.contractType] ?? contract.contractType}</TableCell>
                      <TableCell>
                        {contract.locked ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <Lock className="w-3 h-3 mr-1" />
                            Fully Executed
                          </Badge>
                        ) : contract.statusLegacy === 'signed' ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Signed
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Signature
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{contract.sentAt ? format(contract.sentAt, 'MMM dd, yyyy') : '—'}</TableCell>
                      <TableCell>{contract.signedAt ? format(contract.signedAt, 'MMM dd, yyyy') : '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewContract(contract.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {!contract.locked && contract.statusLegacy === 'pending_signature' && (
                            <Button size="sm" onClick={() => openWizard(contract.id)}>
                              <PenLine className="h-4 w-4 mr-1" />
                              Sign
                            </Button>
                          )}
                          {contract.locked && contract.adminPaymentAmount != null && contract.adminPaymentAmount > 0 && (
                            <Link href="/portal/payments">
                              <Button variant="outline" size="sm">
                                <CreditCard className="h-4 w-4 mr-1" />
                                Pay
                              </Button>
                            </Link>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadContract(contract.id)}>
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Contracts Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Contracts will appear here once your quotes are approved.
            </p>
            <Link href="/portal/quotes"><Button variant="outline">View Your Quotes</Button></Link>
          </CardContent>
        </Card>
      )}

      {/* ── View Contract Dialog ── */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract — {selectedContractData?.contractNumber}</DialogTitle>
          </DialogHeader>
          {selectedContractData && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 dark:text-white leading-relaxed">
                  {getContractContent(selectedContractData)}
                </pre>
              </div>
              {selectedContractData.statusLegacy === 'signed' && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Contract Signed</span>
                  </div>
                  {selectedContractData.customerFullName && (
                    <p className="text-sm text-muted-foreground">Legal Name: {selectedContractData.customerFullName}</p>
                  )}
                  {selectedContractData.installationAddress && (
                    <p className="text-sm text-muted-foreground">Installation Address: {selectedContractData.installationAddress}</p>
                  )}
                  {selectedContractData.signedAt && (
                    <p className="text-sm text-muted-foreground">Signed: {format(selectedContractData.signedAt, 'MMM dd, yyyy HH:mm')}</p>
                  )}
                  {selectedContractData.customerSignatureData && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Signature</p>
                      <div className="bg-white dark:bg-gray-950 p-2 rounded border inline-block">
                        <img src={selectedContractData.customerSignatureData} alt="Your signature" className="h-12 object-contain" />
                      </div>
                    </div>
                  )}
                  {/* Payment option & invoice — amount set by admin when sending contract */}
                  {(selectedContractData.adminPaymentAmount != null && selectedContractData.adminPaymentAmount > 0) && (
                    <div className="border-t pt-4 mt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Amount due: <strong>${selectedContractData.adminPaymentAmount.toFixed(2)}</strong>
                        {selectedContractData.adminPaymentOption === '50' && ' (50% deposit)'}
                        {selectedContractData.adminPaymentOption === '100' && ' (full amount)'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        An invoice has been created for this contract. View it under <Link href="/portal/invoices" className="underline">Invoices</Link> and pay from <Link href="/portal/payments" className="underline">Payments</Link>.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Link href="/portal/invoices">
                          <Button variant="outline" size="sm">View invoices</Button>
                        </Link>
                        <Link href="/portal/payments">
                          <Button size="sm">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            {selectedContractData && !selectedContractData.locked && selectedContractData.statusLegacy === 'pending_signature' && (
              <Button onClick={() => { setViewDialogOpen(false); openWizard(selectedContractData.id) }}>
                <PenLine className="mr-2 h-4 w-4" />
                Sign Contract
              </Button>
            )}
            <Button variant="outline" onClick={() => selectedContractData && handleDownloadContract(selectedContractData.id)}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Signing Wizard ── */}
      <Dialog open={wizardOpen} onOpenChange={closeWizard}>
        <DialogContent className="max-w-3xl max-h-[90dvh] overflow-hidden flex flex-col p-0">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-lg font-semibold">
              Sign Contract — {selectedContractData?.contractNumber}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Step {wizardStep} of 3 —{' '}
              {wizardStep === 1 ? 'Review & Your Information' :
               wizardStep === 2 ? 'Initial Here (Terms)' :
               'Final Signature'}
            </p>
            {/* Progress bar */}
            <div className="flex gap-1 mt-3">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    wizardStep >= s ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Scrollable step content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Step 1: Review + fields */}
            {wizardStep === 1 && selectedContractData && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Contract Terms</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 dark:text-white leading-relaxed">
                      {getContractContent(selectedContractData)}
                    </pre>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full Legal Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="fullName"
                      value={customerFullName}
                      onChange={e => setCustomerFullName(e.target.value)}
                      placeholder="Enter your full legal name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="installAddr">Installation Site Address <span className="text-destructive">*</span></Label>
                    <Input
                      id="installAddr"
                      value={installationAddress}
                      onChange={e => setInstallationAddress(e.target.value)}
                      placeholder="Address where shades will be installed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Signing Date (auto-generated)</Label>
                  <Input value={format(signingDate, 'MMMM dd, yyyy')} readOnly className="bg-muted cursor-default" />
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Checkbox
                    id="hasRead"
                    checked={hasReadTerms}
                    onCheckedChange={v => setHasReadTerms(!!v)}
                    className="mt-0.5"
                  />
                  <label htmlFor="hasRead" className="text-sm text-blue-900 dark:text-blue-200 cursor-pointer leading-relaxed">
                    I have carefully read and understood all the terms and conditions outlined in this contract.
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Initial signature */}
            {wizardStep === 2 && selectedContractData && (
              <div className="space-y-5">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">Initial here to acknowledge you have read and agree to the terms</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Contract type: <strong>{contractTypeLabels[selectedContractData.contractType]}</strong>
                    {selectedContractData.adminPaymentAmount && (
                      <> · Invoice amount: <strong>${selectedContractData.adminPaymentAmount.toFixed(2)}</strong></>
                    )}
                  </p>
                </div>

                <SignatureComponent
                  label="Initial Signature"
                  userId={user?._id}
                  onSave={setInitialSigDataURL}
                />
                {initialSigDataURL && (
                  <div className="p-2 border rounded bg-white dark:bg-gray-950">
                    <p className="text-xs text-muted-foreground mb-1">Initials saved:</p>
                    <img src={initialSigDataURL} alt="Initials" className="h-10 object-contain" />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Final signature */}
            {wizardStep === 3 && selectedContractData && (
              <div className="space-y-5">
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-900 dark:text-green-200 font-medium">Final execution signature</p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">By signing below you fully execute this contract.</p>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Legal Name</span>
                    <span className="font-medium">{customerFullName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Installation Address</span>
                    <span className="font-medium text-right max-w-[60%]">{installationAddress}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Date of Signing</span>
                    <span className="font-medium">{format(signingDate, 'MMMM dd, yyyy')}</span>
                  </div>
                </div>

                <SignatureComponent
                  label="Final Signature"
                  userId={user?._id}
                  onSave={setMainSigDataURL}
                  disabled={signing}
                />
                {mainSigDataURL && (
                  <div className="p-2 border rounded bg-white dark:bg-gray-950">
                    <p className="text-xs text-muted-foreground mb-1">Signature preview:</p>
                    <img src={mainSigDataURL} alt="Final signature" className="h-12 object-contain" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky navigation */}
          <div className="flex justify-between items-center px-6 py-4 border-t bg-background">
            <Button variant="outline" onClick={handleBack} disabled={wizardStep === 1 || signing}>
              ← Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canAdvance() || signing}
            >
              {signing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing…</>
              ) : wizardStep === 3 ? (
                <><CheckCircle2 className="mr-2 h-4 w-4" />Sign & Execute Contract</>
              ) : (
                <>Next →</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
