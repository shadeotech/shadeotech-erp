'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Edit,
  Printer,
  MoreHorizontal,
  X,
  Activity,
  Clock,
  User,
  Building2,
  MapPin,
  Globe,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type LeadStatus = 'NEW' | 'ATTEMPTED_TO_CONTACT' | 'CONNECTED' | 'APPOINTMENT_BOOKED' | 'UNQUALIFIED' | 'FOLLOW_UP_LATER'
type LeadSource = 'WEBSITE' | 'META_ADS' | 'GOOGLE_ADS' | 'REFERRAL' | 'MANUAL'
type CallOutcome = 'CONNECTED_CONSULTATION_BOOKED' | 'CONNECTED_NOT_INTERESTED' | 'LEFT_VOICEMAIL' | 'WRONG_NUMBER'

const mockLead = {
  id: 'lead_1',
  name: 'James Smith',
  email: 'james.smith@email.com',
  phone: '+1 (555) 123-4567',
  company: 'Smith Industries',
  address: '123 Main Street, Suite 100',
  city: 'New York',
  website: 'www.smithindustries.com',
  source: 'WEBSITE' as LeadSource,
  status: 'NEW' as LeadStatus,
  assignedTo: 'John Smith',
  leadValue: 5000,
  createdAt: new Date('2024-02-15'),
  lastContact: null as Date | null,
  defaultLanguage: 'System Default',
  tags: [] as string[],
  isPublic: false,
}

const statusFlow: LeadStatus[] = [
  'NEW',
  'ATTEMPTED_TO_CONTACT',
  'CONNECTED',
  'APPOINTMENT_BOOKED',
  'UNQUALIFIED',
]

const statusLabels: Record<LeadStatus, string> = {
  NEW: 'New',
  ATTEMPTED_TO_CONTACT: 'Attempted to Contact',
  CONNECTED: 'Connected',
  APPOINTMENT_BOOKED: 'Appointment Booked',
  UNQUALIFIED: 'Unqualified',
  FOLLOW_UP_LATER: 'Follow up later',
}

const callOutcomeLabels: Record<CallOutcome, string> = {
  CONNECTED_CONSULTATION_BOOKED: 'Connected, consultation booked',
  CONNECTED_NOT_INTERESTED: 'Connected, not interested',
  LEFT_VOICEMAIL: 'Left voicemail',
  WRONG_NUMBER: 'Wrong Number',
}

const mockActivities = [
  {
    id: 'act_1',
    type: 'call',
    description: 'Initial call to discuss window shade options',
    outcome: 'CONNECTED_CONSULTATION_BOOKED' as CallOutcome,
    date: new Date('2024-02-16'),
    time: '10:30 AM',
    user: 'John Smith',
  },
  {
    id: 'act_2',
    type: 'email',
    subject: 'Window Shade Quote Request',
    description: 'Sent initial quote information',
    date: new Date('2024-02-15'),
    time: '2:15 PM',
    user: 'John Smith',
  },
]

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState(mockLead)
  const [activeTab, setActiveTab] = useState('activity')
  const [logCallOpen, setLogCallOpen] = useState(false)
  const [logEmailOpen, setLogEmailOpen] = useState(false)
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  
  const [callForm, setCallForm] = useState({
    contacted: lead.name,
    outcome: '' as CallOutcome | '',
    direction: 'outbound',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    description: '',
    createTodo: false,
    todoAssignee: '',
    todoDueDate: '',
  })

  const [emailForm, setEmailForm] = useState({
    to: lead.email,
    subject: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    description: '',
    createTodo: false,
    todoAssignee: '',
    todoDueDate: '',
  })

  const [followUpForm, setFollowUpForm] = useState({
    notifyDate: '',
    notifyTime: '',
    assignTo: '',
    notes: '',
  })

  const currentStatusIndex = statusFlow.indexOf(lead.status)

  const handleStatusChange = (newStatus: LeadStatus) => {
    setLead({ ...lead, status: newStatus, lastContact: new Date() })
    if (newStatus === 'APPOINTMENT_BOOKED') {
      // Lead moves to customer tab - this would be handled by backend
      router.push(`/customers/${lead.id}`)
    }
  }

  const handleLogCall = () => {
    // Log call logic
    setLogCallOpen(false)
    setCallForm({
      contacted: lead.name,
      outcome: '' as CallOutcome | '',
      direction: 'outbound',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      description: '',
      createTodo: false,
      todoAssignee: '',
      todoDueDate: '',
    })
  }

  const handleLogEmail = () => {
    // Log email logic
    setLogEmailOpen(false)
    setEmailForm({
      to: lead.email,
      subject: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      description: '',
      createTodo: false,
      todoAssignee: '',
      todoDueDate: '',
    })
  }

  const handleFollowUpLater = () => {
    setLead({ ...lead, status: 'FOLLOW_UP_LATER' })
    setFollowUpDialogOpen(true)
  }

  const handleSaveFollowUp = () => {
    // Save follow-up task logic
    setFollowUpDialogOpen(false)
    setFollowUpForm({
      notifyDate: '',
      notifyTime: '',
      assignTo: '',
      notes: '',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{lead.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Lead #{lead.id.split('_')[1]}{lead.company ? ` · ${lead.company}` : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setCalendarOpen(!calendarOpen)}>
            <Calendar className="h-3.5 w-3.5" /> Calendar
          </Button>
          <Button size="sm" className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
            <User className="h-3.5 w-3.5" /> Convert to customer
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Edit className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status pipeline */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-4">
        <div className="flex items-center overflow-x-auto gap-1 pb-1">
          {statusFlow.map((status, index) => {
            const isActive = index === currentStatusIndex
            const isPast = index < currentStatusIndex
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={cn(
                  'flex-1 min-w-0 py-2 px-3 text-center text-xs font-medium rounded-lg transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm'
                    : isPast
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {statusLabels[status]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex w-full gap-2 overflow-x-auto">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="emails">Emails</TabsTrigger>
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="texts">Texts</TabsTrigger>
            </TabsList>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Activity</CardTitle>
                    <Button variant="outline" size="sm">
                      Collapse all
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockActivities.map((activity) => (
                      <div key={activity.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                        <div className="flex items-start gap-3">
                          {activity.type === 'call' ? (
                            <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1" />
                          ) : (
                            <Mail className="h-5 w-5 text-green-600 dark:text-green-400 mt-1" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                {activity.type === 'call' ? (
                                  <p className="font-medium text-gray-900 dark:text-white">{activity.description}</p>
                                ) : (
                                  <p className="font-medium text-gray-900 dark:text-white">{activity.subject}</p>
                                )}
                                <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                  {activity.description}
                                </p>
                              </div>
                              <div className="text-xs text-muted-foreground dark:text-gray-400">
                                {format(activity.date, 'MMM dd, yyyy')} at {activity.time}
                              </div>
                            </div>
                            {activity.type === 'call' && activity.outcome && (
                              <Badge variant="outline" className="mt-2">
                                {callOutcomeLabels[activity.outcome]}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Emails Tab */}
            <TabsContent value="emails" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Emails</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="link" className="text-blue-600 dark:text-blue-400">
                        Thread email replies
                      </Button>
                      <Button variant="outline" onClick={() => setLogEmailOpen(true)}>
                        Log Email
                      </Button>
                      <Button>
                        Create Email
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    Send emails to a contact from this record. Or log emails in the system from your email client.{' '}
                    <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Learn more</a>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calls Tab */}
            <TabsContent value="calls" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Calls</CardTitle>
                    <Button onClick={() => setLogCallOpen(true)}>
                      Log Call
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockActivities.filter(a => a.type === 'call').map((call) => (
                      <div key={call.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{call.description}</p>
                            <Badge variant="outline" className="mt-2">
                              {callOutcomeLabels[call.outcome as CallOutcome]}
                            </Badge>
                            <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                              {format(call.date, 'MMM dd, yyyy')} at {call.time} by {call.user}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Texts Tab */}
            <TabsContent value="texts" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Texts</CardTitle>
                    <Button>
                      Send Text
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Send and receive text messages with this lead.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Lead card */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
            {/* Avatar header */}
            <div className="bg-gradient-to-r from-amber-50 to-stone-50 dark:from-gray-800 dark:to-gray-800 px-4 pt-4 pb-10 relative">
              <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                {lead.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
              </div>
            </div>
            <div className="-mt-6 px-4 pb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{lead.name}</h3>
              {lead.company && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lead.company}</p>}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 text-xs">
                  {statusLabels[lead.status]}
                </Badge>
                <Badge variant="outline" className="text-xs text-gray-500">
                  {lead.source.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>

            {/* Quick actions */}
            <div className="border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800">
              {[
                { icon: <Phone className="h-3.5 w-3.5" />, label: 'Call', href: `tel:${lead.phone}` },
                { icon: <Mail className="h-3.5 w-3.5" />, label: 'Email', href: `mailto:${lead.email}` },
                { icon: <MessageSquare className="h-3.5 w-3.5" />, label: 'SMS', href: '#' },
              ].map(({ icon, label, href }) => (
                <a key={label} href={href} className="flex flex-col items-center gap-1 py-2.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50/50 dark:hover:text-amber-400 dark:hover:bg-amber-900/10 transition-colors">
                  {icon}
                  <span className="text-[10px] font-medium">{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Lead value stat */}
          <div className="rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">Lead Value</span>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-300">${lead.leadValue.toLocaleString()}</span>
          </div>

          {/* Contact details */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            {[
              { icon: <Mail className="h-3.5 w-3.5" />, label: 'Email', value: lead.email, href: `mailto:${lead.email}` },
              { icon: <Phone className="h-3.5 w-3.5" />, label: 'Phone', value: lead.phone, href: `tel:${lead.phone}` },
              { icon: <Globe className="h-3.5 w-3.5" />, label: 'Website', value: lead.website, href: `https://${lead.website}` },
              { icon: <Building2 className="h-3.5 w-3.5" />, label: 'Company', value: lead.company || '—' },
              { icon: <MapPin className="h-3.5 w-3.5" />, label: 'Address', value: [lead.address, lead.city].filter(Boolean).join(', ') || '—' },
            ].map(({ icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-3 px-4 py-2.5">
                <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                  {href ? (
                    <a href={href} className="text-xs text-amber-600 dark:text-amber-400 hover:underline truncate block">{value}</a>
                  ) : (
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Status + Assigned */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-4 space-y-3">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Change Status</p>
              <Select value={lead.status} onValueChange={(v: any) => {
                if (v === 'FOLLOW_UP_LATER') handleFollowUpLater()
                else handleStatusChange(v)
              }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusFlow.map((status) => (
                    <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                  ))}
                  <SelectItem value="FOLLOW_UP_LATER">Follow up later</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Assigned To</p>
                <p className="text-gray-700 dark:text-gray-300 mt-0.5 font-medium">{lead.assignedTo}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Last Contact</p>
                <p className="text-gray-700 dark:text-gray-300 mt-0.5 font-medium">{lead.lastContact ? format(lead.lastContact, 'MMM d, yyyy') : 'Never'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Created</p>
                <p className="text-gray-700 dark:text-gray-300 mt-0.5 font-medium">{format(lead.createdAt, 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Source</p>
                <p className="text-gray-700 dark:text-gray-300 mt-0.5 font-medium">{lead.source.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Sidebar */}
      {calendarOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white border-l shadow-lg z-50 overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Calendar</h3>
            <Button variant="ghost" size="icon" onClick={() => setCalendarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              Calendar view for scheduling appointments with {lead.name}
            </p>
            <Button className="w-full mt-4">
              <Calendar className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </div>
        </div>
      )}

      {/* Log Call Dialog */}
      <Dialog open={logCallOpen} onOpenChange={setLogCallOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Call</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contacted</Label>
                <Select value={callForm.contacted} onValueChange={(v) => setCallForm({ ...callForm, contacted: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={lead.name}>{lead.name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Call outcome</Label>
                <Select value={callForm.outcome} onValueChange={(v: any) => setCallForm({ ...callForm, outcome: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONNECTED_CONSULTATION_BOOKED">Connected, consultation booked</SelectItem>
                    <SelectItem value="CONNECTED_NOT_INTERESTED">Connected, not interested</SelectItem>
                    <SelectItem value="LEFT_VOICEMAIL">Left voicemail</SelectItem>
                    <SelectItem value="WRONG_NUMBER">Wrong Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Direction</Label>
                <Select value={callForm.direction} onValueChange={(v) => setCallForm({ ...callForm, direction: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={callForm.date}
                  onChange={(e) => setCallForm({ ...callForm, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={callForm.time}
                  onChange={(e) => setCallForm({ ...callForm, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Describe the call...</Label>
              <Textarea
                value={callForm.description}
                onChange={(e) => setCallForm({ ...callForm, description: e.target.value })}
                rows={6}
                placeholder="Describe the call..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={callForm.createTodo}
                onCheckedChange={(checked) => setCallForm({ ...callForm, createTodo: checked as boolean })}
              />
              <Label>Create a To-do task to follow up</Label>
            </div>
            {callForm.createTodo && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <Label>Assign To</Label>
                  <Select value={callForm.todoAssignee} onValueChange={(v) => setCallForm({ ...callForm, todoAssignee: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john">John Smith</SelectItem>
                      <SelectItem value="sarah">Sarah Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Select value={callForm.todoDueDate} onValueChange={(v) => setCallForm({ ...callForm, todoDueDate: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="3days">In 3 business days</SelectItem>
                      <SelectItem value="1week">In 1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogCallOpen(false)}>Cancel</Button>
            <Button onClick={handleLogCall}>Log activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Email Dialog */}
      <Dialog open={logEmailOpen} onOpenChange={setLogEmailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>To</Label>
                <Input value={emailForm.to} onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })} />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={emailForm.date}
                  onChange={(e) => setEmailForm({ ...emailForm, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={emailForm.time}
                  onChange={(e) => setEmailForm({ ...emailForm, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label>Describe the email...</Label>
              <Textarea
                value={emailForm.description}
                onChange={(e) => setEmailForm({ ...emailForm, description: e.target.value })}
                rows={6}
                placeholder="Describe the email..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={emailForm.createTodo}
                onCheckedChange={(checked) => setEmailForm({ ...emailForm, createTodo: checked as boolean })}
              />
              <Label>Create a To-do task to follow up</Label>
            </div>
            {emailForm.createTodo && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <Label>Assign To</Label>
                  <Select value={emailForm.todoAssignee} onValueChange={(v) => setEmailForm({ ...emailForm, todoAssignee: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john">John Smith</SelectItem>
                      <SelectItem value="sarah">Sarah Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Select value={emailForm.todoDueDate} onValueChange={(v) => setEmailForm({ ...emailForm, todoDueDate: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="3days">In 3 business days</SelectItem>
                      <SelectItem value="1week">In 1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleLogEmail}>Log activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow Up Later Dialog */}
      <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Follow Up Later</DialogTitle>
            <DialogDescription>
              Set a reminder to follow up with this lead later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Notify Date</Label>
                <Input
                  type="date"
                  value={followUpForm.notifyDate}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, notifyDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Notify Time</Label>
                <Input
                  type="time"
                  value={followUpForm.notifyTime}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, notifyTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Assign To</Label>
              <Select value={followUpForm.assignTo} onValueChange={(v) => setFollowUpForm({ ...followUpForm, assignTo: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John Smith</SelectItem>
                  <SelectItem value="sarah">Sarah Johnson</SelectItem>
                  <SelectItem value="mike">Mike Davis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={followUpForm.notes}
                onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                rows={3}
                placeholder="Add notes for follow-up..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFollowUpDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFollowUp}>Save Follow Up</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

