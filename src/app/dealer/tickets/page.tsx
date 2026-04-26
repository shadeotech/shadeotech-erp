'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Ticket, Plus, Search, Eye, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/use-toast'

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  created: Date
  createdAt: Date
  description: string
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  RESOLVED: 'bg-green-500/10 text-green-700 dark:text-green-400',
  CLOSED: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
}

const priorityColors: Record<string, string> = {
  HIGH: 'bg-red-500/10 text-red-700 dark:text-red-400',
  MEDIUM: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  LOW: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
}

export default function TicketsPage() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: '',
    priority: 'MEDIUM' as TicketPriority,
    description: '',
    orderNumber: '',
  })

  const fetchTickets = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/tickets', {
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
  }, [token])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateTicket = async () => {
    if (!token || !newTicket.subject || !newTicket.description || !newTicket.orderNumber) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      setCreating(true)
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTicket),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create ticket')
      }
      const data = await res.json()
      setTickets(prev => [data.ticket, ...prev])
      setCreateDialogOpen(false)
      setNewTicket({ subject: '', priority: 'MEDIUM', description: '', orderNumber: '' })
      toast({
        title: 'Success',
        description: 'Ticket created successfully',
      })
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to create ticket',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Create and track support tickets for your orders and inquiries
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-md hover:shadow-lg transition-shadow">
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>
                Submit a support ticket for any questions or issues
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Brief description of your issue"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(v) => setNewTicket({ ...newTicket, priority: v as TicketPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Order Number</Label>
                  <Input
                    placeholder="Enter order number"
                    value={newTicket.orderNumber}
                    onChange={(e) => setNewTicket({ ...newTicket, orderNumber: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Provide details about your issue..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleCreateTicket} disabled={creating || !newTicket.subject || !newTicket.description || !newTicket.orderNumber}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Ticket'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tickets Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">All Tickets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 dark:border-gray-800">
                  <TableHead className="h-10">Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-white">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-white">
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusColors[ticket.status]} border-0`}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${priorityColors[ticket.priority]} border-0`}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(ticket.created), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No tickets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
