'use client'

import { useState, useMemo } from 'react'
import { DataPagination } from '@/components/ui/data-pagination'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Plus, Search, MoreHorizontal, Eye, Phone, Mail, MessageSquare, CalendarPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SendEmailModal } from '@/components/shared/SendEmailModal'

type LeadStatus = 'NEW' | 'ATTEMPTED_TO_CONTACT' | 'CONNECTED' | 'APPOINTMENT_BOOKED' | 'UNQUALIFIED' | 'FOLLOW_UP_LATER'
type LeadSource = 'WEBSITE' | 'META_ADS' | 'GOOGLE_ADS' | 'REFERRAL' | 'MANUAL'

type Lead = {
  id: string
  name: string
  email: string
  phone: string
  company?: string
  source: LeadSource
  status: LeadStatus
  assignedTo: string
  createdAt: Date
  lastContact: Date | null
  leadValue: number
  referredBy?: { id: string; name: string }
}

const mockLeads: Lead[] = [
  {
    id: 'lead_1',
    name: 'James Smith',
    email: 'james.smith@email.com',
    phone: '+1 (555) 123-4567',
    company: 'Smith Industries',
    source: 'WEBSITE' as LeadSource,
    status: 'NEW' as LeadStatus,
    assignedTo: 'John Smith',
    createdAt: new Date('2024-02-15'),
    lastContact: null as Date | null,
    leadValue: 5000,
    referredBy: undefined,
  },
  {
    id: 'lead_2',
    name: 'Molly Thomson',
    email: 'molly.thomson@email.com',
    phone: '+1 (555) 234-5678',
    company: 'Thomson Corp',
    source: 'META_ADS' as LeadSource,
    status: 'CONNECTED' as LeadStatus,
    assignedTo: 'Sarah Johnson',
    createdAt: new Date('2024-02-14'),
    lastContact: new Date('2024-02-16'),
    leadValue: 7500,
    referredBy: undefined,
  },
  {
    id: 'lead_3',
    name: 'Robert Wilson',
    email: 'robert.wilson@email.com',
    phone: '+1 (555) 345-6789',
    company: 'Wilson Solutions',
    source: 'GOOGLE_ADS' as LeadSource,
    status: 'ATTEMPTED_TO_CONTACT' as LeadStatus,
    assignedTo: 'John Smith',
    createdAt: new Date('2024-02-13'),
    lastContact: new Date('2024-02-15'),
    leadValue: 3000,
    referredBy: undefined,
  },
  {
    id: 'lead_4',
    name: 'Emily Brown',
    email: 'emily.brown@email.com',
    phone: '+1 (555) 456-7890',
    company: 'Brown Enterprises',
    source: 'REFERRAL' as LeadSource,
    status: 'APPOINTMENT_BOOKED' as LeadStatus,
    assignedTo: 'Sarah Johnson',
    createdAt: new Date('2024-02-12'),
    lastContact: new Date('2024-02-17'),
    leadValue: 10000,
    referredBy: { id: 'cust-001', name: 'John Doe' },
  },
  {
    id: 'lead_7',
    name: 'Sarah Williams',
    email: 'sarah.williams@email.com',
    phone: '+1 (555) 123-4567',
    company: undefined,
    source: 'REFERRAL' as LeadSource,
    status: 'NEW' as LeadStatus,
    assignedTo: 'John Smith',
    createdAt: new Date('2025-01-20'),
    lastContact: null as Date | null,
    leadValue: 0,
    referredBy: { id: 'cust-001', name: 'John Doe' },
  },
  {
    id: 'lead_8',
    name: 'Michael Johnson',
    email: 'michael.j@email.com',
    phone: '+1 (555) 234-5678',
    company: undefined,
    source: 'REFERRAL' as LeadSource,
    status: 'CONNECTED' as LeadStatus,
    assignedTo: 'Sarah Johnson',
    createdAt: new Date('2025-01-05'),
    lastContact: new Date('2025-01-08'),
    leadValue: 0,
    referredBy: { id: 'cust-001', name: 'John Doe' },
  },
  {
    id: 'lead_5',
    name: 'Michael Davis',
    email: 'michael.davis@email.com',
    phone: '+1 (555) 567-8901',
    company: 'Davis Group',
    source: 'WEBSITE' as LeadSource,
    status: 'FOLLOW_UP_LATER' as LeadStatus,
    assignedTo: 'Mike Davis',
    createdAt: new Date('2024-02-11'),
    lastContact: new Date('2024-02-14'),
    leadValue: 4500,
    referredBy: undefined,
  },
  {
    id: 'lead_6',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@email.com',
    phone: '+1 (555) 678-9012',
    company: 'Anderson Inc',
    source: 'META_ADS' as LeadSource,
    status: 'UNQUALIFIED' as LeadStatus,
    assignedTo: 'Emily Brown',
    createdAt: new Date('2024-02-10'),
    lastContact: new Date('2024-02-13'),
    leadValue: 0,
    referredBy: undefined,
  },
]

const statusLabels: Record<LeadStatus, string> = {
  NEW: 'New',
  ATTEMPTED_TO_CONTACT: 'Attempted to Contact',
  CONNECTED: 'Connected',
  APPOINTMENT_BOOKED: 'Appointment Booked',
  UNQUALIFIED: 'Unqualified',
  FOLLOW_UP_LATER: 'Follow up later',
}

const statusColors: Record<LeadStatus, string> = {
  NEW: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  ATTEMPTED_TO_CONTACT: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  CONNECTED: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  APPOINTMENT_BOOKED: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  UNQUALIFIED: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  FOLLOW_UP_LATER: 'bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
}

const sourceLabels: Record<LeadSource, string> = {
  WEBSITE: 'Website',
  META_ADS: 'Meta Ads',
  GOOGLE_ADS: 'Google Ads',
  REFERRAL: 'Referral',
  MANUAL: 'Manual',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState(mockLeads)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | LeadSource>('all')
  const [emailModalLead, setEmailModalLead] = useState<Lead | null>(null)

  const counters = useMemo(() => {
    return {
      all: leads.length,
      new: leads.filter(l => l.status === 'NEW').length,
      connected: leads.filter(l => l.status === 'CONNECTED').length,
      appointmentBooked: leads.filter(l => l.status === 'APPOINTMENT_BOOKED').length,
    }
  }, [leads])

  const filtered = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = !search ||
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        lead.company?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
      const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter
      return matchesSearch && matchesStatus && matchesSource
    })
  }, [leads, search, statusFilter, sourceFilter])

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  const paginatedLeads = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  )

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    setLeads(leads.map(lead => 
      lead.id === leadId 
        ? { ...lead, status: newStatus, lastContact: newStatus === 'APPOINTMENT_BOOKED' ? new Date() : lead.lastContact }
        : lead
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Leads</h2>
          <p className="text-sm text-muted-foreground">
            Manage leads from website, ads, and Google
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Lead
        </Button>
      </div>

      {/* Counters */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'All Leads', value: counters.all, border: '#B45309' },
          { label: 'New', value: counters.new, border: '#C47D10' },
          { label: 'Connected', value: counters.connected, border: '#D97706' },
          { label: 'Appointment Booked', value: counters.appointmentBooked, border: '#F59E0B' },
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
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search leads…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="h-9 w-44 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="ATTEMPTED_TO_CONTACT">Attempted to Contact</SelectItem>
              <SelectItem value="CONNECTED">Connected</SelectItem>
              <SelectItem value="APPOINTMENT_BOOKED">Appointment Booked</SelectItem>
              <SelectItem value="UNQUALIFIED">Unqualified</SelectItem>
              <SelectItem value="FOLLOW_UP_LATER">Follow up later</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(v: any) => { setSourceFilter(v); setPage(1) }}>
            <SelectTrigger className="h-9 w-36 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="WEBSITE">Website</SelectItem>
              <SelectItem value="META_ADS">Meta Ads</SelectItem>
              <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
              <SelectItem value="REFERRAL">Referral</SelectItem>
              <SelectItem value="MANUAL">Manual</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto text-xs text-gray-400 self-center">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Lead Value</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Link href={`/leads/${lead.id}`} className="hover:underline">
                    <div className="font-medium">{lead.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {lead.email}
                      {lead.referredBy && (
                        <span className="block mt-1 text-amber-600 dark:text-amber-500">
                          Referred by {lead.referredBy.name}
                        </span>
                      )}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-gray-500/10 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-0">
                    {sourceLabels[lead.source]}
                    {lead.referredBy && (
                      <span className="ml-1 text-xs">👤</span>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('border-0', statusColors[lead.status])}>
                    {statusLabels[lead.status]}
                  </Badge>
                </TableCell>
                <TableCell>{lead.assignedTo}</TableCell>
                <TableCell className="font-medium">
                  ${lead.leadValue.toLocaleString()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {lead.lastContact ? new Date(lead.lastContact).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/leads/${lead.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Phone className="mr-2 h-4 w-4" />
                        Log Call
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEmailModalLead(lead)}>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Send Text
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Schedule
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DataPagination
          total={filtered.length}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(n) => { setPerPage(n); setPage(1) }}
        />
      </div>

      <SendEmailModal
        open={!!emailModalLead}
        onOpenChange={(open) => { if (!open) setEmailModalLead(null) }}
        to={emailModalLead?.email || ''}
        customerName={emailModalLead?.name}
      />
    </div>
  )
}

