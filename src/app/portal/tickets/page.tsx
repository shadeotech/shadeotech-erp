'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Ticket, Plus, Eye, MessageSquare, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { useState, useEffect, useCallback } from 'react'
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
  lastUpdate: Date
  createdAt: Date
  updatedAt: Date
  description: string
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  RESOLVED: 'bg-green-500/10 text-green-700 dark:text-green-400',
  CLOSED: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  MEDIUM: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  HIGH: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  URGENT: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

export default function CustomerTicketsPage() {
  const { token } = useAuthStore()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [newTicket, setNewTicket] = useState({ subject: '', priority: 'MEDIUM' as TicketPriority, description: '', orderNumber: '' })
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setDialogOpen(false)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and track your support tickets
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and we'll get back to you as soon as possible.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTicket.priority} onValueChange={(v) => setNewTicket({ ...newTicket, priority: v as TicketPriority })}>
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
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input
                    id="orderNumber"
                    placeholder="Enter order number"
                    value={newTicket.orderNumber}
                    onChange={(e) => setNewTicket({ ...newTicket, orderNumber: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your issue"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
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

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[ticket.status]}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityColors[ticket.priority]}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(ticket.created), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(ticket.lastUpdate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTicket.subject}</DialogTitle>
              <DialogDescription>
                Ticket #{selectedTicket.ticketNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant="outline" className={statusColors[selectedTicket.status]}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Badge variant="outline" className={priorityColors[selectedTicket.priority]}>
                    {selectedTicket.priority}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedTicket.description}</p>
              </div>
              <div className="border-t pt-4">
                <Label className="text-xs text-muted-foreground">Add Reply</Label>
                <Textarea
                  placeholder="Type your message here..."
                  rows={4}
                  className="mt-2"
                />
                <Button className="mt-2">Send Reply</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

