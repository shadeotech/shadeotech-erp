'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Plus,
  Search,
  Pencil,
  ArrowUpRight,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  Users,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { CustomerType, LeadSource, CustomerStatus } from '@/stores/customersStore'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { AddAppointmentModal } from '@/app/(dashboard)/calendar/AddAppointmentModal'
import { sanitizePhoneInput, validatePhone, PHONE_MAX_LENGTH } from '@/lib/phoneValidation'
import type { CalendarEvent } from '@/app/(dashboard)/calendar/mockCalendarEvents'
import { AddressAutocomplete, type AddressSelection } from '@/components/shared/AddressAutocomplete'

interface DealerCustomer {
  id: string
  name: string
  email: string
  phone: string
  type: CustomerType
  source: LeadSource
  status: CustomerStatus
  sideMark: string
  taxExempt?: boolean
  address?: string
  isSignupUser?: boolean
  isActive?: boolean
  createdAt?: string
}

const typeLabels: Record<CustomerType, string> = {
  FRANCHISEE: 'Franchisee',
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  PARTNER: 'Partner',
}

// Pipeline stages in order — maps to DB status values
const PIPELINE_STAGES: { value: CustomerStatus; label: string }[] = [
  { value: 'LEAD', label: 'New Lead' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'CUSTOMER', label: 'Customer' },
]

const stageIndex: Record<CustomerStatus, number> = {
  LEAD: 0,
  CONTACTED: 1,
  QUALIFIED: 2,
  CUSTOMER: 3,
  INACTIVE: -1,
}

const statusStyles: Record<CustomerStatus, string> = {
  LEAD: 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600',
  CONTACTED: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700',
  QUALIFIED: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-600',
  CUSTOMER: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  INACTIVE: 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700',
}

const statusLabel: Record<CustomerStatus, string> = {
  LEAD: 'New Lead',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  CUSTOMER: 'Customer',
  INACTIVE: 'Inactive',
}

const typeColors: Record<CustomerType, string> = {
  FRANCHISEE: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  RESIDENTIAL: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300',
  COMMERCIAL: 'bg-stone-100 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300',
  PARTNER: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
}

const sourceColors: Record<LeadSource, string> = {
  'Meta Ads': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  'Google Ads': 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  'Website Form': 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
  Calendar: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  Referral: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
  Manual: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
}

const customerTypes: CustomerType[] = ['FRANCHISEE', 'RESIDENTIAL', 'COMMERCIAL', 'PARTNER']
const leadSources: LeadSource[] = ['Meta Ads', 'Google Ads', 'Website Form', 'Calendar', 'Referral', 'Manual']

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[\d\s+\-().]*$/

function validateCustomerContact(
  email: string,
  phone: string,
  mobile: string
): { email?: string; phone?: string; mobile?: string } {
  const errors: { email?: string; phone?: string; mobile?: string } = {}
  const e = email.trim()
  if (e && !EMAIL_REGEX.test(e)) errors.email = 'Please enter a valid email address'
  const p = phone.trim()
  if (p) {
    if (p.length > PHONE_MAX_LENGTH) errors.phone = `Phone number cannot exceed ${PHONE_MAX_LENGTH} characters`
    else if (!PHONE_REGEX.test(p)) errors.phone = 'Phone can only contain digits, spaces, +, -, (), or .'
  }
  const m = mobile.trim()
  if (m) {
    if (m.length > PHONE_MAX_LENGTH) errors.mobile = `Mobile number cannot exceed ${PHONE_MAX_LENGTH} characters`
    else if (!PHONE_REGEX.test(m)) errors.mobile = 'Mobile can only contain digits, spaces, +, -, (), or .'
  }
  return errors
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
}

const AVATAR_COLORS = [
  'bg-amber-600',
  'bg-stone-500',
  'bg-amber-500',
  'bg-neutral-600',
  'bg-amber-700',
  'bg-stone-600',
  'bg-yellow-600',
  'bg-neutral-500',
]

function avatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const CALENDAR_EVENTS_API = '/api/calendar/events'

export default function CustomersPage() {
  const { token, user } = useAuthStore()
  const { toast } = useToast()
  const [customers, setCustomers] = useState<DealerCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [bookAppointmentModalOpen, setBookAppointmentModalOpen] = useState(false)
  const [bookAppointmentCustomer, setBookAppointmentCustomer] = useState<DealerCustomer | null>(null)
  const [staffMembers, setStaffMembers] = useState<Array<{ id: string; name: string; email?: string }>>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | CustomerType>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | LeadSource>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerStatus>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const initialNewCustomer = {
    type: 'RESIDENTIAL' as CustomerType,
    name: '',
    email: '',
    phone: '',
    mobile: '',
    street: '',
    town: '',
    city: '',
    country: '',
    postcode: '',
    sideMark: '',
    source: 'Manual' as LeadSource,
    status: undefined as CustomerStatus | undefined,
    ownerName: '',
    storeNumber: '',
    shippingAddress: '',
    companyName: '',
    companyType: '',
    numberOfWindows: '',
    productsOfInterest: '',
    partnerType: '',
    taxExempt: false,
  }
  const [newCustomer, setNewCustomer] = useState(initialNewCustomer)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; phone?: string; mobile?: string }>({})
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const DB_TO_UI_LEAD_SOURCE: Record<string, LeadSource> = {
    META: 'Meta Ads',
    GOOGLE: 'Google Ads',
    OTHER_ORGANIC: 'Website Form',
    WALK_IN: 'Manual',
    REFERRAL: 'Referral',
    PARTNER_REFERRAL: 'Referral',
  }

  const fetchData = useCallback(async () => {
    if (!token) { setLoading(false); return }
    try {
      setLoading(true)
      let orders: any[] = []
      try {
        const ordersRes = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
        if (ordersRes.ok) { const d = await ordersRes.json(); orders = d.orders || [] }
      } catch (_) {}

      let users: any[] = []
      try {
        const usersRes = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
        if (usersRes.ok) { const d = await usersRes.json(); users = d.users || [] }
      } catch (_) {}

      const dealerMap = new Map<string, { dealerId: string; dealerName: string; orders: Array<{ customerName: string; orderDate: Date }>; orderCount: number; lastOrderDate?: Date }>()
      orders.forEach((order: any) => {
        if (!order.dealerId) return
        if (!dealerMap.has(order.dealerId)) dealerMap.set(order.dealerId, { dealerId: order.dealerId, dealerName: order.dealerName || '', orders: [], orderCount: 0 })
        const dealerData = dealerMap.get(order.dealerId)!
        const orderDate = order.orderDate ? new Date(order.orderDate) : new Date()
        if (order.customerName) dealerData.orders.push({ customerName: order.customerName, orderDate })
        dealerData.orderCount++
        if (!dealerData.lastOrderDate || orderDate > dealerData.lastOrderDate) dealerData.lastOrderDate = orderDate
      })

      const dealersList: DealerCustomer[] = []
      dealerMap.forEach((dealerData, dealerId) => {
        const u = users.find((u: any) => u._id === dealerId || u.id === dealerId)
        dealerData.orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime())
        const customerName = dealerData.orders.length > 0 ? dealerData.orders[0].customerName : 'N/A'
        dealersList.push({ id: dealerId, name: dealerData.dealerName || u?.name || 'Unknown Dealer', email: u?.email || '', phone: u?.phone || '', type: 'PARTNER' as CustomerType, source: 'Manual' as LeadSource, status: 'CUSTOMER' as CustomerStatus, sideMark: customerName, address: u?.address || '' })
      })
      dealersList.sort((a, b) => {
        const aData = dealerMap.get(a.id); const bData = dealerMap.get(b.id)
        if (!aData?.lastOrderDate && !bData?.lastOrderDate) return 0
        if (!aData?.lastOrderDate) return 1
        if (!bData?.lastOrderDate) return -1
        return bData.lastOrderDate!.getTime() - aData.lastOrderDate!.getTime()
      })

      let apiCustomers: DealerCustomer[] = []
      try {
        const custRes = await fetch('/api/customers', { headers: { Authorization: `Bearer ${token}` } })
        if (custRes.ok) {
          setFetchError(null)
          const custData = await custRes.json()
          const validStatuses = new Set(['LEAD','CONTACTED','QUALIFIED','CUSTOMER','INACTIVE'])
          apiCustomers = (custData.customers || []).map((c: any) => ({
            id: c.id || c._id,
            name: c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.sideMark || 'Unknown',
            email: c.email || '',
            phone: c.phone || '',
            type: (c.customerType || c.type) as CustomerType,
            source: (DB_TO_UI_LEAD_SOURCE[c.leadSource] || 'Manual') as LeadSource,
            status: (validStatuses.has(c.status) ? c.status : 'LEAD') as CustomerStatus,
            sideMark: c.sideMark || '',
            taxExempt: !!c.taxExempt,
            address: [c.street, c.city, c.postcode].filter(Boolean).join(', ') || c.address || '',
            isSignupUser: !!c.isSignupUser,
            isActive: c.isSignupUser ? !!c.isActive : undefined,
            createdAt: c.createdAt || undefined,
          }))
        } else {
          const errData = await custRes.json().catch(() => ({}))
          const msg = errData.error || `Server returned ${custRes.status}`
          setFetchError(msg)
          toast({ title: 'Failed to load customers', description: msg, variant: 'destructive' })
        }
      } catch (fetchErr) {
        const msg = fetchErr instanceof Error ? fetchErr.message : 'Network error'
        setFetchError(msg)
        toast({ title: 'Failed to load customers', description: msg, variant: 'destructive' })
      }

      const merged = [...apiCustomers]
      dealersList.forEach((d) => { if (!merged.some((m) => m.id === d.id)) merged.push(d) })
      merged.sort((a, b) => {
        const aIsDealer = dealersList.some((d) => d.id === a.id)
        const bIsDealer = dealersList.some((d) => d.id === b.id)
        if (aIsDealer && !bIsDealer) return -1
        if (!aIsDealer && bIsDealer) return 1
        return 0
      })
      setCustomers(merged)
    } catch (error) {
      console.error('Error fetching customers:', error)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = useMemo(() => {
    return customers.filter((c: any) => {
      const matchesSearch =
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (c.phone?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (c.address?.toLowerCase().includes(search.toLowerCase()) ?? false)
      const matchesType = typeFilter === 'all' || c.type === typeFilter
      const matchesSource = sourceFilter === 'all' || c.source === sourceFilter
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      return matchesSearch && matchesType && matchesSource && matchesStatus
    })
  }, [customers, search, typeFilter, sourceFilter, statusFilter])

  useEffect(() => { setPage(1) }, [search, typeFilter, sourceFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const summary = useMemo(() => ({
    total: customers.length,
    leads: customers.filter((c: any) => ['LEAD','CONTACTED','QUALIFIED'].includes(c.status)).length,
    customers: customers.filter((c: any) => c.status === 'CUSTOMER').length,
  }), [customers])

  const inlineUpdate = (id: string, field: string) => async (value: string) => {
    if (!token) return
    if (field === 'phone' || field === 'mobile') {
      const err = validatePhone(value)
      if (err) { toast({ title: 'Invalid phone', description: err, variant: 'destructive' }); return }
    }
    const customer = customers.find((c) => c.id === id)
    if (!customer) return
    const body: Record<string, string> = {}
    if (field === 'phone') body.phone = value
    else if (field === 'email') body.email = value
    else if (field === 'sideMark') body.sideMark = value
    else if (field === 'status') body.status = value
    else if (field === 'type') body.type = value
    else return
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        if (res.status === 404 || res.status === 400) {
          toast({ title: 'Cannot edit', description: 'Only CRM customers can be edited inline.', variant: 'destructive' })
          return
        }
        throw new Error('Failed to update')
      }
      const data = await res.json().catch(() => ({} as { customer?: Record<string, unknown> }))
      const srv = data.customer
      setCustomers((prev) => prev.map((c) => {
        if (c.id !== id) return c
        const next = { ...c, [field]: value } as DealerCustomer
        const srvType = srv?.customerType ?? srv?.type
        if (field === 'type' && srvType != null) next.type = srvType as CustomerType
        if (srv?.sideMark != null && String(srv.sideMark).length > 0) next.sideMark = String(srv.sideMark)
        return next
      }))
      toast({ title: 'Updated', description: `${field} updated successfully` })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update', variant: 'destructive' })
    }
  }

  const handleCreate = async () => {
    if (!newCustomer.name.trim() || !token) return
    try {
      setCreating(true)
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newCustomer.name.trim(),
          type: newCustomer.type,
          email: newCustomer.email.trim() || undefined,
          phone: newCustomer.phone.trim() || undefined,
          mobile: newCustomer.mobile.trim() || undefined,
          street: newCustomer.street.trim() || undefined,
          town: newCustomer.town.trim() || undefined,
          city: newCustomer.city.trim() || undefined,
          country: newCustomer.country.trim() || undefined,
          postcode: newCustomer.postcode.trim() || undefined,
          sideMark: newCustomer.sideMark.trim() || undefined,
          source: newCustomer.source,
          taxExempt: newCustomer.taxExempt,
          ownerName: newCustomer.ownerName?.trim() || undefined,
          storeNumber: newCustomer.storeNumber?.trim() || undefined,
          shippingAddress: newCustomer.shippingAddress?.trim() || undefined,
          companyName: newCustomer.companyName?.trim() || undefined,
          companyType: newCustomer.companyType || undefined,
          numberOfWindows: newCustomer.numberOfWindows ? parseInt(newCustomer.numberOfWindows) : undefined,
          productsOfInterest: newCustomer.productsOfInterest?.trim() ? newCustomer.productsOfInterest.split(',').map((s: string) => s.trim()) : undefined,
          partnerType: newCustomer.partnerType || undefined,
        }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to create customer') }
      setDialogOpen(false)
      setNewCustomer(initialNewCustomer)
      setEditingCustomerId(null)
      await fetchData()
      toast({ title: 'Success', description: 'Customer created successfully' })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to create customer', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const bookAppointment = (customer: DealerCustomer) => {
    setBookAppointmentCustomer(customer)
    setBookAppointmentModalOpen(true)
  }

  const fetchStaffMembers = useCallback(async () => {
    if (!token || user?.role !== 'ADMIN') { setStaffMembers([]); return }
    try {
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      const list = (data.users || [])
        .filter((u: { role?: string }) => u.role === 'ADMIN' || u.role === 'STAFF')
        .map((u: { id?: string; _id?: string; name?: string; firstName?: string; lastName?: string; email?: string }) => ({
          id: u.id || u._id || '',
          name: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unknown',
          email: u.email,
        }))
        .filter((m: { id: string }) => m.id)
      setStaffMembers(list)
    } catch { setStaffMembers([]) }
  }, [token, user?.role])

  useEffect(() => { fetchStaffMembers() }, [fetchStaffMembers])

  const handleBookAppointmentSave = async (event: CalendarEvent) => {
    if (!token) return
    try {
      const res = await fetch(CALENDAR_EVENTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(event),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to create appointment') }
      setBookAppointmentModalOpen(false)
      setBookAppointmentCustomer(null)
      toast({ title: 'Appointment scheduled', description: `Appointment created for ${bookAppointmentCustomer?.name}` })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to create appointment', variant: 'destructive' })
    }
  }

  const handleEditClick = async (c: DealerCustomer) => {
    if (!token) return
    try {
      const res = await fetch(`/api/customers/${c.id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) {
        if (res.status === 404 || res.status === 400) {
          toast({ title: 'Cannot edit', description: 'Only CRM customers can be edited here.', variant: 'destructive' })
          return
        }
        throw new Error('Failed to load customer')
      }
      const data = await res.json()
      setNewCustomer({
        type: (data.customerType || data.type || 'RESIDENTIAL') as CustomerType,
        name: data.name || [data.firstName, data.lastName].filter(Boolean).join(' ') || '',
        email: data.email || '',
        phone: data.phone || '',
        mobile: data.mobile || '',
        street: data.street || '',
        town: data.town || '',
        city: data.city || '',
        country: data.country || '',
        postcode: data.postcode || '',
        sideMark: data.sideMark || '',
        source: (DB_TO_UI_LEAD_SOURCE[data.leadSource] || 'Manual') as LeadSource,
        status: (['LEAD', 'CUSTOMER'].includes(data.status) ? data.status : 'LEAD') as CustomerStatus,
        taxExempt: !!data.taxExempt,
        ownerName: data.ownerName || '',
        storeNumber: data.storeNumber || '',
        shippingAddress: data.shippingAddress || '',
        companyName: data.companyName || '',
        companyType: data.companyType || '',
        numberOfWindows: data.numberOfWindows != null ? String(data.numberOfWindows) : '',
        productsOfInterest: Array.isArray(data.productsOfInterest) ? data.productsOfInterest.join(', ') : data.productsOfInterest || '',
        partnerType: data.partnerType || '',
      })
      setEditingCustomerId(data.id || data._id)
      setFieldErrors({})
      setDialogOpen(true)
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to load customer', variant: 'destructive' })
    }
  }

  const handleSaveCustomer = async () => {
    if (!newCustomer.name.trim() || !token) return
    const errors = validateCustomerContact(newCustomer.email, newCustomer.phone, newCustomer.mobile)
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    setFieldErrors({})
    if (editingCustomerId) {
      try {
        setCreating(true)
        const res = await fetch(`/api/customers/${editingCustomerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: newCustomer.name.trim(),
            type: newCustomer.type,
            status: newCustomer.status,
            email: newCustomer.email.trim() || undefined,
            phone: newCustomer.phone.trim() || undefined,
            mobile: newCustomer.mobile.trim() || undefined,
            street: newCustomer.street.trim() || undefined,
            town: newCustomer.town.trim() || undefined,
            city: newCustomer.city.trim() || undefined,
            country: newCustomer.country.trim() || undefined,
            postcode: newCustomer.postcode.trim() || undefined,
            sideMark: newCustomer.sideMark.trim() || undefined,
            source: newCustomer.source,
            taxExempt: newCustomer.taxExempt,
          }),
        })
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to update customer') }
        setDialogOpen(false)
        setEditingCustomerId(null)
        setNewCustomer(initialNewCustomer)
        await fetchData()
        toast({ title: 'Success', description: 'Customer updated successfully' })
      } catch (err) {
        toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update customer', variant: 'destructive' })
      } finally {
        setCreating(false)
      }
      return
    }
    handleCreate()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Contacts</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{summary.total}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">total</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 px-3 py-1.5">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{summary.leads}</span>
              <span className="text-xs text-amber-600/70 dark:text-amber-400/60">in pipeline</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-3 py-1.5">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{summary.customers}</span>
              <span className="text-xs text-emerald-600/70 dark:text-emerald-400/60">customers</span>
            </div>
          </div>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) { setEditingCustomerId(null); setNewCustomer(initialNewCustomer); setFieldErrors({}) }
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => { setEditingCustomerId(null); setNewCustomer(initialNewCustomer); setFieldErrors({}) }}
            >
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCustomerId ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newCustomer.type} onValueChange={(v) => setNewCustomer({ ...newCustomer, type: v as CustomerType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {customerTypes.map((t) => (<SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                {editingCustomerId && (
                  <div className="space-y-2">
                    <Label>Stage</Label>
                    <Select value={newCustomer.status ?? 'LEAD'} onValueChange={(v) => setNewCustomer({ ...newCustomer, status: v as CustomerStatus })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <Label className="text-base font-medium">Contact &amp; Address</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={newCustomer.email} onChange={(e) => { setNewCustomer({ ...newCustomer, email: e.target.value }); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined })) }} placeholder="email@example.com" className={fieldErrors.email ? 'border-destructive' : ''} />
                    {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={newCustomer.phone} onChange={(e) => { const v = sanitizePhoneInput(e.target.value); setNewCustomer({ ...newCustomer, phone: v }); if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined })) }} placeholder="Phone number" className={fieldErrors.phone ? 'border-destructive' : ''} />
                    {fieldErrors.phone && <p className="text-sm text-destructive">{fieldErrors.phone}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Street</Label>
                    <AddressAutocomplete
                      value={newCustomer.street}
                      onChange={(val) => setNewCustomer({ ...newCustomer, street: val })}
                      onSelect={(sel: AddressSelection) => setNewCustomer((prev) => ({ ...prev, street: sel.street || sel.fullAddress, town: sel.state, city: sel.city, postcode: sel.postalCode, country: sel.country }))}
                      placeholder="Start typing a street address…"
                    />
                  </div>
                  <div className="space-y-2"><Label>City</Label><Input value={newCustomer.city} onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })} placeholder="City" /></div>
                  <div className="space-y-2"><Label>Postcode / Zip</Label><Input value={newCustomer.postcode} onChange={(e) => setNewCustomer({ ...newCustomer, postcode: e.target.value })} placeholder="Postcode or Zip code" /></div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Side Mark <span className="text-xs text-muted-foreground">(auto-generated if empty)</span></Label>
                  <Input value={newCustomer.sideMark} onChange={(e) => setNewCustomer({ ...newCustomer, sideMark: e.target.value })} placeholder="Auto-generated" />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={newCustomer.source} onValueChange={(v) => setNewCustomer({ ...newCustomer, source: v as LeadSource })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{leadSources.map((src) => (<SelectItem key={src} value={src}>{src}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>Cancel</Button>
              <Button onClick={handleSaveCustomer} disabled={creating || !newCustomer.name.trim()}>
                {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : editingCustomerId ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search name, phone, address…" className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="w-36 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {customerTypes.map((t) => (<SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-36 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {PIPELINE_STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as any)}>
            <SelectTrigger className="w-36 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {leadSources.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contact Table — HubSpot style */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
              <TableHead className="w-[260px] font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Type</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 min-w-[200px]">Stage</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Source</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Side Mark</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Added</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  {fetchError ? (
                    <div className="flex flex-col items-center gap-2 text-destructive">
                      <AlertCircle className="h-8 w-8" />
                      <p className="font-medium">Failed to load contacts</p>
                      <p className="text-sm text-muted-foreground">{fetchError}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-30" />
                      <p className="font-medium">No contacts found</p>
                      <p className="text-sm">
                        {search || typeFilter !== 'all' || sourceFilter !== 'all' || statusFilter !== 'all'
                          ? 'Try clearing your filters'
                          : 'Add your first contact to get started'}
                      </p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
            {paginated.map((c: any) => (
              <TableRow
                key={c.id}
                className="group border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
              >
                {/* Contact cell */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-white text-sm font-semibold', avatarColor(c.id))}>
                      {getInitials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/customers/${c.id}`} className="font-semibold text-sm text-gray-900 dark:text-white hover:text-primary truncate max-w-[140px]">
                          {c.name}
                        </Link>
                        {c.isSignupUser && c.isActive === false && (
                          <Badge variant="outline" className="h-4 px-1 text-[9px] border-amber-400 text-amber-600 shrink-0">Pending</Badge>
                        )}
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.preventDefault(); handleEditClick(c) }}
                        >
                          <Pencil className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {c.phone && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Phone className="h-3 w-3" />{c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                            <Mail className="h-3 w-3" />{c.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Type */}
                <TableCell>
                  <Select value={c.type} onValueChange={(v) => inlineUpdate(c.id, 'type')(v)}>
                    <SelectTrigger className={cn('h-7 w-[120px] text-xs border-0 rounded-full px-2.5 font-medium', typeColors[c.type as keyof typeof typeColors])}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {customerTypes.map((t) => (<SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Stage — Monday.com-style pipeline */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    {c.status === 'INACTIVE' ? (
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border', statusStyles.INACTIVE)}>
                        Inactive
                      </span>
                    ) : (
                      PIPELINE_STAGES.map((stage, idx) => {
                        const currentIdx = stageIndex[c.status as CustomerStatus] ?? 0
                        const isActive = idx === currentIdx
                        const isPast = idx < currentIdx
                        return (
                          <button
                            key={stage.value}
                            title={stage.label}
                            onClick={() => inlineUpdate(c.id, 'status')(stage.value)}
                            className={cn(
                              'h-2 rounded-full transition-all duration-150',
                              idx === 0 ? 'w-5' : idx === PIPELINE_STAGES.length - 1 ? 'w-5' : 'w-4',
                              isActive
                                ? 'bg-amber-500 dark:bg-amber-400 scale-110'
                                : isPast
                                ? 'bg-amber-300 dark:bg-amber-600'
                                : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500',
                            )}
                          />
                        )
                      })
                    )}
                    <span className={cn('ml-1.5 text-xs font-medium', c.status === 'INACTIVE' ? 'hidden' : '')}>
                      {statusLabel[c.status as CustomerStatus] ?? c.status}
                    </span>
                  </div>
                </TableCell>

                {/* Source */}
                <TableCell>
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', sourceColors[(c as any).source as keyof typeof sourceColors])}>
                    {c.source}
                  </span>
                </TableCell>

                {/* Side Mark */}
                <TableCell>
                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{c.sideMark || '—'}</span>
                </TableCell>

                {/* Added date */}
                <TableCell>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {c.createdAt ? format(new Date(c.createdAt), 'MMM d, yyyy') : '—'}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-gray-500 hover:text-primary hover:bg-primary/5"
                      onClick={() => bookAppointment(c)}
                      title="Schedule appointment"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                    </Button>
                    <Link href={`/customers/${c.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-700">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
              <SelectTrigger className="h-8 w-20 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let p: number
              if (totalPages <= 7) p = i + 1
              else if (page <= 4) p = i + 1
              else if (page >= totalPages - 3) p = totalPages - 6 + i
              else p = page - 3 + i
              return (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              )
            })}
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Book Appointment modal */}
      <AddAppointmentModal
        open={bookAppointmentModalOpen}
        onOpenChange={(open) => { setBookAppointmentModalOpen(open); if (!open) setBookAppointmentCustomer(null) }}
        initialDate={new Date()}
        onSave={handleBookAppointmentSave}
        defaultAssignedTo={user?._id}
        teamMembers={staffMembers.length ? staffMembers : undefined}
        isAdmin={user?.role === 'ADMIN'}
        preselectedCustomer={bookAppointmentCustomer ? {
          id: bookAppointmentCustomer.id,
          name: bookAppointmentCustomer.name,
          email: bookAppointmentCustomer.email || undefined,
          phone: bookAppointmentCustomer.phone || undefined,
          address: bookAppointmentCustomer.address || undefined,
          sideMark: bookAppointmentCustomer.sideMark || undefined,
          taxExempt: bookAppointmentCustomer.taxExempt,
        } : null}
      />
    </div>
  )
}
