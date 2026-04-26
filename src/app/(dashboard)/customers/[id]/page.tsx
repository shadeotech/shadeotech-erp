'use client'

import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Device } from '@twilio/voice-sdk'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Notebook,
  StickyNote,
  PhoneCall,
  MessageCircle,
  FileText,
  Eye,
  Copy,
  Plus,
  MoreHorizontal,
  Bold,
  Italic,
  Underline,
  Link2,
  Image as ImageIcon,
  GraduationCap,
  LayoutGrid,
  Paperclip,
  ChevronDown,
  UserPlus,
  Check,
  KeyRound,
  Star,
  Share2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Pencil,
  Users,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { downloadQuotePdf } from '@/lib/quotePdf'
import { QuoteBuilder } from '@/components/quotes/QuoteBuilder'
import { useCommuteTime } from '@/hooks/useCommuteTime'
import { InlineEditableField } from '@/components/customers/InlineEditableField'
import { InlineEditableSelect } from '@/components/customers/InlineEditableSelect'
import { useSalesStore } from '@/stores/salesStore'
import { CreateInvoiceModal } from '@/components/invoices/CreateInvoiceModal'
import { validatePhone, sanitizePhoneInput, PHONE_MAX_LENGTH } from '@/lib/phoneValidation'
import { SendEmailModal } from '@/components/shared/SendEmailModal'

interface CustomerContact {
  _id?: string
  name: string
  relationship: string
  phone?: string
  mobile?: string
  email?: string
  notes?: string
}

interface DealerCustomer {
  id: string
  name: string
  email: string
  phone: string
  type: string
  source: string
  status: string
  sideMark: string
  taxExempt?: boolean
  address?: string
  mobile?: string
  street?: string
  town?: string
  city?: string
  country?: string
  postcode?: string
  createdAt?: string
  activities?: any[]
  ownerName?: string
  storeNumber?: string
  shippingAddress?: string
  leadSource?: string
  leadSourceDetail?: string
  referredById?: string | null
  referredByName?: string | null
  contacts?: CustomerContact[]
}

type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

interface AssignableUser {
  id: string
  _id: string
  name: string
  firstName: string
  lastName: string
  role: string
}

const statusStyles: Record<string, string> = {
  LEAD: 'bg-blue-50 text-blue-700 border-blue-200',
  CUSTOMER: 'bg-amber-50 text-amber-700 border-amber-200',
}

const quoteStatusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
  SENT: 'bg-blue-50 text-blue-700 border-blue-200',
  NEGOTIATION: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  POSTPONED: 'bg-orange-50 text-orange-700 border-orange-200',
  WON: 'bg-amber-50 text-amber-700 border-amber-200',
  LOST: 'bg-red-50 text-red-700 border-red-200',
  EXPIRED: 'bg-gray-100 text-gray-500 border-gray-200',
}

// Types for API data
interface CustomerTask {
  id: string
  title: string
  dueDate?: string
  status: string
  priority?: string
}

interface CustomerAppointment {
  id: string
  title: string
  start: string
  end: string
  type?: string
}


const mockEmails = [
  { id: 'E-1', subject: 'Order confirmation', date: '2025-01-12', direction: 'Outgoing' },
]

const mockReferrals = [
  { id: 'R-1', name: 'Bright Dental Group', type: 'Commercial', sideMark: 'SHC-LL54321' },
]

function toE164(phone: string | undefined): string | null {
  if (!phone || !phone.trim()) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (phone.trim().startsWith('+') && /^\+[1-9]\d{7,14}$/.test(phone.trim())) return phone.trim()
  return null
}

function CustomerCommute({ destinationAddress }: { destinationAddress: string }) {
  const [companyAddress, setCompanyAddress] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/settings/company')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.companyAddress === 'string') setCompanyAddress(data.companyAddress)
      })
      .catch(() => {})
  }, [])
  const commute = useCommuteTime(destinationAddress, companyAddress)
  if (commute.isLoading && !commute.durationText) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Commute from company…
      </div>
    )
  }
  if (commute.error && !commute.durationText) return null
  if (!commute.durationText) return null
  return (
    <div className="text-xs text-muted-foreground mt-1">
      <span className="text-green-600 dark:text-green-400">🚗 {commute.durationText} · {commute.distanceText} from company</span>
    </div>
  )
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [customer, setCustomer] = useState<DealerCustomer | null>(null)
  const [isCrmCustomer, setIsCrmCustomer] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [createInvoiceModalOpen, setCreateInvoiceModalOpen] = useState(false)
  const { invoices: allInvoices, initializeData: initSalesStore } = useSalesStore()
  const invoices = useMemo(() => {
    if (!customer?.id) return []
    return allInvoices.filter((inv: any) => inv.customerId === customer.id)
  }, [allInvoices, customer?.id])
  const [tasks, setTasks] = useState<CustomerTask[]>([])
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [dealerRole, setDealerRole] = useState<string>('')
  const [note, setNote] = useState('')
  const [activityType, setActivityType] = useState<'note' | 'call' | 'text'>('note')
  const [noteSaving, setNoteSaving] = useState(false)
  const [createTaskFromNote, setCreateTaskFromNote] = useState(false)
  const [callOutcome, setCallOutcome] = useState<string>('')
  const [callDirection, setCallDirection] = useState<'INBOUND' | 'OUTBOUND' | ''>('')
  const [callDate, setCallDate] = useState('')
  const [callTime, setCallTime] = useState('')
  const [callDescription, setCallDescription] = useState('')
  const [callFollowUpTask, setCallFollowUpTask] = useState(false)
  const [callFollowUpDays, setCallFollowUpDays] = useState('3')
  const [logCallOpen, setLogCallOpen] = useState(false)
  const [logTextOpen, setLogTextOpen] = useState(false)
  const [textDescription, setTextDescription] = useState('')
  const [textDate, setTextDate] = useState('')
  const [textTime, setTextTime] = useState('')
  const [textFollowUpTask, setTextFollowUpTask] = useState(false)
  const [textFollowUpDays, setTextFollowUpDays] = useState('3')
  // Log Email dialog state
  const [logEmailOpen, setLogEmailOpen] = useState(false)
  const [emailDirection, setEmailDirection] = useState<'INBOUND' | 'OUTBOUND' | ''>('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailDate, setEmailDate] = useState('')
  const [emailTime, setEmailTime] = useState('')
  const [emailDescription, setEmailDescription] = useState('')
  const [emailFollowUpTask, setEmailFollowUpTask] = useState(false)
  const [emailFollowUpDays, setEmailFollowUpDays] = useState('3')

  // Twilio Call
  const deviceRef = useRef<Device | null>(null)
  const callRef = useRef<import('@twilio/voice-sdk').Call | null>(null)
  const callDescRef = useRef<HTMLTextAreaElement>(null)
  const emailDescRef = useRef<HTMLTextAreaElement>(null)
  const textDescRef = useRef<HTMLTextAreaElement>(null)
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'in-call'>('idle')
  const [callLoading, setCallLoading] = useState(false)

  // Twilio SMS
  const [smsModalOpen, setSmsModalOpen] = useState(false)
  const [smsMessage, setSmsMessage] = useState('')
  const [smsSending, setSmsSending] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState<{
    alreadyExists: boolean
    reactivated?: boolean
    email: string
    tempPassword?: string
    message: string
  } | null>(null)

  // Email modal
  const [sendEmailOpen, setSendEmailOpen] = useState(false)

  // Create Task modal (match /tasks page)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskCreating, setTaskCreating] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [assignableUsersLoading, setAssignableUsersLoading] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    assignedTo: '',
    dueDate: '',
  })

  // Quote creation modal
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false)

  // Contacts tab state
  const [contacts, setContacts] = useState<CustomerContact[]>([])
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<CustomerContact | null>(null)
  const [savingContacts, setSavingContacts] = useState(false)
  const emptyContact: CustomerContact = { name: '', relationship: 'Spouse', phone: '', mobile: '', email: '', notes: '' }
  const [contactForm, setContactForm] = useState<CustomerContact>(emptyContact)

  // Files tab state
  const [customerFiles, setCustomerFiles] = useState<any[]>([])
  const [customerContracts, setCustomerContracts] = useState<any[]>([])
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([])
  const [fileUploading, setFileUploading] = useState(false)
  const [uploadCategory, setUploadCategory] = useState<'tax_exemption' | 'other'>('other')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Portal tab state
  const [portalStatus, setPortalStatus] = useState<{
    hasAccount: boolean
    email?: string | null
    userId?: string
    isActive?: boolean
    pointsBalance?: number
    totalReferrals?: number
    purchasedReferrals?: number
  } | null>(null)
  const [portalStatusLoading, setPortalStatusLoading] = useState(false)
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
  const [resetPasswordResult, setResetPasswordResult] = useState<{ email: string; tempPassword: string } | null>(null)
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
  const [portalReferrals, setPortalReferrals] = useState<any[]>([])
  const [updatingReferralId, setUpdatingReferralId] = useState<string | null>(null)
  const [portalClaims, setPortalClaims] = useState<any[]>([])
  const [approvingClaimId, setApprovingClaimId] = useState<string | null>(null)
  const [customerReferrals, setCustomerReferrals] = useState<any[] | null>(null)
  const [customerReferralsLoading, setCustomerReferralsLoading] = useState(false)

  // Fetch dealer and their data
  const fetchDealerData = useCallback(async () => {
    if (!token || !params.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Fetch all orders to find dealer (non-admin may not have access — treat as empty)
      let allOrders: any[] = []
      try {
        const ordersRes = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          allOrders = ordersData.orders || []
        }
      } catch (_) {}

      // Find orders: by dealerId (for franchisees) or by customerId (for Shadeotech customers)
      const dealerOrders = allOrders.filter((o: any) => o.dealerId === params.id)
      const customerOrders = allOrders.filter((o: any) => o.customerId === params.id)
      const ordersToShow = dealerOrders.length > 0 ? dealerOrders : customerOrders
      setOrders(ordersToShow)

      // Fetch users to get dealer details (admin-only endpoint — treat as empty for staff)
      let users: any[] = []
      try {
        const usersRes = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          users = usersData.users || []
        }
      } catch (_) {}

      const dealerUser = users.find((u: any) => (u._id === params.id || u.id === params.id))
      
      // Store dealer role
      const userRole = dealerUser?.role || ''
      setDealerRole(userRole)
      
      // Get most recent customer name from orders
      const sortedOrders = [...ordersToShow].sort((a, b) => {
        const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0
        const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0
        return dateB - dateA
      })
      const customerName = sortedOrders.length > 0 && (sortedOrders[0].customerName || sortedOrders[0].dealerName)
        ? (sortedOrders[0].customerName || sortedOrders[0].dealerName)
        : 'N/A'

      let customerData: DealerCustomer | null = null
      if (dealerUser || ordersToShow.length > 0) {
        customerData = {
          id: params.id,
          name: ordersToShow[0]?.dealerName || ordersToShow[0]?.customerName || dealerUser?.name || 'Unknown',
          email: dealerUser?.email || '',
          phone: dealerUser?.phone || '',
          mobile: dealerUser?.mobile || '',
          type: userRole === 'FRANCHISEE' ? 'FRANCHISEE' : 'PARTNER',
          source: 'Manual',
          status: 'CUSTOMER',
          sideMark: ordersToShow[0]?.sideMark || customerName,
          address: dealerUser?.address || dealerUser?.street || '',
          street: dealerUser?.street || '',
          town: dealerUser?.town || '',
          city: dealerUser?.city || '',
          country: dealerUser?.country || '',
          postcode: dealerUser?.postcode || '',
          createdAt: ordersToShow.length > 0 
            ? new Date(ordersToShow[ordersToShow.length - 1].orderDate || ordersToShow[ordersToShow.length - 1].createdAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
          activities: [],
        }
      } else {
        // Try fetching from customers API (for CRM customers)
        const custRes = await fetch(`/api/customers/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (custRes.ok) {
          const custData = await custRes.json()
          customerData = {
            id: params.id,
            name: custData.name || 'Unknown',
            email: custData.email || '',
            phone: custData.phone || '',
            mobile: custData.mobile || '',
            type: (custData.customerType || 'RESIDENTIAL') as any,
            source: 'Manual',
            status: (custData.status === 'LEAD' ? 'LEAD' : 'CUSTOMER') as any,
            sideMark: custData.sideMark || 'N/A',
            address: custData.address || custData.street || '',
            street: custData.street || '',
            town: custData.town || '',
            city: custData.city || '',
            country: custData.country || '',
            postcode: custData.postcode || '',
            taxExempt: !!custData.taxExempt,
            createdAt: custData.createdAt ? new Date(custData.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
            activities: [],
          }
        }
      }

      if (customerData) {
        let custJson: any = null
        const custCheckRes = await fetch(`/api/customers/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (custCheckRes.ok) {
          setIsCrmCustomer(true)
          custJson = await custCheckRes.json()
          customerData = {
            ...customerData,
            name: custJson.name ?? customerData.name,
            email: custJson.email ?? customerData.email,
            phone: custJson.phone ?? customerData.phone,
            mobile: custJson.mobile ?? customerData.mobile,
            address: custJson.address ?? customerData.address,
            street: custJson.street ?? customerData.street,
            town: custJson.town ?? customerData.town,
            city: custJson.city ?? customerData.city,
            country: custJson.country ?? customerData.country,
            postcode: custJson.postcode ?? customerData.postcode,
            sideMark: custJson.sideMark ?? customerData.sideMark,
            status: (custJson.status ?? customerData.status) as string,
            type: (custJson.customerType ?? custJson.type ?? customerData.type) as string,
            ownerName: custJson.ownerName,
            storeNumber: custJson.storeNumber,
            shippingAddress: custJson.shippingAddress,
            leadSource: custJson.leadSource ?? undefined,
            leadSourceDetail: custJson.leadSourceDetail ?? undefined,
            referredById: custJson.referredById ?? null,
            referredByName: custJson.referredByName ?? null,
            contacts: custJson.contacts ?? [],
          }
        }
        // Load contacts from customer record
        setContacts((custJson?.contacts || []))
        const notesRes = await fetch(`/api/notes?customerId=${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (notesRes.ok) {
          const notesData = await notesRes.json()
          const activities = (notesData.notes || []).map((n: any) => ({
            id: n.id || n._id,
            type: (n.type || n.noteType?.toLowerCase() || 'note') as 'note' | 'call' | 'text' | 'email',
            content: n.content,
            direction: n.direction ?? null,
            outcome: n.outcome ?? null,
            subject: n.subject ?? null,
            loggedAt: n.loggedAt ?? null,
            timestamp: n.loggedAt || n.createdAt || n.timestamp,
          }))
          customerData = { ...customerData, activities }
        }
        setCustomer(customerData)

        // Set files from the customer record
        setCustomerFiles(custJson?.files || (customerData as any)?.files || [])

        // Fetch contracts for this customer
        try {
          const contractsRes = await fetch(`/api/contracts?customerId=${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (contractsRes.ok) {
            const contractsData = await contractsRes.json()
            setCustomerContracts(contractsData.contracts || [])
          }
        } catch { /* silently fail */ }

        // Fetch invoices for this customer
        try {
          const invRes = await fetch(`/api/invoices?customerId=${params.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (invRes.ok) {
            const invData = await invRes.json()
            setCustomerInvoices(invData.invoices || [])
          }
        } catch { /* silently fail */ }
      }

      // Fetch quotes for this customer
      try {
        const quotesRes = await fetch(`/api/quotes?customerId=${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (quotesRes.ok) {
          const quotesData = await quotesRes.json()
          setQuotes(quotesData.quotes || [])
        }
      } catch {
        // silently fail - quotes tab will show empty
      }

      // Fetch payments (if API exists) - for now keep empty
      setPayments([])

      // Fetch tasks for this customer
      try {
        const tasksRes = await fetch(`/api/tasks?customerId=${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          setTasks((tasksData.tasks || []).map((t: any) => ({
            id: t.id || t._id,
            title: t.title,
            dueDate: t.dueDate,
            status: t.status || 'TODO',
            priority: t.priority,
          })))
        } else {
          setTasks([])
        }
      } catch {
        setTasks([])
      }

      // Fetch calendar events (appointments) for this customer
      try {
        const eventsRes = await fetch(`/api/calendar/events?customerId=${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json()
          setAppointments((eventsData.events || []).map((e: any) => ({
            id: e.id || e._id,
            title: e.title,
            start: e.start,
            end: e.end,
            type: e.type,
          })))
        } else {
          setAppointments([])
        }
      } catch {
        setAppointments([])
      }
    } catch (error) {
      console.error('Error fetching dealer data:', error)
    } finally {
      setLoading(false)
    }
  }, [token, params.id])

  useEffect(() => {
    fetchDealerData()
  }, [fetchDealerData])

  useEffect(() => {
    initSalesStore()
  }, [initSalesStore])

  const fetchCustomerReferrals = useCallback(async () => {
    if (!token || !params.id) return
    setCustomerReferralsLoading(true)
    try {
      const res = await fetch(`/api/customers/${params.id}/referrals`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const d = await res.json()
        setCustomerReferrals(d.referrals ?? [])
      }
    } catch { /* silent */ }
    finally { setCustomerReferralsLoading(false) }
  }, [token, params.id])

  const fetchPortalStatus = useCallback(async () => {
    if (!token || !params.id) return
    setPortalStatusLoading(true)
    try {
      const [statusRes, referralsRes, claimsRes] = await Promise.all([
        fetch(`/api/customers/${params.id}/portal-status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/customers/${params.id}/portal-referrals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/pending-approvals', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setPortalStatus(statusData)
        // Filter claims to this customer's userId
        if (claimsRes.ok) {
          const claimsData = await claimsRes.json()
          const userId = statusData.userId
          setPortalClaims(userId ? (claimsData.approvals ?? []).filter((a: any) => a.userId === userId) : [])
        }
      }
      if (referralsRes.ok) {
        const d = await referralsRes.json()
        setPortalReferrals(d.referrals ?? [])
      }
    } catch { /* silent */ }
    finally { setPortalStatusLoading(false) }
  }, [token, params.id])

  const handleUpdateReferralStatus = useCallback(async (referralId: string, status: string) => {
    if (!token) return
    setUpdatingReferralId(referralId)
    try {
      const res = await fetch(`/api/portal/referrals/${referralId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setPortalReferrals((prev) => prev.map((r) => r.id === referralId ? { ...r, status } : r))
        if (status === 'PURCHASED') {
          setPortalStatus((prev) => prev ? {
            ...prev,
            purchasedReferrals: (prev.purchasedReferrals ?? 0) + 1,
            pointsBalance: (prev.pointsBalance ?? 0) + 200,
          } : prev)
          toast({ title: 'Points awarded', description: '200 points credited to customer.' })
        }
      } else {
        const d = await res.json()
        toast({ title: 'Error', description: d.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update referral', variant: 'destructive' })
    } finally {
      setUpdatingReferralId(null)
    }
  }, [token, toast])

  const handleResetPassword = useCallback(async () => {
    if (!token || !params.id) return
    setResetPasswordLoading(true)
    try {
      const res = await fetch(`/api/customers/${params.id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      setResetPasswordResult(data)
    } catch {
      toast({ title: 'Error', description: 'Failed to reset password', variant: 'destructive' })
    } finally {
      setResetPasswordLoading(false)
    }
  }, [token, params.id, toast])

  const handleApproveClaim = useCallback(async (claimId: string, action: 'approve' | 'reject') => {
    if (!token) return
    setApprovingClaimId(claimId)
    try {
      const res = await fetch('/api/admin/pending-approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: claimId, action }),
      })
      if (res.ok) {
        setPortalClaims((prev) => prev.filter((c) => c.id !== claimId))
        toast({ title: action === 'approve' ? 'Points approved' : 'Claim rejected' })
        if (action === 'approve') {
          setPortalStatus((prev) => prev ? { ...prev, pointsBalance: (prev.pointsBalance ?? 0) + (portalClaims.find(c => c.id === claimId)?.amount ?? 0) } : prev)
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to process claim', variant: 'destructive' })
    } finally {
      setApprovingClaimId(null)
    }
  }, [token, toast, portalClaims])

  const saveCustomerField = useCallback(
    async (field: string, value: string) => {
      if (!token || !customer?.id) return
      if (field === 'phone' || field === 'mobile') {
        const err = validatePhone(value)
        if (err) {
          toast({ title: 'Invalid phone', description: err, variant: 'destructive' })
          throw new Error(err)
        }
      }
      try {
        const body: Record<string, string> = { [field]: value }
        if (field === 'name') {
          body.name = value
        }
        const res = await fetch(`/api/customers/${customer.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to save')
        }
        const data = await res.json()
        const updated = data.customer || data
        setCustomer((prev) =>
          prev
            ? {
                ...prev,
                name: updated.name ?? prev.name,
                email: updated.email ?? prev.email,
                phone: updated.phone ?? prev.phone,
                mobile: updated.mobile ?? prev.mobile,
                address: updated.address ?? prev.address,
                street: updated.street ?? prev.street,
                town: updated.town ?? prev.town,
                city: updated.city ?? prev.city,
                country: updated.country ?? prev.country,
                postcode: updated.postcode ?? prev.postcode,
                sideMark: updated.sideMark ?? prev.sideMark,
                status: updated.status ?? prev.status,
                type: updated.customerType ?? updated.type ?? prev.type,
                ownerName: updated.ownerName ?? (prev as any).ownerName,
                storeNumber: updated.storeNumber ?? (prev as any).storeNumber,
                shippingAddress: updated.shippingAddress ?? (prev as any).shippingAddress,
              }
            : null
        )
        toast({ title: 'Saved', description: 'Customer updated' })
      } catch (e) {
        toast({
          title: 'Error',
          description: e instanceof Error ? e.message : 'Failed to save',
          variant: 'destructive',
        })
        throw e
      }
    },
    [token, customer?.id, toast]
  )

  useEffect(() => {
    return () => {
      const call = callRef.current
      if (call) call.disconnect()
      const device = deviceRef.current
      if (device) device.unregister()
    }
  }, [])

  // Fetch assignees for dropdown (admin-only endpoint; safe fallback to empty)
  const fetchAssignableUsers = useCallback(async () => {
    if (!token) return
    try {
      setAssignableUsersLoading(true)
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setAssignableUsers([])
        return
      }
      const data = await res.json()
      const filtered = (data.users || [])
        .filter((u: any) => u.role === 'ADMIN' || u.role === 'STAFF')
        .map((u: any) => ({
          id: u._id || u.id,
          _id: u._id || u.id,
          name: `${u.firstName} ${u.lastName}`,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
        }))
      setAssignableUsers(filtered)
    } catch (e) {
      console.error('Error fetching users for task assignment:', e)
      setAssignableUsers([])
    } finally {
      setAssignableUsersLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchAssignableUsers()
  }, [fetchAssignableUsers])

  const handleCreateTask = async () => {
    if (!token || !newTask.title || !newTask.dueDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      setTaskCreating(true)
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description || undefined,
          priority: newTask.priority,
          assignedTo: newTask.assignedTo ? [newTask.assignedTo] : undefined,
          dueDate: newTask.dueDate,
          customerId: customer?.id || params.id,
          customerName: customer?.name,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create task')
      }

      toast({
        title: 'Success',
        description: 'Task created successfully',
      })
      setNewTask({ title: '', description: '', priority: 'MEDIUM', assignedTo: '', dueDate: '' })
      setTaskDialogOpen(false)
      fetchDealerData()
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to create task',
        variant: 'destructive',
      })
    } finally {
      setTaskCreating(false)
    }
  }

  const onAddActivity = async () => {
    if (!note.trim() || !customer || !token) return
    try {
      setNoteSaving(true)
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: note.trim(),
          noteType: activityType.toUpperCase(),
          customerId: customer.id,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save note')
      }
      const data = await res.json()
      const newNote = data.note
      setCustomer({
        ...customer,
        activities: [
          {
            id: newNote.id,
            type: activityType,
            content: newNote.content,
            timestamp: newNote.createdAt || new Date(),
          },
          ...(customer.activities || []),
        ],
      })
      setNote('')
      if (createTaskFromNote) {
        setNewTask((prev) => ({ ...prev, title: `Follow up: ${note.trim().slice(0, 50)}${note.trim().length > 50 ? '...' : ''}`, description: note.trim() }))
        setTaskDialogOpen(true)
        setCreateTaskFromNote(false)
      }
      toast({ title: 'Success', description: 'Note saved successfully' })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save note',
        variant: 'destructive',
      })
    } finally {
      setNoteSaving(false)
    }
  }

  const handleCallClick = useCallback(async () => {
    const e164 = toE164(customer?.phone)
    if (!e164) {
      toast({
        title: 'No phone number',
        description: 'Customer needs a valid E.164 phone number to call.',
        variant: 'destructive',
      })
      return
    }
    if (!token) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' })
      return
    }
    try {
      setCallLoading(true)
      setCallStatus('calling')
      const res = await fetch('/api/twilio/token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to get call token')
      }
      const { token: twilioToken } = await res.json()
      const device = new Device(twilioToken, {
        logLevel: 0,
      })
      deviceRef.current = device
      await device.register()
      device.on('registered', () => {})
      device.on('error', (err) => {
        console.error('Device error:', err)
        setCallStatus('idle')
        setCallLoading(false)
        toast({ title: 'Call error', description: err.message, variant: 'destructive' })
      })
      const call = await device.connect({ params: { To: e164 } })
      callRef.current = call
      setCallStatus('in-call')
      setCallLoading(false)
      call.on('disconnect', () => {
        callRef.current = null
        setCallStatus('idle')
        device.unregister()
        deviceRef.current = null
      })
    } catch (err) {
      setCallStatus('idle')
      setCallLoading(false)
      toast({
        title: 'Call failed',
        description: err instanceof Error ? err.message : 'Could not initiate call',
        variant: 'destructive',
      })
    }
  }, [customer?.phone, token, toast])

  const handleHangUp = useCallback(() => {
    const call = callRef.current
    if (call) {
      call.disconnect()
      callRef.current = null
    }
    setCallStatus('idle')
    setCallLoading(false)
    const device = deviceRef.current
    if (device) {
      device.unregister()
      deviceRef.current = null
    }
  }, [])

  const handleSendSms = useCallback(async () => {
    const e164 = toE164(customer?.phone)
    if (!e164) {
      toast({
        title: 'No phone number',
        description: 'Customer needs a valid E.164 phone number to text.',
        variant: 'destructive',
      })
      return
    }
    if (!smsMessage.trim()) {
      toast({ title: 'Error', description: 'Message is required', variant: 'destructive' })
      return
    }
    if (!token) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' })
      return
    }
    try {
      setSmsSending(true)
      const res = await fetch('/api/twilio/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: e164, body: smsMessage.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send SMS')
      }
      toast({ title: 'Success', description: 'SMS sent successfully' })
      setSmsMessage('')
      setSmsModalOpen(false)
    } catch (err) {
      toast({
        title: 'SMS failed',
        description: err instanceof Error ? err.message : 'Could not send SMS',
        variant: 'destructive',
      })
    } finally {
      setSmsSending(false)
    }
  }, [customer?.phone, smsMessage, token, toast])

  const handleInvite = useCallback(async () => {
    if (!params?.id || !token) return
    setInviteLoading(true)
    try {
      const res = await fetch(`/api/customers/${params.id}/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Invite failed', description: data.error, variant: 'destructive' })
        return
      }
      setInviteResult(data)
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setInviteLoading(false)
    }
  }, [params?.id, token, toast])

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null
    return orders.find((o: any) => o._id === selectedOrderId)
  }, [selectedOrderId, orders])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!customer) {
    return <div className="space-y-4"><h2 className="text-lg font-semibold">Customer not found</h2></div>
  }

  const isAtShadesFranchisee = customer.type === 'FRANCHISEE' || dealerRole === 'FRANCHISEE'
  const showFranchiseeCard =
    isAtShadesFranchisee &&
    (('ownerName' in customer && (customer as any).ownerName) ||
      ('storeNumber' in customer && (customer as any).storeNumber) ||
      ('shippingAddress' in customer && (customer as any).shippingAddress))

  // Progress: orders completed vs total (for use in orders tab / elsewhere)
  const totalOrders = orders.length
  const completedOrders = orders.filter((o: any) => ['PACKING', 'SHIPPED_INSTALLED', 'SHIPPED', 'COMPLETED', 'DELIVERED'].includes(o.status)).length
  const progressPercent = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0

  // Pipeline stages: New → Consultation Scheduled → Quote Sent → Unqualified → Qualified
  // Green = progress along success path (steps 0,1,2,4). Step 3 (Unqualified) stays gray unless whole bar is red.
  const pipelineStages = ['New', 'Consultation Scheduled', 'Quote Sent', 'Unqualified', 'Qualified'] as const
  const hasAppointment = appointments.length > 0
  const hasQuoteSent = quotes.some((q: any) => ['SENT', 'NEGOTIATION', 'POSTPONED'].includes(q.status))
  const hasQuoteWon = quotes.some((q: any) => q.status === 'WON')
  const hasQuoteLost = quotes.some((q: any) => q.status === 'LOST')
  const hasOrders = orders.length > 0
  // Last step lit on success path: 0 New, 1 Consultation, 2 Quote Sent, 4 Qualified (Unqualified index 3 is never green)
  const lastGreenStep =
    hasQuoteWon || hasOrders ? 4 : hasQuoteSent ? 2 : hasAppointment ? 1 : 0
  const isStepGreen = (index: number) =>
    !hasQuoteLost &&
    (index === 0 || (index === 1 && lastGreenStep >= 1) || (index === 2 && lastGreenStep >= 2) || (index === 4 && lastGreenStep >= 4))

  /** Returns a due-date ISO string N calendar days from now */
  const addDays = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
  }

  /** Returns e.g. "In 3 days (Tuesday)" for follow-up label */
  const getFollowUpLabel = (days: string) => {
    const n = parseInt(days, 10)
    const d = new Date()
    d.setDate(d.getDate() + n)
    const name = d.toLocaleDateString('en-US', { weekday: 'long' })
    return `In ${n} day${n === 1 ? '' : 's'} (${name})`
  }

  /** Apply markdown-style formatting around selected text in a textarea */
  const applyFormat = (
    ref: { current: HTMLTextAreaElement | null },
    setter: (v: string) => void,
    prefix: string,
    suffix = prefix,
  ) => {
    const el = ref.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e, value } = el
    const selected = value.slice(s, e)
    const newVal = value.slice(0, s) + prefix + selected + suffix + value.slice(e)
    setter(newVal)
    requestAnimationFrame(() => {
      el.selectionStart = s + prefix.length
      el.selectionEnd = e + prefix.length
      el.focus()
    })
  }

  const handleLogCall = async () => {
    if (!callOutcome.trim() || !customer || !token) return
    try {
      setNoteSaving(true)
      const loggedAt = callDate && callTime ? new Date(`${callDate}T${callTime}`) : undefined
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content: callDescription.trim() || `Call: ${callOutcome}`,
          noteType: 'CALL',
          customerId: customer.id,
          direction: callDirection || undefined,
          outcome: callOutcome,
          loggedAt: loggedAt?.toISOString(),
        }),
      })
      if (!res.ok) throw new Error('Failed to log call')
      const data = await res.json()
      setCustomer({
        ...customer,
        activities: [
          { id: data.note?.id, type: 'call', content: data.note?.content, outcome: callOutcome, direction: callDirection, loggedAt: data.note?.loggedAt, timestamp: data.note?.timestamp },
          ...(customer.activities || []),
        ],
      })
      // Create follow-up task if requested
      if (callFollowUpTask) {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: `Follow up with ${customer.name}`,
            description: `Follow up after call: ${callOutcome}`,
            customerId: customer.id,
            dueDate: addDays(parseInt(callFollowUpDays, 10)),
            priority: 'MEDIUM',
          }),
        }).catch(() => {})
      }
      setCallOutcome('')
      setCallDirection('')
      setCallDate('')
      setCallTime('')
      setCallDescription('')
      setCallFollowUpTask(false)
      setLogCallOpen(false)
      toast({ title: 'Call logged' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to log', variant: 'destructive' })
    } finally {
      setNoteSaving(false)
    }
  }

  const handleLogEmail = async () => {
    if (!emailDescription.trim() || !customer || !token) return
    try {
      setNoteSaving(true)
      const loggedAt = emailDate && emailTime ? new Date(`${emailDate}T${emailTime}`) : undefined
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content: emailDescription.trim() || `Email: ${emailSubject}`,
          noteType: 'EMAIL',
          customerId: customer.id,
          direction: emailDirection || undefined,
          subject: emailSubject,
          loggedAt: loggedAt?.toISOString(),
        }),
      })
      if (!res.ok) throw new Error('Failed to log email')
      const data = await res.json()
      setCustomer({
        ...customer,
        activities: [
          { id: data.note?.id, type: 'email', content: data.note?.content, subject: emailSubject, direction: emailDirection, loggedAt: data.note?.loggedAt, timestamp: data.note?.timestamp },
          ...(customer.activities || []),
        ],
      })
      if (emailFollowUpTask) {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: `Follow up with ${customer.name}`,
            description: `Follow up after email: ${emailSubject}`,
            customerId: customer.id,
            dueDate: addDays(parseInt(emailFollowUpDays, 10)),
            priority: 'MEDIUM',
          }),
        }).catch(() => {})
      }
      setEmailSubject('')
      setEmailDirection('')
      setEmailDate('')
      setEmailTime('')
      setEmailDescription('')
      setEmailFollowUpTask(false)
      setLogEmailOpen(false)
      toast({ title: 'Email logged' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to log', variant: 'destructive' })
    } finally {
      setNoteSaving(false)
    }
  }

  const handleLogText = async () => {
    if (!textDescription.trim() || !customer || !token) return
    try {
      setNoteSaving(true)
      const loggedAt = textDate && textTime ? new Date(`${textDate}T${textTime}`) : undefined
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content: textDescription.trim(),
          noteType: 'TEXT',
          customerId: customer.id,
          loggedAt: loggedAt?.toISOString(),
        }),
      })
      if (!res.ok) throw new Error('Failed to log text')
      const data = await res.json()
      setCustomer({
        ...customer,
        activities: [{ id: data.note?.id, type: 'text', content: textDescription.trim(), loggedAt: data.note?.loggedAt, timestamp: data.note?.timestamp }, ...(customer.activities || [])],
      })
      if (textFollowUpTask) {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: `Follow up with ${customer.name}`,
            description: `Follow up after text with ${customer.name}`,
            customerId: customer.id,
            dueDate: addDays(parseInt(textFollowUpDays, 10)),
            priority: 'MEDIUM',
          }),
        }).catch(() => {})
      }
      setTextDescription('')
      setTextDate('')
      setTextTime('')
      setTextFollowUpTask(false)
      setLogTextOpen(false)
      toast({ title: 'Text logged' })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to log', variant: 'destructive' })
    } finally {
      setNoteSaving(false)
    }
  }

  const initials = customer.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">

      {/* ── Customer Hero Header ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-amber-50 via-stone-100 to-amber-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border-b border-amber-100 dark:border-gray-700" />
        <div className="px-5 pb-4 -mt-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="h-16 w-16 rounded-xl border-4 border-background bg-[#c8864e] flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg">
              {initials || '?'}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-[#e8e2db] leading-tight">{customer.name}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <Badge className={cn('text-xs border', {
                  'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40': customer.status === 'LEAD',
                  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40': customer.status === 'CONTACTED' || customer.status === 'QUALIFIED',
                  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40': customer.status === 'CUSTOMER',
                  'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700': customer.status === 'INACTIVE',
                })}>
                  {customer.status}
                </Badge>
                <Badge variant="outline" className="text-xs">{customer.type}</Badge>
                {customer.referredByName && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <UserPlus className="h-3 w-3" />
                    Referred by {customer.referredByName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pb-1 flex-wrap">
            {customer.phone && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={handleCallClick} disabled={callLoading || callStatus !== 'idle'}>
                <Phone className="h-3.5 w-3.5" />
                {callStatus === 'calling' ? 'Calling…' : callStatus === 'in-call' ? 'In call' : 'Call'}
              </Button>
            )}
            {customer.phone && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setSmsModalOpen(true)}>
                <MessageCircle className="h-3.5 w-3.5" /> SMS
              </Button>
            )}
            {customer.email && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setSendEmailOpen(true)}>
                <Mail className="h-3.5 w-3.5" /> Email
              </Button>
            )}
            <Button
              size="sm"
              className="gap-1.5 h-8 text-xs bg-[#c8864e] hover:bg-[#b87640] text-white"
              onClick={() => setQuoteDialogOpen(true)}
            >
              <FileText className="h-3.5 w-3.5" /> New Quote
            </Button>
          </div>
        </div>
      </div>

      {/* Pipeline progress bar (New → Consultation Scheduled → Quote Sent → Unqualified → Qualified) */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-0 overflow-x-auto pb-1">
            {pipelineStages.map((label, index) => {
              const green = isStepGreen(index)
              const red = hasQuoteLost
              const isFirst = index === 0
              const isLast = index === pipelineStages.length - 1
              const segmentBg = red
                ? 'bg-red-500 text-white'
                : green
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              const chevronColor = red ? 'border-l-red-500' : green ? 'border-l-amber-600' : 'border-l-gray-100 dark:border-l-gray-800'
              return (
                <div key={label} className="flex items-center shrink-0">
                  <div
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium',
                      segmentBg,
                      isFirst && 'rounded-l-md',
                      isLast && 'rounded-r-md',
                      !isLast && (red || green) && 'border-r border-white/20'
                    )}
                  >
                    {label}
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        'w-0 h-0 shrink-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[8px]',
                        chevronColor
                      )}
                      style={{ marginLeft: '-1px' }}
                      aria-hidden
                    />
                  )}
                </div>
              )
            })}
          </div>
          {totalOrders > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Orders: {completedOrders} / {totalOrders} completed
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 min-w-0 lg:grid-cols-[300px_1fr]">
        {/* ── Left panel ── */}
        <div className="space-y-3 min-w-0">

          {/* Contact card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Info</span>
              <div className="flex gap-2">
                <InlineEditableSelect
                  value={customer.status}
                  options={[
                    { value: 'LEAD', label: 'Lead' },
                    { value: 'CONTACTED', label: 'Contacted' },
                    { value: 'QUALIFIED', label: 'Qualified' },
                    { value: 'CUSTOMER', label: 'Customer' },
                    { value: 'INACTIVE', label: 'Inactive' },
                  ]}
                  onSave={(v) => saveCustomerField('status', v)}
                  displayClassName={cn('text-xs rounded-full px-2.5 py-0.5 font-medium border', {
                    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800/40': customer.status === 'LEAD',
                    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40': customer.status === 'CONTACTED' || customer.status === 'QUALIFIED',
                    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40': customer.status === 'CUSTOMER',
                    'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700': customer.status === 'INACTIVE',
                  })}
                  disabled={!isCrmCustomer}
                  inline
                />
              </div>
            </div>
            <div className="divide-y divide-border">
              {/* Phone */}
              <div className="flex items-center gap-3 px-4 py-3 group">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                  <InlineEditableField
                    value={customer.phone || ''}
                    placeholder="Add phone"
                    onSave={(v) => saveCustomerField('phone', v)}
                    className="text-sm font-medium"
                    disabled={!isCrmCustomer}
                    maxLength={PHONE_MAX_LENGTH}
                    sanitize={sanitizePhoneInput}
                  />
                </div>
                {customer.phone && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => { navigator.clipboard.writeText(customer.phone!); toast({ title: 'Copied!' }) }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {/* Email */}
              <div className="flex items-center gap-3 px-4 py-3 group">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <InlineEditableField
                    value={customer.email || ''}
                    placeholder="Add email"
                    onSave={(v) => saveCustomerField('email', v)}
                    className="text-sm font-medium break-all"
                    disabled={!isCrmCustomer}
                  />
                </div>
                {customer.email && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => { navigator.clipboard.writeText(customer.email!); toast({ title: 'Copied!' }) }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {/* Address */}
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                  <InlineEditableField
                    value={[customer.address || customer.street, (customer as any).town, (customer as any).city, (customer as any).postcode, (customer as any).country].filter(Boolean).join(', ') || ''}
                    placeholder="Add address"
                    onSave={(v) => saveCustomerField('address', v)}
                    className="text-sm text-muted-foreground leading-relaxed"
                    multiline
                    disabled={!isCrmCustomer}
                  />
                  {(() => {
                    const custAddr = [customer.address || customer.street, (customer as any).town, (customer as any).city, (customer as any).postcode, (customer as any).country].filter(Boolean).join(', ')
                    return custAddr && custAddr.length >= 10 ? <CustomerCommute destinationAddress={custAddr} /> : null
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Details card */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</span>
            </div>
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-muted-foreground">Type</span>
                <InlineEditableSelect
                  value={customer.type}
                  options={[
                    { value: 'RESIDENTIAL', label: 'Residential' },
                    { value: 'COMMERCIAL', label: 'Commercial' },
                    { value: 'FRANCHISEE', label: 'Franchisee' },
                    { value: 'PARTNER', label: 'Partner' },
                  ]}
                  onSave={(v) => saveCustomerField('type', v)}
                  displayClassName="text-xs font-medium text-right"
                  disabled={!isCrmCustomer}
                  inline
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-muted-foreground">Side Mark</span>
                <InlineEditableField
                  value={customer.sideMark || ''}
                  placeholder="—"
                  onSave={(v) => saveCustomerField('sideMark', v)}
                  className="text-xs font-mono font-semibold text-right"
                  disabled={!isCrmCustomer}
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-muted-foreground">Created</span>
                <span className="text-xs font-medium">{customer.createdAt}</span>
              </div>
              {customer.leadSource && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-muted-foreground">Lead Source</span>
                  <span className="text-xs font-medium text-right">{customer.leadSource.replace(/_/g, ' ')}</span>
                </div>
              )}
              {customer.referredByName && (
                <div className="px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-2">Referred By</p>
                  <div className="flex items-center gap-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 px-3 py-2">
                    <div className="h-7 w-7 rounded-full bg-amber-200 dark:bg-amber-800/40 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300 font-bold text-xs">
                      {customer.referredByName.charAt(0).toUpperCase()}
                    </div>
                    {customer.referredById ? (
                      <Link
                        href={`/customers/${customer.referredById}`}
                        className="text-sm font-semibold text-amber-700 dark:text-amber-400 hover:underline leading-tight"
                      >
                        {customer.referredByName}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 leading-tight">
                        {customer.referredByName}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Franchisee extras */}
          {showFranchiseeCard && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Franchisee</span>
              </div>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-muted-foreground">Owner</span>
                  <InlineEditableField
                    value={(customer as any).ownerName || ''}
                    placeholder="Add owner"
                    onSave={(v) => saveCustomerField('ownerName', v)}
                    className="text-xs font-medium text-right"
                    disabled={!isCrmCustomer}
                  />
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-muted-foreground">Store #</span>
                  <InlineEditableField
                    value={(customer as any).storeNumber || ''}
                    placeholder="Add store number"
                    onSave={(v) => saveCustomerField('storeNumber', v)}
                    className="text-xs font-mono font-semibold text-right"
                    disabled={!isCrmCustomer}
                  />
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1.5">Shipping Address</p>
                  <InlineEditableField
                    value={(customer as any).shippingAddress || ''}
                    placeholder="Add shipping address"
                    onSave={(v) => saveCustomerField('shippingAddress', v)}
                    className="text-xs text-muted-foreground leading-relaxed"
                    multiline
                    disabled={!isCrmCustomer}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel — tabs ── */}
        <div className="min-w-0">
          <Tabs defaultValue="activity" className="space-y-4">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex gap-0.5 flex-nowrap h-9 bg-muted/60 dark:bg-[#1a1a1a] p-1 rounded-lg w-max border border-border">
                {isAtShadesFranchisee ? (
                  <>
                    <TabsTrigger value="activity" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Activity</TabsTrigger>
                    <TabsTrigger value="orders" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Orders</TabsTrigger>
                    <TabsTrigger value="payments" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Payments</TabsTrigger>
                    <TabsTrigger value="shipments" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Shipments</TabsTrigger>
                    <TabsTrigger value="production" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Production</TabsTrigger>
                    <TabsTrigger value="tickets" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Tickets</TabsTrigger>
                    <TabsTrigger value="extras" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Extras</TabsTrigger>
                  </>
                ) : (
                  <>
                    <TabsTrigger value="activity" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Activity</TabsTrigger>
                    <TabsTrigger value="quotes" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Quotes</TabsTrigger>
                    <TabsTrigger value="referrals" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm" onClick={() => { if (!customerReferrals && !customerReferralsLoading) fetchCustomerReferrals() }}>
                      Referrals {customerReferrals && customerReferrals.length > 0 && <span className="ml-1 h-4 w-4 rounded-full bg-emerald-500 text-white text-[10px] inline-flex items-center justify-center font-bold">{customerReferrals.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="order" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Order</TabsTrigger>
                    <TabsTrigger value="emails" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Emails</TabsTrigger>
                    <TabsTrigger value="tasks" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Tasks</TabsTrigger>
                    <TabsTrigger value="appointments" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Appointments</TabsTrigger>
                    <TabsTrigger value="contacts" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      Contacts {contacts.length > 0 && <span className="ml-1 h-4 w-4 rounded-full bg-blue-500 text-white text-[10px] inline-flex items-center justify-center font-bold">{contacts.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="files" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm">Files</TabsTrigger>
                    <TabsTrigger value="portal" className="text-xs whitespace-nowrap rounded-md px-3 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm" onClick={() => { if (!portalStatus && !portalStatusLoading) fetchPortalStatus() }}>
                      Portal {portalClaims.length > 0 && <span className="ml-1 h-4 w-4 rounded-full bg-amber-500 text-white text-[10px] inline-flex items-center justify-center font-bold">{portalClaims.length}</span>}
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>

            {/* Activity */}
            <TabsContent value="activity" className="space-y-4">
              {/* Compose card */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Action bar */}
                <div className="flex items-center gap-1 px-3 pt-3 pb-2 border-b border-border flex-wrap">
                  <button
                    onClick={() => setActivityType('note')}
                    className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      activityType === 'note'
                        ? 'bg-[#c8864e]/10 text-[#c8864e] dark:bg-[#c8864e]/15'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <StickyNote className="h-3.5 w-3.5" /> Note
                  </button>
                  <button
                    onClick={() => { const now = new Date(); setCallDate(now.toISOString().split('T')[0]); setCallTime(now.toTimeString().slice(0, 5)); setLogCallOpen(true) }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <PhoneCall className="h-3.5 w-3.5" /> Log Call
                  </button>
                  <button
                    onClick={() => { const now = new Date(); setTextDate(now.toISOString().split('T')[0]); setTextTime(now.toTimeString().slice(0, 5)); setLogTextOpen(true) }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Log Text
                  </button>
                  <button
                    onClick={() => { const now = new Date(); setEmailDate(now.toISOString().split('T')[0]); setEmailTime(now.toTimeString().slice(0, 5)); setLogEmailOpen(true) }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" /> Log Email
                  </button>
                  <div className="mx-1 h-4 w-px bg-border" />
                  <button
                    onClick={() => setTaskDialogOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Notebook className="h-3.5 w-3.5" /> Task
                  </button>
                  <div className="mx-1 h-4 w-px bg-border" />
                  {/* Live actions */}
                  <button
                    onClick={handleCallClick}
                    disabled={!customer?.phone || callLoading || callStatus !== 'idle'}
                    className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      callStatus === 'in-call'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed'
                    )}
                  >
                    {callStatus === 'calling' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Phone className="h-3.5 w-3.5" />}
                    {callStatus === 'calling' ? 'Calling…' : callStatus === 'in-call' ? 'In Call' : 'Call'}
                  </button>
                  {callStatus === 'in-call' && (
                    <button onClick={handleHangUp} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors">
                      Hang Up
                    </button>
                  )}
                  <button
                    onClick={() => setSmsModalOpen(true)}
                    disabled={!customer?.phone}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> SMS
                  </button>
                  <button
                    onClick={() => setSendEmailOpen(true)}
                    disabled={!customer?.email}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Mail className="h-3.5 w-3.5" /> Send Email
                  </button>
                  <button
                    onClick={() => { setInviteResult(null); setInviteOpen(true) }}
                    disabled={!customer?.email}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#c8864e] hover:bg-[#c8864e]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Invite to Portal
                  </button>
                </div>
                {/* Note composer */}
                <div className="p-3 space-y-3">
                  <Textarea
                    placeholder="Write a note about this customer…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="min-h-[80px] resize-none border-0 bg-transparent focus-visible:ring-0 px-0 text-sm placeholder:text-muted-foreground/60"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                      <Checkbox
                        id="create-task-from-note"
                        checked={createTaskFromNote}
                        onCheckedChange={(c) => setCreateTaskFromNote(!!c)}
                        className="h-3.5 w-3.5"
                      />
                      Create follow-up task
                    </label>
                    <Button
                      size="sm"
                      onClick={onAddActivity}
                      disabled={noteSaving || !note.trim()}
                      className="h-8 px-4 bg-[#c8864e] hover:bg-[#b87640] text-white"
                    >
                      {noteSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Note'}
                    </Button>
                  </div>
                </div>
              </div>
                  <SendEmailModal
                    open={sendEmailOpen}
                    onOpenChange={setSendEmailOpen}
                    to={customer?.email || ''}
                    customerName={customer?.name}
                  />
                  {/* ── HubSpot-style Log Call dialog ── */}
                  <Dialog open={logCallOpen} onOpenChange={setLogCallOpen}>
                    <DialogContent className="max-w-lg p-0 overflow-hidden">
                      {/* Dark header */}
                      <div className="bg-slate-800 dark:bg-slate-900 px-5 py-3">
                        <DialogTitle className="text-white text-base font-semibold">Log Call</DialogTitle>
                      </div>
                      <div className="p-5 space-y-4">
                        {/* Row 1: Contacted / Outcome / Direction */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Contacted</Label>
                            <div className="h-9 px-3 flex items-center rounded-md border bg-muted/40 text-sm font-medium truncate text-blue-600 dark:text-blue-400">
                              {customer?.name ?? '—'}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Call outcome</Label>
                            <Select value={callOutcome} onValueChange={setCallOutcome}>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Select an outcome" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Connected, consultation booked">Connected, booked</SelectItem>
                                <SelectItem value="Connected, not interested">Not interested</SelectItem>
                                <SelectItem value="Left voicemail">Left voicemail</SelectItem>
                                <SelectItem value="No answer">No answer</SelectItem>
                                <SelectItem value="Wrong Number">Wrong number</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Direction</Label>
                            <Select value={callDirection} onValueChange={(v) => setCallDirection(v as 'INBOUND' | 'OUTBOUND')}>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Select direction" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="INBOUND">Inbound</SelectItem>
                                <SelectItem value="OUTBOUND">Outbound</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {/* Row 2: Date / Time */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Date</Label>
                            <Input type="date" className="h-9 text-sm" value={callDate} onChange={(e) => setCallDate(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Time</Label>
                            <Input type="time" className="h-9 text-sm" value={callTime} onChange={(e) => setCallTime(e.target.value)} />
                          </div>
                        </div>
                        {/* Rich text toolbar + Description */}
                        <div>
                          <div className="flex items-center gap-0.5 border border-b-0 rounded-t-md px-2 py-1 bg-muted/30">
                            <button type="button" title="Bold" onClick={() => applyFormat(callDescRef, setCallDescription, '**')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Bold className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Italic" onClick={() => applyFormat(callDescRef, setCallDescription, '*')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Italic className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Underline" onClick={() => applyFormat(callDescRef, setCallDescription, '<u>', '</u>')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Underline className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Clear formatting" className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-[10px] font-semibold line-through text-muted-foreground">
                              Tx
                            </button>
                            <div className="w-px h-4 bg-border mx-1" />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="flex items-center gap-0.5 px-1.5 h-7 rounded hover:bg-muted text-xs text-muted-foreground">
                                  More <ChevronDown className="h-3 w-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => applyFormat(callDescRef, setCallDescription, '~~')}>Strikethrough</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => applyFormat(callDescRef, setCallDescription, '`')}>Inline code</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => applyFormat(callDescRef, setCallDescription, '\n> ', '')}>Block quote</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="w-px h-4 bg-border mx-1" />
                            <button type="button" title="Insert link" onClick={() => applyFormat(callDescRef, setCallDescription, '[', '](url)')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Link2 className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Insert image" onClick={() => applyFormat(callDescRef, setCallDescription, '![alt](', ')')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <ImageIcon className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Knowledge base" className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <GraduationCap className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Insert table" onClick={() => applyFormat(callDescRef, setCallDescription, '\n| Col1 | Col2 |\n|------|------|\n| ', ' |     |\n')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Attach file" className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Paperclip className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Textarea
                            ref={callDescRef}
                            placeholder="Describe the call…"
                            rows={4}
                            value={callDescription}
                            onChange={(e) => setCallDescription(e.target.value)}
                            className="resize-none text-sm rounded-t-none"
                          />
                        </div>
                      </div>
                      {/* Footer */}
                      <div className="border-t px-5 py-3 flex items-center justify-between gap-3 bg-muted/30">
                        <Button
                          size="sm"
                          onClick={handleLogCall}
                          disabled={!callOutcome || noteSaving}
                        >
                          {noteSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Log activity
                        </Button>
                        <div className="flex items-center gap-2 text-sm">
                          <Checkbox
                            id="call-followup"
                            checked={callFollowUpTask}
                            onCheckedChange={(c) => setCallFollowUpTask(!!c)}
                          />
                          <label htmlFor="call-followup" className="cursor-pointer select-none text-muted-foreground text-xs">
                            Create a task to follow up
                          </label>
                          {callFollowUpTask && (
                            <Select value={callFollowUpDays} onValueChange={setCallFollowUpDays}>
                              <SelectTrigger className="h-7 w-auto text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                <SelectValue>{getFollowUpLabel(callFollowUpDays)}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">In 1 day</SelectItem>
                                <SelectItem value="2">In 2 days</SelectItem>
                                <SelectItem value="3">In 3 days</SelectItem>
                                <SelectItem value="5">In 5 days</SelectItem>
                                <SelectItem value="7">In 1 week</SelectItem>
                                <SelectItem value="14">In 2 weeks</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={logTextOpen} onOpenChange={setLogTextOpen}>
                    <DialogContent className="max-w-lg p-0 overflow-hidden">
                      <div className="bg-slate-800 dark:bg-slate-900 px-5 py-3">
                        <DialogTitle className="text-white text-base font-semibold">Log Text</DialogTitle>
                      </div>
                      <div className="p-5 space-y-4">
                        {/* Contacted */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Contacted</Label>
                          <div className="h-9 px-3 flex items-center rounded-md border bg-muted/40 text-sm font-medium truncate text-blue-600 dark:text-blue-400">
                            {customer?.name ?? '—'}
                          </div>
                        </div>
                        {/* Date / Time */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Date</Label>
                            <Input type="date" className="h-9 text-sm" value={textDate} onChange={(e) => setTextDate(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Time</Label>
                            <Input type="time" className="h-9 text-sm" value={textTime} onChange={(e) => setTextTime(e.target.value)} />
                          </div>
                        </div>
                        {/* Rich text toolbar + Description */}
                        <div>
                          <div className="flex items-center gap-0.5 border border-b-0 rounded-t-md px-2 py-1 bg-muted/30">
                            <button type="button" title="Bold" onClick={() => applyFormat(textDescRef, setTextDescription, '**')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Bold className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Italic" onClick={() => applyFormat(textDescRef, setTextDescription, '*')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Italic className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Underline" onClick={() => applyFormat(textDescRef, setTextDescription, '<u>', '</u>')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Underline className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Clear formatting" className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-[10px] font-semibold line-through text-muted-foreground">
                              Tx
                            </button>
                            <div className="w-px h-4 bg-border mx-1" />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="flex items-center gap-0.5 px-1.5 h-7 rounded hover:bg-muted text-xs text-muted-foreground">
                                  More <ChevronDown className="h-3 w-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => applyFormat(textDescRef, setTextDescription, '~~')}>Strikethrough</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => applyFormat(textDescRef, setTextDescription, '`')}>Inline code</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => applyFormat(textDescRef, setTextDescription, '\n> ', '')}>Block quote</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="w-px h-4 bg-border mx-1" />
                            <button type="button" title="Insert link" onClick={() => applyFormat(textDescRef, setTextDescription, '[', '](url)')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Link2 className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Insert image" onClick={() => applyFormat(textDescRef, setTextDescription, '![alt](', ')')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <ImageIcon className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Knowledge base" className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <GraduationCap className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Insert table" onClick={() => applyFormat(textDescRef, setTextDescription, '\n| Col1 | Col2 |\n|------|------|\n| ', ' |     |\n')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Attach file" className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Paperclip className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Textarea
                            ref={textDescRef}
                            placeholder="Describe the text message…"
                            rows={4}
                            value={textDescription}
                            onChange={(e) => setTextDescription(e.target.value)}
                            className="resize-none text-sm rounded-t-none"
                          />
                        </div>
                      </div>
                      {/* Footer */}
                      <div className="border-t px-5 py-3 flex items-center justify-between gap-3 bg-muted/30">
                        <Button
                          size="sm"
                          onClick={handleLogText}
                          disabled={!textDescription.trim() || noteSaving}
                        >
                          {noteSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Log activity
                        </Button>
                        <div className="flex items-center gap-2 text-sm">
                          <Checkbox
                            id="text-followup"
                            checked={textFollowUpTask}
                            onCheckedChange={(c) => setTextFollowUpTask(!!c)}
                          />
                          <label htmlFor="text-followup" className="cursor-pointer select-none text-muted-foreground text-xs">
                            Create a task to follow up
                          </label>
                          {textFollowUpTask && (
                            <Select value={textFollowUpDays} onValueChange={setTextFollowUpDays}>
                              <SelectTrigger className="h-7 w-auto text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                <SelectValue>{getFollowUpLabel(textFollowUpDays)}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">In 1 day</SelectItem>
                                <SelectItem value="2">In 2 days</SelectItem>
                                <SelectItem value="3">In 3 days</SelectItem>
                                <SelectItem value="5">In 5 days</SelectItem>
                                <SelectItem value="7">In 1 week</SelectItem>
                                <SelectItem value="14">In 2 weeks</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {/* ── HubSpot-style Log Email dialog ── */}
                  <Dialog open={logEmailOpen} onOpenChange={setLogEmailOpen}>
                    <DialogContent className="max-w-lg p-0 overflow-hidden">
                      <div className="bg-slate-800 dark:bg-slate-900 px-5 py-3">
                        <DialogTitle className="text-white text-base font-semibold">Log Email</DialogTitle>
                      </div>
                      <div className="p-5 space-y-4">
                        {/* Contacted */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Contacted</Label>
                          <div className="h-9 px-3 flex items-center rounded-md border bg-muted/40 text-sm font-medium truncate text-blue-600 dark:text-blue-400">
                            {customer?.name ?? '—'}
                          </div>
                        </div>
                        {/* Date / Time */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Date</Label>
                            <Input type="date" className="h-9 text-sm" value={emailDate} onChange={(e) => setEmailDate(e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Time</Label>
                            <Input type="time" className="h-9 text-sm" value={emailTime} onChange={(e) => setEmailTime(e.target.value)} />
                          </div>
                        </div>
                        {/* Rich text toolbar + Description */}
                        <div>
                          <div className="flex items-center gap-0.5 border border-b-0 rounded-t-md px-2 py-1 bg-muted/30">
                            <button type="button" title="Bold" onClick={() => applyFormat(emailDescRef, setEmailDescription, '**')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Bold className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Italic" onClick={() => applyFormat(emailDescRef, setEmailDescription, '*')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Italic className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Underline" onClick={() => applyFormat(emailDescRef, setEmailDescription, '<u>', '</u>')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Underline className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Clear formatting" className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted text-[10px] font-semibold line-through text-muted-foreground">
                              Tx
                            </button>
                            <div className="w-px h-4 bg-border mx-1" />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="flex items-center gap-0.5 px-1.5 h-7 rounded hover:bg-muted text-xs text-muted-foreground">
                                  More <ChevronDown className="h-3 w-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => applyFormat(emailDescRef, setEmailDescription, '~~')}>Strikethrough</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => applyFormat(emailDescRef, setEmailDescription, '`')}>Inline code</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => applyFormat(emailDescRef, setEmailDescription, '\n> ', '')}>Block quote</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="w-px h-4 bg-border mx-1" />
                            <button type="button" title="Insert link" onClick={() => applyFormat(emailDescRef, setEmailDescription, '[', '](url)')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Link2 className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Insert image" onClick={() => applyFormat(emailDescRef, setEmailDescription, '![alt](', ')')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <ImageIcon className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Knowledge base" className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <GraduationCap className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Insert table" onClick={() => applyFormat(emailDescRef, setEmailDescription, '\n| Col1 | Col2 |\n|------|------|\n| ', ' |     |\n')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <LayoutGrid className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" title="Attach file" className="w-7 h-7 flex items-center justify-center rounded hover:bg-muted">
                              <Paperclip className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <Textarea
                            ref={emailDescRef}
                            placeholder="Describe the email…"
                            rows={4}
                            value={emailDescription}
                            onChange={(e) => setEmailDescription(e.target.value)}
                            className="resize-none text-sm rounded-t-none"
                          />
                        </div>
                      </div>
                      {/* Footer */}
                      <div className="border-t px-5 py-3 flex items-center justify-between gap-3 bg-muted/30">
                        <Button
                          size="sm"
                          onClick={handleLogEmail}
                          disabled={!emailDescription.trim() || noteSaving}
                        >
                          {noteSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Log activity
                        </Button>
                        <div className="flex items-center gap-2 text-sm">
                          <Checkbox
                            id="email-followup"
                            checked={emailFollowUpTask}
                            onCheckedChange={(c) => setEmailFollowUpTask(!!c)}
                          />
                          <label htmlFor="email-followup" className="cursor-pointer select-none text-muted-foreground text-xs">
                            Create a task to follow up
                          </label>
                          {emailFollowUpTask && (
                            <Select value={emailFollowUpDays} onValueChange={setEmailFollowUpDays}>
                              <SelectTrigger className="h-7 w-auto text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                <SelectValue>{getFollowUpLabel(emailFollowUpDays)}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">In 1 day</SelectItem>
                                <SelectItem value="2">In 2 days</SelectItem>
                                <SelectItem value="3">In 3 days</SelectItem>
                                <SelectItem value="5">In 5 days</SelectItem>
                                <SelectItem value="7">In 1 week</SelectItem>
                                <SelectItem value="14">In 2 weeks</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send SMS to {customer?.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Message</Label>
                          <Textarea
                            value={smsMessage}
                            onChange={(e) => setSmsMessage(e.target.value)}
                            placeholder="Type your message..."
                            rows={4}
                            maxLength={1600}
                          />
                          <p className="text-xs text-muted-foreground mt-1">{smsMessage.length}/1600</p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSmsModalOpen(false)} disabled={smsSending}>
                          Cancel
                        </Button>
                        <Button onClick={handleSendSms} disabled={smsSending || !smsMessage.trim()}>
                          {smsSending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            'Send SMS'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Task Title</Label>
                          <Input
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            placeholder="Enter task title"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Priority</Label>
                            <Select
                              value={newTask.priority}
                              onValueChange={(v: any) => setNewTask({ ...newTask, priority: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Assign To</Label>
                            <Select
                              value={newTask.assignedTo}
                              onValueChange={(v) => setNewTask({ ...newTask, assignedTo: v })}
                              disabled={assignableUsersLoading || assignableUsers.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    assignableUsersLoading
                                      ? 'Loading...'
                                      : assignableUsers.length === 0
                                        ? 'Unassigned'
                                        : 'Select user'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {assignableUsers.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>Due Date</Label>
                          <Input
                            type="date"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setTaskDialogOpen(false)} disabled={taskCreating}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateTask} disabled={taskCreating}>
                          {taskCreating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create Task'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
              {/* Timeline feed */}
              <div className="space-y-1">
                {(!customer.activities || customer.activities.length === 0) ? (
                  <div className="rounded-xl border border-dashed border-border py-12 text-center">
                    <StickyNote className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Notes, calls, and portal events will appear here</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" />
                    <div className="space-y-1">
                      {(customer.activities || []).map((a: any) => {
                        const typeConfig: Record<string, { icon: React.ReactNode; dot: string; label: string }> = {
                          call: { icon: <PhoneCall className="h-3.5 w-3.5" />, dot: 'bg-green-500', label: 'Call' },
                          email: { icon: <Mail className="h-3.5 w-3.5" />, dot: 'bg-orange-500', label: 'Email' },
                          text: { icon: <MessageCircle className="h-3.5 w-3.5" />, dot: 'bg-purple-500', label: 'Text' },
                          note: { icon: <StickyNote className="h-3.5 w-3.5" />, dot: 'bg-sky-500', label: 'Note' },
                        }
                        const cfg = typeConfig[a.type] || typeConfig.note
                        const dirLabel = a.direction === 'INBOUND' ? '↙ In' : a.direction === 'OUTBOUND' ? '↗ Out' : null
                        const ts = a.timestamp ? new Date(a.timestamp) : null
                        return (
                          <div key={a.id} className="flex gap-3 group">
                            <div className="relative flex-shrink-0 pt-3">
                              <div className={`h-[38px] w-[38px] rounded-full border-2 border-background flex items-center justify-center text-white ${cfg.dot}`}>
                                {cfg.icon}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-2 pb-1">
                              <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-1 group-hover:border-border/80 transition-colors">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-semibold text-foreground">{cfg.label}</span>
                                    {dirLabel && <span className="text-xs text-muted-foreground">{dirLabel}</span>}
                                    {a.outcome && <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{a.outcome}</span>}
                                    {a.subject && <span className="text-xs font-medium">{a.subject}</span>}
                                  </div>
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    {ts ? ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                  </span>
                                </div>
                                {a.content && a.content !== `Call: ${a.outcome}` && a.content !== `Email: ${a.subject}` && (
                                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Shadeotech: Quotes */}
            {!isAtShadesFranchisee && (
            <TabsContent value="quotes">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-sm">Quotes</CardTitle>
                  <Button size="sm" onClick={() => setQuoteDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Quote
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quote #</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quotes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                              No quotes found
                            </TableCell>
                          </TableRow>
                        ) : (
                          quotes.map((q: any) => (
                            <TableRow key={q.id || q._id}>
                              <TableCell>{q.quoteNumber || q.id}</TableCell>
                              <TableCell>{q.name || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {q.status || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell className="text-right">
                                ${q.totalAmount ? q.totalAmount.toLocaleString() : '0'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {/* Orders - Shadeotech uses "order" tab with sub-sections; At Shades uses "orders" */}
            <TabsContent value="orders">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-sm">Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Customer Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total Shades</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                              No orders found
                            </TableCell>
                          </TableRow>
                        ) : (
                          orders.map((o: any) => (
                            <TableRow 
                              key={o._id} 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setSelectedOrderId(o._id)}
                            >
                              <TableCell>
                                <Link href={`/production/pending-approval/${o._id}`} className="text-blue-600 hover:underline">
                                  {o.orderNumber}
                                </Link>
                              </TableCell>
                              <TableCell>{o.customerName || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                  {o.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell className="text-right">{o.totalShades || 0}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Referrals */}
            {!isAtShadesFranchisee && (
            <TabsContent value="referrals">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-500" />
                    Referrals
                    {customerReferrals && customerReferrals.length > 0 && (
                      <Badge variant="outline" className="ml-1 text-xs">{customerReferrals.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customerReferralsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : !customerReferrals ? (
                    <div className="text-center py-8">
                      <Button size="sm" onClick={fetchCustomerReferrals}>Load Referrals</Button>
                    </div>
                  ) : customerReferrals.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No referrals yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Customers referred by this customer will appear here</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs text-muted-foreground">
                            <th className="text-left font-medium py-2 pr-4">Name</th>
                            <th className="text-left font-medium py-2 pr-4">Email</th>
                            <th className="text-left font-medium py-2 pr-4">Phone</th>
                            <th className="text-left font-medium py-2 pr-4">Side Mark</th>
                            <th className="text-left font-medium py-2 pr-4">Status</th>
                            <th className="text-left font-medium py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {customerReferrals.map((r: any) => (
                            <tr key={r.id} className="hover:bg-muted/40">
                              <td className="py-3 pr-4">
                                <Link href={`/customers/${r.id}`} className="font-medium text-blue-600 hover:underline">{r.name}</Link>
                              </td>
                              <td className="py-3 pr-4 text-muted-foreground">{r.email || '—'}</td>
                              <td className="py-3 pr-4 text-muted-foreground">{r.phone || '—'}</td>
                              <td className="py-3 pr-4 text-muted-foreground">{r.sideMark || '—'}</td>
                              <td className="py-3 pr-4">
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                  {r.status}
                                </span>
                              </td>
                              <td className="py-3 text-muted-foreground text-xs">
                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {/* Shadeotech: Order (combined tab with sub-sections) */}
            {!isAtShadesFranchisee && (
            <TabsContent value="order" className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">Orders</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Shades</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No orders found</TableCell></TableRow>
                        ) : (
                          orders.map((o: any) => (
                            <TableRow
                              key={o._id}
                              className={cn('cursor-pointer hover:bg-muted/50', selectedOrderId === o._id && 'bg-muted/50')}
                              onClick={() => setSelectedOrderId(o._id)}
                            >
                              <TableCell><Link href={`/production/pending-approval/${o._id}`} className="text-blue-600 hover:underline">{o.orderNumber}</Link></TableCell>
                              <TableCell>{o.customerName || 'N/A'}</TableCell>
                              <TableCell><Badge variant="outline">{o.status}</Badge></TableCell>
                              <TableCell>{o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'N/A'}</TableCell>
                              <TableCell className="text-right">{o.totalShades || 0}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              <Tabs defaultValue="order-details" className="space-y-4">
                <TabsList className="flex flex-wrap h-auto gap-1">
                  <TabsTrigger value="order-details" className="text-xs">Order Details</TabsTrigger>
                  <TabsTrigger value="production-details" className="text-xs">Production Details</TabsTrigger>
                  <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
                  <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
                  <TabsTrigger value="delivery-note" className="text-xs">Delivery Note</TabsTrigger>
                  <TabsTrigger value="contracts-order" className="text-xs">Contracts</TabsTrigger>
                </TabsList>
                <TabsContent value="order-details">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Order details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedOrder ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Order Number</p>
                          <p className="font-medium">{selectedOrder.orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Customer Name</p>
                          <p className="font-medium">{selectedOrder.customerName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <Badge variant="outline">{selectedOrder.status}</Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Order Date</p>
                          <p className="font-medium">
                            {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        {selectedOrder.installationDate && (
                          <div>
                            <p className="text-muted-foreground">Installation Date</p>
                            <p className="font-medium">
                              {new Date(selectedOrder.installationDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {selectedOrder.sideMark && (
                          <div>
                            <p className="text-muted-foreground">Side Mark</p>
                            <p className="font-medium">{selectedOrder.sideMark}</p>
                          </div>
                        )}
                      </div>
                      {selectedOrder.items && selectedOrder.items.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Order Items</p>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Line</TableHead>
                                  <TableHead>Product</TableHead>
                                  <TableHead>Fabric</TableHead>
                                  <TableHead>Width</TableHead>
                                  <TableHead>Length</TableHead>
                                  <TableHead>Qty</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedOrder.items.map((item: any, idx: number) => (
                                  <TableRow key={idx}>
                                    <TableCell>{item.lineNumber || idx + 1}</TableCell>
                                    <TableCell>{item.product || 'N/A'}</TableCell>
                                    <TableCell>{item.fabric || 'N/A'}</TableCell>
                                    <TableCell>{item.width || 'N/A'}</TableCell>
                                    <TableCell>{item.length || 'N/A'}</TableCell>
                                    <TableCell>{item.qty || 1}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                      {selectedOrder.notes && (
                        <div>
                          <p className="text-sm font-medium mb-2">Notes</p>
                          <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select an order from the Orders tab to view details.
                    </p>
                  )}
                </CardContent>
              </Card>
                </TabsContent>
                <TabsContent value="production-details">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Production</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Production sheets, labels, and internal notes for this customer’s orders.</p>
                </CardContent>
              </Card>
                </TabsContent>
                <TabsContent value="invoices">
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-sm">Invoices</CardTitle>
                  <Button size="sm" onClick={() => setCreateInvoiceModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                              No invoices found
                            </TableCell>
                          </TableRow>
                        ) : (
                          invoices.map((inv: any) => (
                            <TableRow key={inv.id || inv._id}>
                              <TableCell>{inv.invoiceNumber || inv.number || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  {inv.status || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell className="text-right">
                                ${inv.totalAmount ? inv.totalAmount.toLocaleString() : '0'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
                </TabsContent>
                <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ref</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                              No payments found
                            </TableCell>
                          </TableRow>
                        ) : (
                          payments.map((p: any) => (
                            <TableRow key={p.id || p._id}>
                              <TableCell>{p.ref || p.reference || 'N/A'}</TableCell>
                              <TableCell>{p.method || p.paymentMethod || 'N/A'}</TableCell>
                              <TableCell>
                                {p.date ? (typeof p.date === 'string' ? p.date : new Date(p.date).toLocaleDateString()) : 'N/A'}
                              </TableCell>
                              <TableCell className="text-right">
                                ${p.amount ? p.amount.toLocaleString() : '0'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
                </TabsContent>
                <TabsContent value="delivery-note">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Delivery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Delivery notes, addresses, and delivery status for recent orders.</p>
                </CardContent>
              </Card>
                </TabsContent>
                <TabsContent value="contracts-order">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    Contracts
                    {customerContracts.length > 0 && (
                      <Badge variant="outline" className="ml-1 text-xs">{customerContracts.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customerContracts.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No contracts yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Contracts will appear here once created from a quote</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs text-muted-foreground">
                            <th className="text-left font-medium py-2 pr-4">Contract #</th>
                            <th className="text-left font-medium py-2 pr-4">Type</th>
                            <th className="text-left font-medium py-2 pr-4">Status</th>
                            <th className="text-left font-medium py-2 pr-4">Created</th>
                            <th className="text-left font-medium py-2">Signed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {customerContracts.map((c: any) => {
                            const isSigned = c.status === 'signed' || c.statusLegacy === 'signed'
                            return (
                              <tr key={c.id || c._id} className="hover:bg-muted/40">
                                <td className="py-3 pr-4">
                                  <Link href={`/contracts/${c.id || c._id}`} className="font-medium text-purple-600 hover:underline">
                                    {c.contractNumber || '—'}
                                  </Link>
                                </td>
                                <td className="py-3 pr-4 text-muted-foreground capitalize">{c.contractType || '—'}</td>
                                <td className="py-3 pr-4">
                                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border-0', isSigned ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400')}>
                                    {isSigned ? 'Signed' : 'Pending signature'}
                                  </span>
                                </td>
                                <td className="py-3 pr-4 text-muted-foreground">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                                <td className="py-3 text-muted-foreground">{c.signedAt ? new Date(c.signedAt).toLocaleDateString() : '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
            )}

            {/* Emails - Shadeotech only */}
            {!isAtShadesFranchisee && (
            <TabsContent value="emails">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Emails</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Direction</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockEmails.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell>{e.direction}</TableCell>
                            <TableCell>{e.subject}</TableCell>
                            <TableCell>{e.date}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {/* Tasks - Shadeotech only */}
            {!isAtShadesFranchisee && (
            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead>Due</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                              No tasks for this customer.
                            </TableCell>
                          </TableRow>
                        ) : (
                          tasks.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell>{t.title}</TableCell>
                              <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</TableCell>
                              <TableCell>{t.status?.replace(/_/g, ' ') || '—'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {/* Appointments - Shadeotech only */}
            {!isAtShadesFranchisee && (
            <TabsContent value="appointments">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>When</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                              No appointments for this customer.
                            </TableCell>
                          </TableRow>
                        ) : (
                          appointments.map((a) => {
                            const whenStr = a.start
                              ? new Date(a.start).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                              : '—'
                            const typeLabel = a.type ? a.type.replace(/_/g, ' ') : '—'
                            return (
                              <TableRow key={a.id}>
                                <TableCell>{a.title}</TableCell>
                                <TableCell>{whenStr}</TableCell>
                                <TableCell>{typeLabel}</TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {/* Contacts tab */}
            {!isAtShadesFranchisee && (
            <TabsContent value="contacts">
              <div className="space-y-4">
                {/* Primary contact */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Primary Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Name</p>
                        <p className="font-medium">{customer?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                        <p>{customer?.email || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                        <p>{customer?.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Mobile</p>
                        <p>{customer?.mobile || '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional contacts */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Additional Contacts</CardTitle>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-[#c8864e] hover:bg-[#b5733d] text-white gap-1"
                        onClick={() => {
                          setEditingContact(null)
                          setContactForm(emptyContact)
                          setContactDialogOpen(true)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Add Contact
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {contacts.length === 0 ? (
                      <div className="text-center py-10">
                        <UserPlus className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No additional contacts yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Add spouse, partner, site manager, or other contacts</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {contacts.map((ct, idx) => (
                          <div key={ct._id || idx} className="flex items-start gap-3 rounded-lg border border-border p-3">
                            <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 font-semibold text-blue-600 text-sm">
                              {ct.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{ct.name}</p>
                                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">{ct.relationship}</span>
                              </div>
                              {ct.phone && <p className="text-xs text-muted-foreground">📞 {ct.phone}</p>}
                              {ct.mobile && <p className="text-xs text-muted-foreground">📱 {ct.mobile}</p>}
                              {ct.email && <p className="text-xs text-muted-foreground">✉️ {ct.email}</p>}
                              {ct.notes && <p className="text-xs text-muted-foreground italic">{ct.notes}</p>}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingContact(ct)
                                  setContactForm({ ...ct })
                                  setContactDialogOpen(true)
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-600"
                                onClick={async () => {
                                  const updated = contacts.filter((_, i) => i !== idx)
                                  setSavingContacts(true)
                                  try {
                                    await fetch(`/api/customers/${params.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({ contacts: updated }),
                                    })
                                    setContacts(updated)
                                  } finally { setSavingContacts(false) }
                                }}
                                disabled={savingContacts}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Add/Edit contact dialog */}
              <Dialog open={contactDialogOpen} onOpenChange={(v) => !v && setContactDialogOpen(false)}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <Label>Name *</Label>
                        <Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Full name" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Relationship</Label>
                        <Select value={contactForm.relationship} onValueChange={(v) => setContactForm({ ...contactForm, relationship: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['Spouse','Partner','Site Manager','Accountant','Assistant','Contractor','Other'].map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone</Label>
                        <Input value={contactForm.phone || ''} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="+1 555 000 0000" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Mobile</Label>
                        <Input value={contactForm.mobile || ''} onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })} placeholder="+1 555 000 0000" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Email</Label>
                        <Input type="email" value={contactForm.email || ''} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="email@example.com" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Notes</Label>
                        <Input value={contactForm.notes || ''} onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })} placeholder="Optional notes…" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setContactDialogOpen(false)} disabled={savingContacts}>Cancel</Button>
                    <Button
                      disabled={savingContacts || !contactForm.name.trim()}
                      className="bg-[#c8864e] hover:bg-[#b5733d] text-white"
                      onClick={async () => {
                        setSavingContacts(true)
                        try {
                          let updated: CustomerContact[]
                          if (editingContact) {
                            updated = contacts.map((c) => c === editingContact ? { ...contactForm } : c)
                          } else {
                            updated = [...contacts, { ...contactForm }]
                          }
                          const res = await fetch(`/api/customers/${params.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ contacts: updated }),
                          })
                          if (res.ok) {
                            setContacts(updated)
                            setContactDialogOpen(false)
                          }
                        } finally { setSavingContacts(false) }
                      }}
                    >
                      {savingContacts ? <Loader2 className="h-4 w-4 animate-spin" /> : editingContact ? 'Save' : 'Add Contact'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            )}

            {/* Files - Shadeotech only */}
            {!isAtShadesFranchisee && (
            <TabsContent value="files">
              <div className="space-y-4">
                {/* Tax Exemption Certificate */}
                {customer?.taxExempt && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm">Tax Exemption Certificate</CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setUploadCategory('tax_exemption'); fileInputRef.current?.click() }}
                          disabled={fileUploading}
                        >
                          {fileUploading && uploadCategory === 'tax_exemption' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Paperclip className="h-4 w-4 mr-1" />}
                          Upload Certificate
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {customerFiles.filter((f) => f.category === 'tax_exemption').length > 0 ? (
                        <div className="space-y-2">
                          {customerFiles.filter((f) => f.category === 'tax_exemption').map((f) => (
                            <div key={f._id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[300px]">
                                  {f.name}
                                </a>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">{f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString() : ''}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 h-7 px-2"
                                  onClick={async () => {
                                    if (!confirm('Remove this file?')) return
                                    const res = await fetch(`/api/customers/${params.id}/files?fileId=${f._id}`, {
                                      method: 'DELETE',
                                      headers: { Authorization: `Bearer ${token}` },
                                    })
                                    if (res.ok) setCustomerFiles((prev) => prev.filter((x) => x._id !== f._id))
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">No exemption certificate uploaded.</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setUploadCategory('tax_exemption'); fileInputRef.current?.click() }}
                            disabled={fileUploading}
                          >
                            {fileUploading && uploadCategory === 'tax_exemption' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Paperclip className="h-4 w-4 mr-1" />}
                            Upload Certificate
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* All Documents */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">All Documents</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setUploadCategory('other'); fileInputRef.current?.click() }}
                        disabled={fileUploading}
                      >
                        {fileUploading && uploadCategory === 'other' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                        Upload File
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setFileUploading(true)
                        try {
                          const fd = new FormData()
                          fd.append('file', file)
                          fd.append('category', uploadCategory)
                          const res = await fetch(`/api/customers/${params.id}/files`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: fd,
                          })
                          if (res.ok) {
                            const data = await res.json()
                            setCustomerFiles((prev) => [...prev, data.file])
                            toast({ title: 'File uploaded successfully' })
                          } else {
                            const err = await res.json()
                            toast({ title: 'Upload failed', description: err.error, variant: 'destructive' })
                          }
                        } catch {
                          toast({ title: 'Upload failed', variant: 'destructive' })
                        } finally {
                          setFileUploading(false)
                          e.target.value = ''
                        }
                      }}
                    />
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>File / Document</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Uploaded files */}
                          {customerFiles.map((f) => (
                            <TableRow key={f._id}>
                              <TableCell>
                                <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
                                  <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                                  {f.name}
                                </a>
                              </TableCell>
                              <TableCell className="text-sm capitalize">
                                {f.category === 'tax_exemption' ? 'Tax Exemption' : 'Document'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString() : '—'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 h-7 px-2 text-xs"
                                  onClick={async () => {
                                    if (!confirm('Remove this file?')) return
                                    const res = await fetch(`/api/customers/${params.id}/files?fileId=${f._id}`, {
                                      method: 'DELETE',
                                      headers: { Authorization: `Bearer ${token}` },
                                    })
                                    if (res.ok) setCustomerFiles((prev) => prev.filter((x) => x._id !== f._id))
                                  }}
                                >
                                  Remove
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Contracts */}
                          {customerContracts.map((c: any) => (
                            <TableRow key={`contract-${c._id || c.id}`}>
                              <TableCell>
                                <Link href="/contracts" className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
                                  <FileText className="h-4 w-4 text-purple-500 shrink-0" />
                                  {c.contractNumber || `Contract – ${c.customerName}`}
                                </Link>
                              </TableCell>
                              <TableCell className="text-sm">Contract</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          ))}
                          {/* Quotes */}
                          {quotes.map((q: any) => (
                            <TableRow key={`quote-${q._id || q.id}`}>
                              <TableCell>
                                <Link href={`/quotes/${q._id || q.id}`} className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
                                  <FileText className="h-4 w-4 text-amber-500 shrink-0" />
                                  {q.quoteNumber || `Quote – ${q.customerName || customer?.name}`}
                                </Link>
                              </TableCell>
                              <TableCell className="text-sm">Quote</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '—'}
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          ))}
                          {/* Invoices */}
                          {customerInvoices.map((inv: any) => (
                            <TableRow key={`invoice-${inv.id}`}>
                              <TableCell>
                                <Link href={`/invoices/${inv.id}`} className="flex items-center gap-2 text-blue-600 hover:underline text-sm">
                                  <FileText className="h-4 w-4 text-green-500 shrink-0" />
                                  {inv.invoiceNumber}
                                </Link>
                              </TableCell>
                              <TableCell className="text-sm">Invoice</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          ))}
                          {customerFiles.length === 0 && customerContracts.length === 0 && quotes.length === 0 && customerInvoices.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                                No documents found for this customer.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            )}

            {/* Portal */}
            {!isAtShadesFranchisee && (
            <TabsContent value="portal" className="space-y-4">
              {portalStatusLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !portalStatus ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <p className="text-sm text-muted-foreground mb-3">Click to load portal account info.</p>
                    <Button size="sm" onClick={fetchPortalStatus}>Load Portal Status</Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Portal Account Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Portal Account</CardTitle>
                        {portalStatus.hasAccount ? (
                          <Badge className={portalStatus.isActive ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-0' : 'bg-gray-100 text-gray-600 border-0'}>
                            {portalStatus.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">No Account</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {portalStatus.hasAccount ? (
                        <>
                          <div className="grid gap-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#2a2a2a]">
                              <span className="text-sm text-muted-foreground">Email</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{portalStatus.email}</span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => { navigator.clipboard.writeText(portalStatus.email || ''); toast({ title: 'Copied!' }) }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#2a2a2a]">
                              <span className="text-sm text-muted-foreground">Status</span>
                              <span className="text-sm font-medium">{portalStatus.isActive ? 'Active — can log in' : 'Inactive — blocked from logging in'}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <span className="text-sm text-muted-foreground">Reward Points</span>
                              <span className="text-sm font-semibold text-[#c8864e]">{portalStatus.pointsBalance ?? 0} pts</span>
                            </div>
                          </div>

                          {/* Reset Password — opens modal */}
                          <div className="pt-2 border-t border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Password Reset</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Generate a new temporary password and email it.</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setResetPasswordResult(null); setResetPasswordModalOpen(true) }}
                              className="gap-2 shrink-0"
                            >
                              <KeyRound className="h-3.5 w-3.5" /> Reset Password
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            No portal account exists for{' '}
                            <strong>{portalStatus.email || 'this customer'}</strong>.
                            {!portalStatus.email && ' Add an email address first.'}
                          </p>
                          {portalStatus.email && (
                            <Button
                              size="sm"
                              className="bg-[#c8864e] hover:bg-[#b87640] text-white gap-2"
                              onClick={() => setInviteOpen(true)}
                            >
                              <UserPlus className="h-4 w-4" />
                              Create Portal Account
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Referrals Card */}
                  {portalStatus.hasAccount && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Referral Activity</CardTitle>
                          <div className="flex gap-3 text-sm">
                            <span className="text-muted-foreground">{portalStatus.totalReferrals ?? 0} referred</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{portalStatus.purchasedReferrals ?? 0} purchased</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {portalReferrals.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">No referrals submitted yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {portalReferrals.map((ref: any) => (
                              <div key={ref.id} className="flex items-center justify-between rounded-lg border border-border p-3 gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{ref.referredName}</p>
                                  <p className="text-xs text-muted-foreground truncate">{ref.referredEmail} · {ref.referredPhone}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {ref.status === 'PURCHASED' ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 font-medium">
                                      Purchased · +200 pts
                                    </span>
                                  ) : (
                                    <select
                                      value={ref.status}
                                      disabled={updatingReferralId === ref.id}
                                      onChange={(e) => handleUpdateReferralStatus(ref.id, e.target.value)}
                                      className="text-xs rounded border border-border bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#c8864e]"
                                    >
                                      <option value="PENDING">Pending</option>
                                      <option value="CONTACTED">Contacted</option>
                                      <option value="PURCHASED">Mark Purchased (+200 pts)</option>
                                    </select>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-3">200 pts awarded when you mark a referral as Purchased.</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Pending Points Claims */}
                  {portalStatus.hasAccount && portalClaims.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Star className="h-4 w-4 text-amber-500" />
                          Pending Points Claims
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-0 text-xs">
                            {portalClaims.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {portalClaims.map((claim) => (
                          <div key={claim.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                              {claim.type === 'GOOGLE_REVIEW'
                                ? <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                : <Share2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {claim.type === 'GOOGLE_REVIEW' ? 'Google Review' : 'Social Media Follow'}
                              </p>
                              <p className="text-xs text-muted-foreground">+{claim.amount} pts · {new Date(claim.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                                disabled={approvingClaimId === claim.id}
                                onClick={() => handleApproveClaim(claim.id, 'approve')}
                              >
                                {approvingClaimId === claim.id
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <CheckCircle2 className="h-3 w-3" />
                                }
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/10"
                                disabled={approvingClaimId === claim.id}
                                onClick={() => handleApproveClaim(claim.id, 'reject')}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
            )}

            {/* At Shades: Payments */}
            {isAtShadesFranchisee && (
            <TabsContent value="payments">
              <Card>
                <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ref</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No payments found</TableCell></TableRow>
                        ) : (
                          payments.map((p: any) => (
                            <TableRow key={p.id || p._id}>
                              <TableCell>{p.ref || p.reference || 'N/A'}</TableCell>
                              <TableCell>{p.method || p.paymentMethod || 'N/A'}</TableCell>
                              <TableCell>{p.date ? (typeof p.date === 'string' ? p.date : new Date(p.date).toLocaleDateString()) : 'N/A'}</TableCell>
                              <TableCell className="text-right">${p.amount ? p.amount.toLocaleString() : '0'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {/* At Shades: Shipments */}
            {isAtShadesFranchisee && (
            <TabsContent value="shipments">
              <Card>
                <CardHeader><CardTitle>Shipments</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Shipment details per order. Select an order to view shipment info.</p>
                  {orders.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {orders.map((o: any) => (
                        <div key={o._id} className="rounded border p-3">
                          <div className="flex justify-between">
                            <span className="font-medium">{o.orderNumber}</span>
                            <Badge variant="outline">{o.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Customer: {o.customerName || 'N/A'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {/* At Shades: Production */}
            {isAtShadesFranchisee && (
            <TabsContent value="production">
              <Card>
                <CardHeader><CardTitle>Production</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Production sheets and labels per order.</p>
                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((o: any) => (
                        <div key={o._id} className="rounded border p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{o.orderNumber}</p>
                            <Badge variant="outline">{o.status}</Badge>
                          </div>
                          <div className="grid gap-2 text-sm">
                            <p className="text-muted-foreground">Production Sheets: —</p>
                            <p className="text-muted-foreground">Production Labels: —</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No orders found</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {/* At Shades: Tickets */}
            {isAtShadesFranchisee && (
            <TabsContent value="tickets">
              <Card>
                <CardHeader><CardTitle>Tickets</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Support tickets for this franchisee.</p>
                </CardContent>
              </Card>
            </TabsContent>
            )}

            {/* At Shades: Extras (Quotes, Invoices) */}
            {isAtShadesFranchisee && (
            <TabsContent value="extras">
              <Tabs defaultValue="quotes" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="quotes">Quotes</TabsTrigger>
                  <TabsTrigger value="invoices">Invoices</TabsTrigger>
                </TabsList>
                <TabsContent value="quotes">
                  <Card>
                    <CardHeader className="flex items-center justify-between">
                      <CardTitle>Quotes</CardTitle>
                      <Button size="sm" onClick={() => setQuoteDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New Quote
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Quote #</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quotes.length === 0 ? (
                              <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No quotes found</TableCell></TableRow>
                            ) : (
                              quotes.map((q: any) => (
                                <TableRow key={q.id || q._id}>
                                  <TableCell>{q.quoteNumber || q.id}</TableCell>
                                  <TableCell><Badge variant="outline">{q.status || 'N/A'}</Badge></TableCell>
                                  <TableCell>{q.createdAt ? new Date(q.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                                  <TableCell className="text-right">${q.totalAmount ? q.totalAmount.toLocaleString() : '0'}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="invoices">
                  <Card>
                    <CardHeader className="flex items-center justify-between">
                      <CardTitle>Invoices</CardTitle>
                      <Button size="sm" onClick={() => setCreateInvoiceModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice #</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoices.length === 0 ? (
                              <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No invoices found</TableCell></TableRow>
                            ) : (
                              invoices.map((inv: any) => (
                                <TableRow key={inv.id || inv._id}>
                                  <TableCell>{inv.invoiceNumber || inv.number || 'N/A'}</TableCell>
                                  <TableCell><Badge variant="outline">{inv.status || 'N/A'}</Badge></TableCell>
                                  <TableCell>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                                  <TableCell className="text-right">${inv.totalAmount ? inv.totalAmount.toLocaleString() : '0'}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Create Quote Dialog */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Quote</DialogTitle>
            <DialogDescription>
              Build a quote for {customer?.name}
            </DialogDescription>
          </DialogHeader>
          <QuoteBuilder
            customerId={params.id}
            customerLocked
            customerName={customer?.name}
            customerSideMark={customer?.sideMark}
            customerTaxExempt={customer?.taxExempt}
            customerContact={{
              email: customer?.email,
              phone: customer?.phone,
              mobile: customer?.mobile,
              street: customer?.street || customer?.address,
              town: customer?.town,
              city: customer?.city,
              country: customer?.country,
              postcode: customer?.postcode,
            }}
            onComplete={(quoteId) => {
              setQuoteDialogOpen(false)
              router.push(`/quotes/${quoteId}`)
              fetchDealerData()
            }}
          />
        </DialogContent>
      </Dialog>

      <CreateInvoiceModal
        open={createInvoiceModalOpen}
        onOpenChange={setCreateInvoiceModalOpen}
        customerId={customer.id}
        customerName={customer.name}
        sideMark={customer.sideMark || ''}
        onSuccess={fetchDealerData}
      />

      {/* Reset Password dialog — kept outside tabs so it mounts on every tab */}
      <Dialog open={resetPasswordModalOpen} onOpenChange={(o) => { setResetPasswordModalOpen(o); if (!o) setResetPasswordResult(null) }}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-[#1a1208] to-[#111] px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-white">
              <KeyRound className="h-5 w-5 text-[#c8864e]" />
              Reset Portal Password
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm mt-1">
              Generate a temporary password and email it to the customer.
            </DialogDescription>
          </div>
          <div className="p-6">
            {!resetPasswordResult ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-4 text-sm text-amber-800 dark:text-amber-300">
                  This will generate a new random temporary password, update the account, and send an email to{' '}
                  <strong>{portalStatus?.email}</strong> with login instructions.
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setResetPasswordModalOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleResetPassword}
                    disabled={resetPasswordLoading}
                    className="bg-[#c8864e] hover:bg-[#b87640] text-white gap-2"
                  >
                    {resetPasswordLoading
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</>
                      : <><KeyRound className="h-4 w-4" /> Reset Password</>
                    }
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-5 w-5" />
                  Password reset — email sent to {resetPasswordResult.email}
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Temporary Password</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-lg bg-white dark:bg-[#111] border border-border px-4 py-2.5 font-mono font-bold tracking-widest text-[#c8864e] text-lg">
                        {resetPasswordResult.tempPassword}
                      </code>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-10 w-10"
                        onClick={() => { navigator.clipboard.writeText(resetPasswordResult!.tempPassword); toast({ title: 'Copied!' }) }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Ask the customer to change this after logging in.</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="gap-2" onClick={() => { setResetPasswordResult(null) }}>
                    <RefreshCw className="h-3.5 w-3.5" /> Reset Again
                  </Button>
                  <Button onClick={() => setResetPasswordModalOpen(false)}>Done</Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite to Portal dialog — kept outside tabs so it mounts on every tab */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) setInviteResult(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#c8864e]" />
              {inviteResult ? 'Portal Access Ready' : 'Invite to Customer Portal'}
            </DialogTitle>
            <DialogDescription>
              {inviteResult
                ? inviteResult.alreadyExists
                  ? inviteResult.reactivated
                    ? 'The account has been re-activated.'
                    : 'This customer already has a portal account.'
                  : 'Account created and credentials emailed.'
                : `Create a portal login for ${customer?.name || 'this customer'} so they can view quotes, invoices, and messages.`}
            </DialogDescription>
          </DialogHeader>

          {!inviteResult ? (
            <>
              <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-[#777]">Customer</span>
                  <span className="font-medium text-gray-900 dark:text-[#e8e2db]">{customer?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-[#777]">Email</span>
                  <span className="font-medium text-gray-900 dark:text-[#e8e2db]">{customer?.email || '—'}</span>
                </div>
              </div>
              {!customer?.email && (
                <p className="text-xs text-red-500">Add an email address to this customer before sending a portal invite.</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleInvite}
                  disabled={inviteLoading || !customer?.email}
                  className="bg-[#c8864e] hover:bg-[#b87640] text-white"
                >
                  {inviteLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : <><UserPlus className="mr-2 h-4 w-4" />Send Invite</>}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {inviteResult.alreadyExists ? (
                <div className="rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
                  {inviteResult.message}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <Check className="h-4 w-4 flex-shrink-0" />
                    Credentials emailed to {inviteResult.email}
                  </div>
                  <div className="rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-4 py-3 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-[#777] mb-1">Email</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-[#e8e2db]">{inviteResult.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-[#777] mb-1">Temporary Password</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] px-3 py-1.5 text-base font-mono font-bold tracking-wider text-[#c8864e]">
                          {inviteResult.tempPassword}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { navigator.clipboard.writeText(inviteResult.tempPassword!); toast({ title: 'Copied!' }) }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-[#555]">Customer logs in at <strong>/login</strong> and should change their password after first login.</p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => { setInviteOpen(false); setInviteResult(null) }}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
