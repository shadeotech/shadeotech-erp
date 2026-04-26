'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Plus,
  Search,
  Ticket,
  Eye,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Building2,
  Loader2,
  Check,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ACCEPTED'
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type TicketSource = 'SHADEOTECH_CUSTOMER' | 'AT_SHADES' | 'AT_SHADES_FRANCHISEE'

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  description: string
  source: TicketSource
  customerName: string
  customerId: string
  status: TicketStatus
  priority: TicketPriority
  assignedTo?: string
  assignedToName?: string
  orderNumber?: string
  createdAt: Date
  updatedAt: Date
}


const statusLabels: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  ACCEPTED: 'Accepted',
}

const statusColors: Record<TicketStatus, string> = {
  OPEN: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  IN_PROGRESS: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  RESOLVED: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  CLOSED: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  ACCEPTED: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
}

const priorityColors: Record<TicketPriority, string> = {
  LOW: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  MEDIUM: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  HIGH: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  URGENT: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
}

const sourceLabels: Record<TicketSource, string> = {
  SHADEOTECH_CUSTOMER: 'Shadeotech Customer',
  AT_SHADES: 'At Shades',
  AT_SHADES_FRANCHISEE: 'At Shades Franchisee',
}

const sourceIcons: Record<TicketSource, React.ReactNode> = {
  SHADEOTECH_CUSTOMER: <User className="h-4 w-4" />,
  AT_SHADES: <Building2 className="h-4 w-4" />,
  AT_SHADES_FRANCHISEE: <Building2 className="h-4 w-4" />,
}

const sourceColors: Record<TicketSource, string> = {
  SHADEOTECH_CUSTOMER: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  AT_SHADES: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  AT_SHADES_FRANCHISEE: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
}

const DEFAULT_TICKET_SUBJECTS = [
  'Add New',
  'Solar Not Charging',
  'Motor Not Working',
  'Programming Issues',
  'Exterior Zip Issue',
  'Installation Issues',
  'Remote Not Working',
  'Missing Item',
  'Chain/Cord Broken',
  'Other',
]

export default function TicketsPage() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | TicketSource>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | TicketPriority>('all')
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [ticketSubjects, setTicketSubjects] = useState<string[]>(DEFAULT_TICKET_SUBJECTS)
  const [newTicketOpen, setNewTicketOpen] = useState(false)
  const [newTicketSubject, setNewTicketSubject] = useState('')
  const [addingNewSubject, setAddingNewSubject] = useState(false)
  const [newSubjectInput, setNewSubjectInput] = useState('')
  const [newTicketDescription, setNewTicketDescription] = useState('')
  const [newTicketOrderNumber, setNewTicketOrderNumber] = useState('')
  const [newTicketPriority, setNewTicketPriority] = useState<TicketPriority>('MEDIUM')
  const [submittingTicket, setSubmittingTicket] = useState(false)
  // Customer search
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<{ id: string; name: string }[]>([])
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedCustomerName, setSelectedCustomerName] = useState('')
  const [allCustomers, setAllCustomers] = useState<{ id: string; name: string }[]>([])
  // Customer orders dropdown
  const [customerOrders, setCustomerOrders] = useState<{ id: string; orderNumber: string; label: string }[]>([])
  const [customerOrdersLoading, setCustomerOrdersLoading] = useState(false)
  // Staff users for assignment
  const [staffUsers, setStaffUsers] = useState<{ id: string; name: string }[]>([])
  const [updatingAssigned, setUpdatingAssigned] = useState<string | null>(null)

  const fetchTickets = useCallback(async (searchTerm?: string) => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      if (sourceFilter !== 'all') params.set('source', sourceFilter)
      if (searchTerm || search) params.set('search', searchTerm || search)

      const res = await fetch(`/api/tickets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load tickets')
      }
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tickets')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [token, statusFilter, priorityFilter, sourceFilter, search])

  useEffect(() => {
    fetchTickets()
  }, [token, statusFilter, priorityFilter, sourceFilter])

  useEffect(() => {
    if (!token) return
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.users) {
          setStaffUsers(d.users.map((u: any) => ({
            id: u._id || u.id,
            name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
          })))
        }
      })
      .catch(() => {})
  }, [token])

  useEffect(() => {
    fetch('/api/settings/company')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (Array.isArray(d?.ticketSubjects) && d.ticketSubjects.length > 0) {
          setTicketSubjects(d.ticketSubjects)
        }
      })
      .catch(() => {})
  }, [])

  // Fetch customers when modal opens
  useEffect(() => {
    if (!newTicketOpen || !token || allCustomers.length > 0) return
    fetch('/api/customers', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.customers) {
          setAllCustomers(d.customers.map((c: any) => ({ id: c.id || c._id, name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() })))
        }
      })
      .catch(() => {})
  }, [newTicketOpen, token])

  // Filter customers as user types
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([])
      setCustomerSearchOpen(false)
      return
    }
    const q = customerSearch.toLowerCase()
    const matches = allCustomers.filter(c => c.name.toLowerCase().includes(q)).slice(0, 8)
    setCustomerResults(matches)
    setCustomerSearchOpen(matches.length > 0)
  }, [customerSearch, allCustomers])

  // Fetch orders for selected customer
  useEffect(() => {
    if (!selectedCustomerId || !token) {
      setCustomerOrders([])
      setNewTicketOrderNumber('')
      return
    }
    setCustomerOrdersLoading(true)
    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const all: any[] = d?.orders || []
        const filtered = all.filter((o: any) =>
          o.customerId === selectedCustomerId ||
          o.customerName?.toLowerCase() === selectedCustomerName.toLowerCase()
        )
        setCustomerOrders(filtered.map((o: any) => ({
          id: o._id || o.id,
          orderNumber: o.orderNumber,
          label: `${o.orderNumber}${o.status ? ` — ${o.status.replace(/_/g, ' ')}` : ''}`,
        })))
        setNewTicketOrderNumber('')
      })
      .catch(() => setCustomerOrders([]))
      .finally(() => setCustomerOrdersLoading(false))
  }, [selectedCustomerId, selectedCustomerName, token])

  const handleSearch = () => {
    fetchTickets(search)
  }

  const counters = useMemo(() => {
    return {
      all: tickets.length,
      open: tickets.filter(t => t.status === 'OPEN').length,
      inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
      resolved: tickets.filter(t => t.status === 'RESOLVED').length,
      closed: tickets.filter(t => t.status === 'CLOSED').length,
    }
  }, [tickets])

  const selectedTicketData = tickets.find(t => t.id === selectedTicket)

  const handleViewTicket = (ticketId: string) => {
    setSelectedTicket(ticketId)
    setViewDialogOpen(true)
  }

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    if (!token) return
    try {
      setUpdatingStatus(ticketId)
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update ticket status')
      }
      const data = await res.json()
      setTickets(tickets.map(t => t.id === ticketId ? data.ticket : t))
      toast({
        title: 'Success',
        description: 'Ticket status updated successfully',
      })
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to update ticket status',
        variant: 'destructive',
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleAssignedToChange = async (ticketId: string, userId: string) => {
    if (!token) return
    const staff = staffUsers.find(u => u.id === userId)
    try {
      setUpdatingAssigned(ticketId)
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignedTo: userId, assignedToName: staff?.name || userId }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setTickets(tickets.map(t => t.id === ticketId ? data.ticket : t))
    } catch {
      toast({ title: 'Error', description: 'Failed to update assignment', variant: 'destructive' })
    } finally {
      setUpdatingAssigned(null)
    }
  }

  const resetNewTicketForm = () => {
    setNewTicketSubject('')
    setNewTicketDescription('')
    setNewTicketOrderNumber('')
    setNewTicketPriority('MEDIUM')
    setCustomerSearch('')
    setSelectedCustomerId('')
    setSelectedCustomerName('')
    setCustomerOrders([])
    setAddingNewSubject(false)
    setNewSubjectInput('')
  }

  const handleAddNewSubject = () => {
    const trimmed = newSubjectInput.trim()
    if (!trimmed) return
    const updated = [...ticketSubjects.filter(s => s !== 'Add New'), trimmed, 'Add New']
    setTicketSubjects(updated)
    setNewTicketSubject(trimmed)
    setAddingNewSubject(false)
    setNewSubjectInput('')
    // Persist to settings
    if (token) {
      fetch('/api/settings/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ticketSubjects: updated }),
      }).catch(() => {})
    }
  }

  const handleCreateTicket = async () => {
    if (!token || !newTicketSubject.trim() || !newTicketDescription.trim()) {
      toast({ title: 'Error', description: 'Subject and description are required.', variant: 'destructive' })
      return
    }
    if (!selectedCustomerName.trim()) {
      toast({ title: 'Error', description: 'Please select a customer.', variant: 'destructive' })
      return
    }
    if (!newTicketOrderNumber) {
      toast({ title: 'Error', description: 'Please select an order.', variant: 'destructive' })
      return
    }
    try {
      setSubmittingTicket(true)
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: newTicketSubject.trim(),
          description: newTicketDescription.trim(),
          orderNumber: newTicketOrderNumber.trim(),
          priority: newTicketPriority,
          customerId: selectedCustomerId,
          customerName: selectedCustomerName,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create claim')
      setTickets(prev => [data.ticket, ...prev])
      setNewTicketOpen(false)
      resetNewTicketForm()
      toast({ title: 'Claim created', description: `Claim ${data.ticket.ticketNumber} created successfully.` })
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to create claim', variant: 'destructive' })
    } finally {
      setSubmittingTicket(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Claims</h2>
          <p className="text-sm text-muted-foreground">
            Manage claims and support requests
          </p>
        </div>
        <Button onClick={() => setNewTicketOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Claim
        </Button>
      </div>

      {/* Counters */}
      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: 'All Claims',   value: counters.all,        border: '#9CA3AF' },
          { label: 'Open',         value: counters.open,       border: '#EF4444' },
          { label: 'In Progress',  value: counters.inProgress, border: '#F59E0B' },
          { label: 'Resolved',     value: counters.resolved,   border: '#10B981' },
          { label: 'Closed',       value: counters.closed,     border: '#6B7280' },
        ].map(({ label, value, border }) => (
          <div
            key={label}
            className="rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
            style={{ borderLeftWidth: 4, borderLeftColor: border }}
          >
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search claims..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7"
            onClick={handleSearch}
          >
            Search
          </Button>
        </div>
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v: any) => setSourceFilter(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="SHADEOTECH_CUSTOMER">Shadeotech Customer</SelectItem>
            <SelectItem value="AT_SHADES">At Shades</SelectItem>
            <SelectItem value="AT_SHADES_FRANCHISEE">At Shades Franchisee</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v: any) => setPriorityFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim ID</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No claims found
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium text-gray-900 dark:text-white">{ticket.ticketNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1 line-clamp-1">
                        {ticket.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('border-0 flex items-center gap-1 w-fit', sourceColors[ticket.source])}
                    >
                      {sourceIcons[ticket.source]}
                      {sourceLabels[ticket.source]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/customers/${ticket.customerId}`}
                      className="hover:underline text-gray-900 dark:text-white"
                    >
                      {ticket.customerName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={ticket.status}
                      onValueChange={(v: any) => handleStatusChange(ticket.id, v)}
                      disabled={updatingStatus === ticket.id}
                    >
                      <SelectTrigger className={cn('h-7 w-[130px] text-xs border-0 font-medium', statusColors[ticket.status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn('border-0', priorityColors[ticket.priority])}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {staffUsers.length > 0 ? (
                      <Select
                        value={ticket.assignedTo || ''}
                        onValueChange={(v) => handleAssignedToChange(ticket.id, v)}
                        disabled={updatingAssigned === ticket.id}
                      >
                        <SelectTrigger className="h-7 w-36 text-xs border-0 bg-transparent">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffUsers.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.assignedToName || ticket.assignedTo || '-'}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewTicket(ticket.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/customers/${ticket.customerId}`}>
                            View Customer
                          </Link>
                        </DropdownMenuItem>
                        {ticket.orderNumber && (
                          <DropdownMenuItem>
                            <Link href={`/orders/${ticket.orderNumber}`}>
                              View Order
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Ticket Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Claim Details - {selectedTicketData?.ticketNumber}</DialogTitle>
            <DialogDescription>
              {selectedTicketData?.subject}
            </DialogDescription>
          </DialogHeader>

          {selectedTicketData && (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground dark:text-gray-400">Source</Label>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className={cn('border-0 flex items-center gap-1 w-fit', sourceColors[selectedTicketData.source])}
                    >
                      {sourceIcons[selectedTicketData.source]}
                      {sourceLabels[selectedTicketData.source]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground dark:text-gray-400">Status</Label>
                  <div className="mt-1">
                    <Select
                      value={selectedTicketData.status}
                      onValueChange={(v: any) => handleStatusChange(selectedTicketData.id, v)}
                      disabled={updatingStatus === selectedTicketData.id}
                    >
                      <SelectTrigger>
                        <SelectValue />
                        {updatingStatus === selectedTicketData.id && (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="ACCEPTED">Accepted</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground dark:text-gray-400">Customer</Label>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">
                    <Link
                      href={`/customers/${selectedTicketData.customerId}`}
                      className="hover:underline"
                    >
                      {selectedTicketData.customerName}
                    </Link>
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground dark:text-gray-400">Priority</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={cn('border-0', priorityColors[selectedTicketData.priority])}>
                      {selectedTicketData.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground dark:text-gray-400">Assigned To</Label>
                  <div className="mt-1">
                    {staffUsers.length > 0 ? (
                      <Select
                        value={selectedTicketData.assignedTo || ''}
                        onValueChange={(v) => handleAssignedToChange(selectedTicketData.id, v)}
                        disabled={updatingAssigned === selectedTicketData.id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffUsers.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-gray-900 dark:text-white">{selectedTicketData.assignedToName || selectedTicketData.assignedTo || '-'}</p>
                    )}
                  </div>
                </div>
                {selectedTicketData.orderNumber && (
                  <div>
                    <Label className="text-xs text-muted-foreground dark:text-gray-400">Order Number</Label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      <Link
                        href={`/orders/${selectedTicketData.orderNumber}`}
                        className="hover:underline"
                      >
                        {selectedTicketData.orderNumber}
                      </Link>
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground dark:text-gray-400">Created</Label>
                  <p className="mt-1 text-gray-900 dark:text-white">{format(selectedTicketData.createdAt, 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground dark:text-gray-400">Last Updated</Label>
                  <p className="mt-1 text-gray-900 dark:text-white">{format(selectedTicketData.updatedAt, 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs text-muted-foreground dark:text-gray-400">Description</Label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white">{selectedTicketData.description}</p>
                </div>
              </div>

              {/* Comments/Updates Section */}
              <div>
                <Label className="text-xs text-muted-foreground dark:text-gray-400">Add Comment</Label>
                <Textarea
                  className="mt-2"
                  rows={3}
                  placeholder="Add a comment or update..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setViewDialogOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Ticket Dialog */}
      <Dialog open={newTicketOpen} onOpenChange={(open) => { setNewTicketOpen(open); if (!open) resetNewTicketForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Claim</DialogTitle>
            <DialogDescription>Submit a claim. All fields marked * are required.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">

            {/* Subject */}
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Select
                value={newTicketSubject}
                onValueChange={(v) => {
                  if (v === 'Add New') {
                    setAddingNewSubject(true)
                    setNewTicketSubject('')
                  } else {
                    setNewTicketSubject(v)
                    setAddingNewSubject(false)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject..." />
                </SelectTrigger>
                <SelectContent>
                  {ticketSubjects.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {addingNewSubject && (
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    autoFocus
                    placeholder="Type new subject..."
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddNewSubject() }}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddNewSubject} disabled={!newSubjectInput.trim()}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setAddingNewSubject(false); setNewSubjectInput('') }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Customer Name */}
            <div className="space-y-1.5 relative">
              <Label>Customer Name *</Label>
              <Input
                placeholder="Search customer..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value)
                  setSelectedCustomerId('')
                  setSelectedCustomerName('')
                }}
              />
              {customerSearchOpen && customerResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                      onClick={() => {
                        setSelectedCustomerId(c.id)
                        setSelectedCustomerName(c.name)
                        setCustomerSearch(c.name)
                        setCustomerSearchOpen(false)
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              {selectedCustomerId && (
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Customer selected
                </p>
              )}
            </div>

            {/* Order Number */}
            <div className="space-y-1.5">
              <Label>Order Number *</Label>
              {!selectedCustomerId ? (
                <p className="text-xs text-muted-foreground py-2 px-3 rounded-md border border-dashed border-gray-200 dark:border-gray-700">
                  Select a customer first to see their orders.
                </p>
              ) : customerOrdersLoading ? (
                <div className="flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
                </div>
              ) : customerOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 px-3 rounded-md border border-dashed border-gray-200 dark:border-gray-700">
                  No orders found for this customer.
                </p>
              ) : (
                <Select value={newTicketOrderNumber} onValueChange={setNewTicketOrderNumber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customerOrders.map((o) => (
                      <SelectItem key={o.id} value={o.orderNumber}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={newTicketPriority} onValueChange={(v: any) => setNewTicketPriority(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea value={newTicketDescription} onChange={(e) => setNewTicketDescription(e.target.value)} rows={4} placeholder="Describe the issue in detail..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNewTicketOpen(false); resetNewTicketForm() }}>Cancel</Button>
            <Button onClick={handleCreateTicket} disabled={submittingTicket}>
              {submittingTicket ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : 'Create Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

