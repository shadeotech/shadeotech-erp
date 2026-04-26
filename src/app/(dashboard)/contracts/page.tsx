'use client'

import { useEffect, useMemo, useState } from 'react'
import { DataPagination } from '@/components/ui/data-pagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Download,
  Eye,
  PenLine,
  Search,
  Filter,
  ArrowUpDown,
  Upload,
  History,
  X,
  MoreHorizontal
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { downloadContractPdf } from '@/lib/contractPdf'
import { normalizeStoredContractTemplates, type ContractType } from '@/lib/contract-templates'
import SignatureComponent from '@/components/shared/SignatureComponent'

// Audit trail entry interface
interface AuditTrailEntry {
  id: string
  action: 'created' | 'sent' | 'opened' | 'viewed' | 'signed' | 'downloaded'
  userId?: string
  userName?: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

// Enhanced contract interface with images and audit trail
interface Contract {
  id: string
  contractNumber: string
  quoteNumber: string
  quoteId?: string
  customerName: string
  customerId: string
  contractType: ContractType
  status: 'pending_signature' | 'signed' | 'cancelled'
  statusApi?: 'pending_admin_signature' | 'pending_customer_signature' | 'signed' | 'cancelled'
  createdAt: Date
  sentAt: Date
  signedAt: Date | null
  signature: string | null
  adminSignature: string | null
  adminSignatureData: string | null
  adminSignedAt: string | null
  customerSignatureData: string | null
  installationAddress: string | null
  customerFullName: string | null
  locked: boolean
  images?: string[]
  auditTrail: AuditTrailEntry[]
}

function normalizeContractFromApi(raw: any): Contract {
  const statusLegacy = raw.statusLegacy ?? (raw.status === 'signed' ? 'signed' : 'pending_signature')
  return {
    id: raw.id ?? raw._id,
    contractNumber: raw.contractNumber,
    quoteNumber: raw.quoteNumber,
    quoteId: raw.quoteId,
    customerName: raw.customerName,
    customerId: raw.customerId,
    contractType: raw.contractType,
    status: raw.status === 'cancelled' ? 'cancelled' : statusLegacy,
    statusApi: raw.status,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    sentAt: raw.sentAt ? new Date(raw.sentAt) : new Date(),
    signedAt: raw.signedAt ? new Date(raw.signedAt) : null,
    signature: raw.signature ?? null,
    adminSignature: raw.adminSignature ?? null,
    adminSignatureData: raw.adminSignatureData ?? null,
    adminSignedAt: raw.adminSignedAt ?? null,
    customerSignatureData: raw.customerSignatureData ?? null,
    installationAddress: raw.installationAddress ?? null,
    customerFullName: raw.customerFullName ?? null,
    locked: raw.locked ?? false,
    images: raw.images ?? [],
    auditTrail: (raw.auditTrail ?? []).map((e: any) => ({
      id: e.id ?? `audit_${Date.now()}`,
      action: e.action,
      userId: e.userId,
      userName: e.userName,
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      ipAddress: e.ipAddress,
    })),
  }
}

const contractTypeLabels: Record<ContractType, string> = {
  INTERIOR: 'Interior Shades',
  EXTERIOR: 'Exterior Shades',
  INTERIOR_AND_EXTERIOR: 'Interior & Exterior Shades',
}

const actionLabels: Record<AuditTrailEntry['action'], string> = {
  created: 'Created',
  sent: 'Sent',
  opened: 'Opened',
  viewed: 'Viewed',
  signed: 'Signed',
  downloaded: 'Downloaded',
}

const TEMPLATE_NOT_CONFIGURED = 'Contract template is not configured. Please set it in Settings > Contracts.'

// Fallback text is intentionally generic; the canonical templates live in Settings > Contracts.
const fallbackContractTemplates: Record<ContractType, string> = {
  INTERIOR: TEMPLATE_NOT_CONFIGURED,
  EXTERIOR: TEMPLATE_NOT_CONFIGURED,
  INTERIOR_AND_EXTERIOR: TEMPLATE_NOT_CONFIGURED,
}

type SortField = 'contractNumber' | 'customerName' | 'sentAt' | 'signedAt' | 'createdAt'
type SortOrder = 'asc' | 'desc'

export default function ContractsPage() {
  const { user, token } = useAuthStore()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  const [contractTemplates, setContractTemplates] = useState<Record<ContractType, string>>(fallbackContractTemplates)
  const [selectedContract, setSelectedContract] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [signDialogOpen, setSignDialogOpen] = useState(false)
  const [auditTrailDialogOpen, setAuditTrailDialogOpen] = useState(false)
  const [signature, setSignature] = useState('')
  const [adminSigDataURL, setAdminSigDataURL] = useState<string | null>(null)
  
  // Search and filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Contract['status']>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | ContractType>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  
  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<Record<string, string[]>>({})

  const fetchContracts = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/contracts', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch contracts')
      const data = await res.json()
      setContracts((data.contracts ?? []).map(normalizeContractFromApi))
    } catch (err) {
      console.error('Fetch contracts error:', err)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchContracts()
    else setLoading(false)
  }, [token])

  useEffect(() => {
    let isMounted = true

    const fetchContractTemplates = async () => {
      try {
        const response = await fetch('/api/settings/company', { cache: 'no-store' })
        if (!response.ok) return

        const data = await response.json()
        const templates = normalizeStoredContractTemplates(data.contractTemplates)
        if (!templates || !isMounted) return
        setContractTemplates(templates)
      } catch (error) {
        console.error('Failed to load contract templates from company settings:', error)
      }
    }

    fetchContractTemplates()

    return () => {
      isMounted = false
    }
  }, [])

  const currentUserName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.email ||
    'Current User'

  // Calculate counters
  const counters = useMemo(() => {
    const total = contracts.length
    const pending = contracts.filter(c => c.status === 'pending_signature').length
    const signed = contracts.filter(c => c.status === 'signed').length
    const cancelled = contracts.filter(c => c.status === 'cancelled').length
    return { total, pending, signed, cancelled }
  }, [contracts])

  // Filter and sort contracts
  const filteredAndSortedContracts = useMemo(() => {
    let filtered = contracts.filter(contract => {
      const matchesSearch = 
        !search ||
        contract.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
        contract.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
        contract.customerName.toLowerCase().includes(search.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
      const matchesType = typeFilter === 'all' || contract.contractType === typeFilter
      
      return matchesSearch && matchesStatus && matchesType
    })

    // Sort contracts
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'contractNumber':
          aValue = a.contractNumber
          bValue = b.contractNumber
          break
        case 'customerName':
          aValue = a.customerName
          bValue = b.customerName
          break
        case 'sentAt':
          aValue = a.sentAt.getTime()
          bValue = b.sentAt.getTime()
          break
        case 'signedAt':
          aValue = a.signedAt?.getTime() || 0
          bValue = b.signedAt?.getTime() || 0
          break
        case 'createdAt':
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    return filtered
  }, [contracts, search, statusFilter, typeFilter, sortField, sortOrder])

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const paginatedContracts = useMemo(
    () => filteredAndSortedContracts.slice((page - 1) * perPage, page * perPage),
    [filteredAndSortedContracts, page, perPage]
  )

  const selectedContractData = contracts.find(c => c.id === selectedContract)

  const handleViewContract = (contractId: string) => {
    setSelectedContract(contractId)
    setViewDialogOpen(true)
  }

  const handleSignContract = (contractId: string) => {
    setSelectedContract(contractId)
    setSignDialogOpen(true)
  }

  const handleConfirmSign = async () => {
    if (!selectedContract || !adminSigDataURL || !token) return

    const contract = contracts.find(c => c.id === selectedContract)
    if (!contract) return

    const action = contract.statusApi === 'pending_admin_signature' ? 'admin_sign' : 'customer_sign'
    const sigText = signature.trim() || (user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : 'Admin')

    setSigning(true)
    try {
      const res = await fetch(`/api/contracts/${selectedContract}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, signature: sigText, signatureData: adminSigDataURL }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to sign contract')
      }
      const data = await res.json()
      setContracts(prev =>
        prev.map(c => (c.id === selectedContract ? normalizeContractFromApi(data.contract) : c))
      )
      setSignDialogOpen(false)
      setSignature('')
      setAdminSigDataURL(null)
      setSelectedContract(null)
    } catch (err) {
      console.error('Sign contract error:', err)
      alert(err instanceof Error ? err.message : 'Failed to sign contract')
    } finally {
      setSigning(false)
    }
  }

  const handleDownloadContract = (contractId: string) => {
    const contract = contracts.find((item) => item.id === contractId)
    if (!contract) return

    try {
      const content = getContractContent(contract)
      downloadContractPdf({
        contractNumber: contract.contractNumber,
        quoteNumber: contract.quoteNumber,
        customerName: contract.customerName,
        contractTypeLabel: contractTypeLabels[contract.contractType],
        content,
        signature: contract.signature,
        signedAt: contract.signedAt,
        adminSignature: contract.adminSignature,
        adminSignedAt: contract.adminSignedAt ? new Date(contract.adminSignedAt) : null,
        adminSignatureData: contract.adminSignatureData,
        customerSignatureData: contract.customerSignatureData,
        installationAddress: contract.installationAddress,
        customerFullName: contract.customerFullName,
      })
    } catch (error) {
      console.error('Failed to generate contract PDF:', error)
    }
  }

  const handleImageUpload = (contractId: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    const imageUrls: string[] = []
    Array.from(files).forEach(file => {
      // In production, upload to server and get URL
      // For now, create object URL
      const url = URL.createObjectURL(file)
      imageUrls.push(url)
    })

    setUploadedImages(prev => ({
      ...prev,
      [contractId]: [...(prev[contractId] || []), ...imageUrls]
    }))
  }

  const removeImage = (contractId: string, imageIndex: number) => {
    setUploadedImages(prev => {
      const images = prev[contractId] || []
      const contractImages = contracts.find(c => c.id === contractId)?.images || []
      const allImages = [...contractImages, ...images]
      const newImages = allImages.filter((_, idx) => idx !== imageIndex)
      // Separate back into contract images and uploaded images
      const newUploaded = newImages.slice(contractImages.length)
      return { ...prev, [contractId]: newUploaded }
    })
  }

  const getContractContent = (contract: Contract) => {
    const template = contractTemplates[contract.contractType]
    const images = [...(contract.images || []), ...(uploadedImages[contract.id] || [])]
    
    let content = template
      .replace(/\[CUSTOMER_NAME\]/g, contract.customerName)
      .replace(/\[WARRANTY_PERIOD\]/g, '5')
    
    // Replace image placeholder with actual images
    if (images.length > 0) {
      const imageSection = images.map((img, idx) => 
        `<img src="${img}" alt="Contract Image ${idx + 1}" style="max-width: 100%; margin: 10px 0;" />`
      ).join('\n')
      content = content.replace('[IMAGE_PLACEHOLDER]', imageSection)
    } else {
      content = content.replace('[IMAGE_PLACEHOLDER]', '')
    }
    
    return content
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Agreements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage agreements for approved quotes
          </p>
        </div>
      </div>

      {/* Counter Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4" style={{ borderLeftColor: '#92400E' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Agreements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredAndSortedContracts.length} shown
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#D97706' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Signature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting signature</p>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#16A34A' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Signed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.signed}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-l-4" style={{ borderLeftColor: '#DC2626' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{counters.cancelled}</div>
            <p className="text-xs text-muted-foreground mt-1">Cancelled contracts</p>
          </CardContent>
        </Card>
      </div>

      {/* Search, Filter, and Sort */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contracts, quotes, customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_signature">Pending Signature</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INTERIOR">Interior Shades</SelectItem>
                <SelectItem value="EXTERIOR">Exterior Shades</SelectItem>
                <SelectItem value="INTERIOR_AND_EXTERIOR">Interior & Exterior</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={`${sortField}-${sortOrder}`} onValueChange={(v) => {
              const [field, order] = v.split('-') as [SortField, SortOrder]
              setSortField(field)
              setSortOrder(order)
            }}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="contractNumber-asc">Contract # (A-Z)</SelectItem>
                <SelectItem value="contractNumber-desc">Contract # (Z-A)</SelectItem>
                <SelectItem value="customerName-asc">Customer (A-Z)</SelectItem>
                <SelectItem value="customerName-desc">Customer (Z-A)</SelectItem>
                <SelectItem value="sentAt-desc">Sent Date (Newest)</SelectItem>
                <SelectItem value="sentAt-asc">Sent Date (Oldest)</SelectItem>
                <SelectItem value="signedAt-desc">Signed Date (Newest)</SelectItem>
                <SelectItem value="signedAt-asc">Signed Date (Oldest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contracts</CardTitle>
          <CardDescription>
            View and manage contracts associated with approved quotes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract Number</TableHead>
                <TableHead>Quote Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contract Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent Date</TableHead>
                <TableHead>Signed Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedContracts.length === 0 && filteredAndSortedContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No contracts found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                    <TableCell>
                      <Link 
                        href={`/quotes/${contract.quoteNumber}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {contract.quoteNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{contract.customerName}</TableCell>
                    <TableCell>{contractTypeLabels[contract.contractType]}</TableCell>
                    <TableCell>
                      {contract.status === 'signed' ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Signed
                        </Badge>
                      ) : contract.status === 'cancelled' ? (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <X className="w-3 h-3 mr-1" />
                          Cancelled
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Signature
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{format(contract.sentAt, 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {contract.signedAt ? format(contract.signedAt, 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open actions menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewContract(contract.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          {contract.status === 'pending_signature' && (
                            <DropdownMenuItem onClick={() => handleSignContract(contract.id)}>
                              <PenLine className="w-4 h-4 mr-2" />
                              Sign
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => {
                            setSelectedContract(contract.id)
                            setAuditTrailDialogOpen(true)
                          }}>
                            <History className="w-4 h-4 mr-2" />
                            Audit Trail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadContract(contract.id)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <DataPagination
            total={filteredAndSortedContracts.length}
            page={page}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(n) => { setPerPage(n); setPage(1) }}
          />
        </CardContent>
      </Card>

      {/* View Contract Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract - {selectedContractData?.contractNumber}</DialogTitle>
            <DialogDescription>
              Contract for {selectedContractData?.customerName}
            </DialogDescription>
          </DialogHeader>

          {selectedContractData && (
            <Tabs defaultValue="contract" className="w-full">
              <TabsList>
                <TabsTrigger value="contract">Contract</TabsTrigger>
                <TabsTrigger value="images">
                  Images ({[...(selectedContractData.images || []), ...(uploadedImages[selectedContractData.id] || [])].length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contract" className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ 
                      __html: getContractContent(selectedContractData).replace(/\n/g, '<br />')
                    }}
                  />
                </div>

                {selectedContractData.status === 'signed' && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Contract Signed</span>
                    </div>
                    {/* Admin signature */}
                    {(selectedContractData.adminSignatureData || selectedContractData.adminSignature) && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Admin / Company</p>
                        {selectedContractData.adminSignatureData ? (
                          <div className="bg-white dark:bg-gray-950 p-2 rounded border inline-block">
                            <img src={selectedContractData.adminSignatureData} alt="Admin signature" className="h-10 object-contain" />
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-300 italic">{selectedContractData.adminSignature}</p>
                        )}
                        {selectedContractData.adminSignedAt && (
                          <p className="text-xs text-muted-foreground">Signed: {format(new Date(selectedContractData.adminSignedAt), 'MMM dd, yyyy HH:mm')}</p>
                        )}
                      </div>
                    )}
                    {/* Customer signature — same e-sign (Draw/Type/Saved) as admin */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customer signature</p>
                      {selectedContractData.customerSignatureData ? (
                        <div className="bg-white dark:bg-gray-950 p-2 rounded border inline-block">
                          <img src={selectedContractData.customerSignatureData} alt="Customer signature" className="h-12 object-contain" />
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">{selectedContractData.signature ?? '—'}</p>
                      )}
                      {selectedContractData.customerFullName && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">Legal name: {selectedContractData.customerFullName}</p>
                      )}
                      {selectedContractData.installationAddress && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">Installation address: {selectedContractData.installationAddress}</p>
                      )}
                      {selectedContractData.signedAt && (
                        <p className="text-xs text-muted-foreground">Signed: {format(selectedContractData.signedAt, 'MMM dd, yyyy HH:mm')}</p>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="images" className="space-y-4">
                <div className="space-y-4">
                  {/* Upload Images */}
                  <div>
                    <Label>Add Images to Contract</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(selectedContractData.id, e.target.files)}
                        className="hidden"
                        id="image-upload"
                      />
                      <Label htmlFor="image-upload" asChild>
                        <Button variant="outline" className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Images
                        </Button>
                      </Label>
                    </div>
                  </div>

                  {/* Display Images */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...(selectedContractData.images || []), ...(uploadedImages[selectedContractData.id] || [])].map((img, idx) => {
                      const isUploaded = uploadedImages[selectedContractData.id]?.includes(img) || idx >= (selectedContractData.images?.length || 0)
                      return (
                        <div key={idx} className="relative group">
                          <div className="aspect-square relative rounded-lg overflow-hidden border">
                            <Image
                              src={img}
                              alt={`Contract image ${idx + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          {isUploaded && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(selectedContractData.id, idx)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => selectedContractData && handleDownloadContract(selectedContractData.id)}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign Contract Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sign Contract - {selectedContractData?.contractNumber}</DialogTitle>
            <DialogDescription>
              Please review and sign the contract for {selectedContractData?.customerName}
            </DialogDescription>
          </DialogHeader>

          {selectedContractData && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg max-h-96 overflow-y-auto border">
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ 
                    __html: getContractContent(selectedContractData).replace(/\n/g, '<br />')
                  }}
                />
              </div>

              <div className="border-t pt-4 space-y-3">
                <SignatureComponent
                  label="Your Signature"
                  userId={user?._id}
                  onSave={(url) => {
                    setAdminSigDataURL(url)
                    if (!signature.trim() && user) {
                      setSignature([user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Admin')
                    }
                  }}
                  disabled={signing}
                />
                {adminSigDataURL && (
                  <div className="p-2 border rounded bg-white dark:bg-gray-950">
                    <img src={adminSigDataURL} alt="Signature preview" className="h-10 object-contain" />
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  By signing, you agree to the terms and conditions above.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSignDialogOpen(false)
              setSignature('')
              setAdminSigDataURL(null)
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSign}
              disabled={!adminSigDataURL || signing}
            >
              <PenLine className="mr-2 h-4 w-4" />
              {signing ? 'Signing…' : 'Sign Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Trail Dialog */}
      <Dialog open={auditTrailDialogOpen} onOpenChange={setAuditTrailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Trail - {selectedContractData?.contractNumber}</DialogTitle>
            <DialogDescription>
              Complete history of contract actions and events
            </DialogDescription>
          </DialogHeader>

          {selectedContractData && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedContractData.auditTrail
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 dark:bg-gray-800">
                      <div className="flex-shrink-0 mt-1">
                        {entry.action === 'created' && <FileText className="w-4 h-4 text-blue-500" />}
                        {entry.action === 'sent' && <Download className="w-4 h-4 text-purple-500" />}
                        {entry.action === 'opened' && <Eye className="w-4 h-4 text-orange-500" />}
                        {entry.action === 'viewed' && <Eye className="w-4 h-4 text-cyan-500" />}
                        {entry.action === 'signed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {entry.action === 'downloaded' && <Download className="w-4 h-4 text-indigo-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {actionLabels[entry.action]}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {format(entry.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                          </p>
                        </div>
                        {entry.userName && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            By: {entry.userName}
                          </p>
                        )}
                        {entry.ipAddress && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            IP: {entry.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAuditTrailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

