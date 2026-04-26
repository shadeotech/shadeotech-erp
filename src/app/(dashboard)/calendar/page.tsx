'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { CalendarView } from './CalendarView'
import { TeamWeekView } from './TeamWeekView'
import { AddAppointmentModal } from './AddAppointmentModal'
import { EventDetailsModal } from './EventDetailsModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, CalendarDays, Users, X, Clock } from 'lucide-react'
import { CalendarEvent } from './mockCalendarEvents'
import { MOCK_USER, MOCK_TEAM_MEMBERS, EVENT_TYPES } from './constants'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/authStore'
import { canPerformActions, canDelete } from '@/lib/permissions'

const API_BASE = '/api/calendar/events'

export type StaffMember = { id: string; name: string; email?: string }

export default function CalendarPage() {
  const { user, token } = useAuthStore()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showAllEvents, setShowAllEvents] = useState(true)
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all')
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [microsoftSyncEnabled, setMicrosoftSyncEnabled] = useState(false)
  const [microsoftSyncEmail, setMicrosoftSyncEmail] = useState('')
  const [calendarViewMode, setCalendarViewMode] = useState<'calendar' | 'team'>('team')
  const [dayPanelDate, setDayPanelDate] = useState<Date | null>(null)
  const [dayPanelEvents, setDayPanelEvents] = useState<CalendarEvent[]>([])

  // Fetch Microsoft sync status on mount
  useEffect(() => {
    if (!token) return
    fetch('/api/calendar/sync/status', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setMicrosoftSyncEnabled(data.enabled)
          setMicrosoftSyncEmail(data.calendarEmail || '')
        }
      })
      .catch(() => {})
  }, [token])

  // Permission checks
  const canAddAppointments = canPerformActions(user, 'calendar')
  const canFilterByStaff = canPerformActions(user, 'calendar')
  const canEditEvents = canPerformActions(user, 'calendar')
  const canDeleteEvents = canDelete(user, 'calendar')

  const fetchEvents = useCallback(async () => {
    if (!token) {
      setEvents([])
      setEventsLoading(false)
      return
    }
    setEventsLoading(true)
    setEventsError(null)
    try {
      const params = new URLSearchParams()
      if (selectedStaffId !== 'all') params.set('assignedTo', selectedStaffId)
      const res = await fetch(`${API_BASE}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to load events')
      }
      const data = await res.json()
      setEvents(data.events || [])
    } catch (e) {
      setEventsError(e instanceof Error ? e.message : 'Failed to load events')
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }, [token, selectedStaffId])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Fetch staff members for admin (assign-to and filter dropdowns)
  // Only includes ADMIN and STAFF roles, excludes DEALER, FRANCHISEE, and CUSTOMER
  const fetchStaffMembers = useCallback(async () => {
    if (!token || user?.role !== 'ADMIN') {
      setStaffMembers([])
      return
    }
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      const list = (data.users || [])
        .filter((u: { role?: string }) => u.role === 'ADMIN' || u.role === 'STAFF')
        .map((u: { id?: string; _id?: string; name?: string; firstName?: string; lastName?: string; email?: string; role?: string }) => ({
          id: u.id || u._id || '',
          name: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unknown',
          email: u.email,
        }))
        .filter((m: StaffMember) => m.id)
      setStaffMembers(list)
    } catch {
      setStaffMembers([])
    }
  }, [token, user?.role])

  useEffect(() => {
    fetchStaffMembers()
  }, [fetchStaffMembers])

  // Filter events based on admin view toggle, staff selection, and event type
  const filteredEvents = useMemo(() => {
    let filtered = events

    // Filter by staff - only if user has permission or is admin
    const isAdmin = user?.role === 'ADMIN'
    const currentUserId = user?._id ?? MOCK_USER.id
    if (isAdmin && !showAllEvents) {
      // For admin viewing only their events
      filtered = filtered.filter(event => event.assignedTo === currentUserId)
    } else if (isAdmin && showAllEvents && selectedStaffId !== 'all') {
      // For admin filtering by specific staff
      filtered = filtered.filter(event => event.assignedTo === selectedStaffId)
    } else if (!isAdmin) {
      // For non-admin users, only show their own events
      filtered = filtered.filter(event => event.assignedTo === currentUserId)
    }

    // Filter by event type
    if (selectedEventType !== 'all') {
      filtered = filtered.filter(event => event.type === selectedEventType)
    }

    return filtered
  }, [events, showAllEvents, selectedStaffId, selectedEventType, user])

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsDetailsModalOpen(true)
  }

  const handleDateSelect = (start: Date) => {
    setSelectedDate(start)
    setIsCreateModalOpen(true)
  }

  const handleDayClick = (date: Date, dayEvents: CalendarEvent[]) => {
    setDayPanelDate(date)
    setDayPanelEvents(dayEvents)
  }

  const handleAddEvent = async (newEvent: CalendarEvent) => {
    if (!token) return
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEvent),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create event')
      }
      const data = await res.json()
      setEvents(prev => [...prev, data.event])
      setIsCreateModalOpen(false)
      setEditingEvent(null)
    } catch (e) {
      console.error('Create event error:', e)
      setEventsError(e instanceof Error ? e.message : 'Failed to create event')
    }
  }

  const handleEditEvent = async (updatedEvent: CalendarEvent) => {
    if (!token || !updatedEvent.id) return
    try {
      const res = await fetch(`${API_BASE}/${updatedEvent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedEvent),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update event')
      }
      const data = await res.json()
      setEvents(prev => prev.map(e => (e.id === updatedEvent.id ? data.event : e)))
      setIsCreateModalOpen(false)
      setEditingEvent(null)
      setIsDetailsModalOpen(false)
      setSelectedEvent(null)
    } catch (e) {
      console.error('Update event error:', e)
      setEventsError(e instanceof Error ? e.message : 'Failed to update event')
    }
  }

  const handleEditClick = (event: CalendarEvent) => {
    setEditingEvent(event)
    setIsDetailsModalOpen(false)
    setIsCreateModalOpen(true)
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete event')
      }
      setEvents(prev => prev.filter(e => e.id !== eventId))
      setIsDetailsModalOpen(false)
      setSelectedEvent(null)
    } catch (e) {
      console.error('Delete event error:', e)
      setEventsError(e instanceof Error ? e.message : 'Failed to delete event')
    }
  }

  const handleConfirmEvent = async (eventId: string) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'Confirmed' }),
      })
      if (!res.ok) return
      const data = await res.json()
      setEvents(prev => prev.map(e => (e.id === eventId ? data.event : e)))
    } catch (e) {
      console.error('Confirm event error:', e)
    }
  }

  const handleEventUpdate = async (eventId: string, newStart: string, newEnd: string) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ start: newStart, end: newEnd }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update event')
      }
      const data = await res.json()
      setEvents(prev => prev.map(e => (e.id === eventId ? data.event : e)))
    } catch (e) {
      console.error('Update event error:', e)
      setEventsError(e instanceof Error ? e.message : 'Failed to update event')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Calendar</h1>
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-0.5 gap-0.5">
            <button
              onClick={() => setCalendarViewMode('team')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                calendarViewMode === 'team'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Team
            </button>
            <button
              onClick={() => setCalendarViewMode('calendar')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                calendarViewMode === 'calendar'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          {/* Microsoft Calendar Sync Toggle */}
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <Switch
                id="microsoft-sync"
                checked={microsoftSyncEnabled}
                disabled
              />
              <Label htmlFor="microsoft-sync" className="text-sm font-medium cursor-pointer text-gray-900 dark:text-white">
                <span className="hidden sm:inline">Sync with Microsoft Calendar</span>
                <span className="sm:hidden">MS Calendar Sync</span>
              </Label>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {microsoftSyncEnabled ? (
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700">
                      Syncing to Outlook
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                      Not connected
                    </Badge>
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {microsoftSyncEnabled
                      ? `Appointments automatically sync to ${microsoftSyncEmail}`
                      : 'Microsoft Calendar sync is not configured.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Add Appointment Button - Only show if user has edit or full access */}
          {canAddAppointments && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Appointment
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap sm:gap-4">
        {/* Admin Filters - Only show if user has edit or full access */}
        {user?.role === 'ADMIN' && canFilterByStaff && (
          <>
            {/* All Events Toggle */}
            <div className="flex items-center gap-3 px-3 py-2 sm:px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <Switch
                id="show-all-events"
                checked={showAllEvents}
                onCheckedChange={(checked) => {
                  setShowAllEvents(checked)
                  if (checked) {
                    setSelectedStaffId('all') // Reset staff filter when showing all
                  }
                }}
              />
              <Label htmlFor="show-all-events" className="text-sm font-medium cursor-pointer text-gray-900 dark:text-white">
                {showAllEvents ? 'All Events' : 'Only My Events'}
              </Label>
            </div>

            {/* Staff Filter Dropdown - Only show when viewing all events */}
            {showAllEvents && (
              <div className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <Label htmlFor="staff-filter" className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  Filter by Staff:
                </Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger id="staff-filter" className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {(staffMembers.length ? staffMembers : MOCK_TEAM_MEMBERS).map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        {/* Event Type Filter */}
        <div className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Label htmlFor="event-type-filter" className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
            Event Type:
          </Label>
          <Select value={selectedEventType} onValueChange={setSelectedEventType}>
            <SelectTrigger id="event-type-filter" className="w-full sm:w-[220px]">
              <SelectValue placeholder="All Event Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Event Types</SelectItem>
              {Object.entries(EVENT_TYPES).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar View */}
      {eventsError && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
          {eventsError}
        </div>
      )}
      {eventsLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading events...
        </div>
      ) : calendarViewMode === 'team' ? (
        <TeamWeekView
          events={filteredEvents}
          staffMembers={staffMembers}
          currentUserId={user?._id ?? ''}
          onEventClick={handleEventClick}
          onCellClick={(date, staffId) => {
            setSelectedDate(date)
            setIsCreateModalOpen(true)
            // Pre-select the staff member by storing it (handled inside AddAppointmentModal via defaultAssignedTo)
            void staffId
          }}
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-2 sm:p-6">
              <CalendarView
                events={filteredEvents}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                onEventUpdate={canEditEvents ? handleEventUpdate : undefined}
                onDayClick={handleDayClick}
              />
            </CardContent>
          </Card>

          {/* Day events panel — appears below calendar when a date is clicked */}
          {dayPanelDate && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {dayPanelDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground">{dayPanelEvents.length} event{dayPanelEvents.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => setDayPanelDate(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {dayPanelEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No events on this day. <button onClick={() => { setSelectedDate(dayPanelDate); setIsCreateModalOpen(true) }} className="text-amber-600 hover:underline">Add one?</button></p>
                ) : (
                  <div className="space-y-2">
                    {dayPanelEvents
                      .slice()
                      .sort((a, b) => a.start.localeCompare(b.start))
                      .map(ev => {
                        const startTime = ev.start.slice(11, 16)
                        const h = parseInt(startTime)
                        const timeStr = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${startTime.slice(3)} ${h >= 12 ? 'PM' : 'AM'}`
                        const statusColor = ev.status === 'Confirmed' ? 'bg-green-500' : ev.status === 'Pending Approval' ? 'bg-amber-400' : 'bg-blue-500'
                        return (
                          <button key={ev.id} onClick={() => { handleEventClick(ev); setDayPanelDate(null) }}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left">
                            <div className={`h-2 w-2 rounded-full shrink-0 ${statusColor}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ev.title}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{timeStr}</span>
                                {ev.status && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  ev.status === 'Confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  ev.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>{ev.status}</span>}
                              </div>
                            </div>
                          </button>
                        )
                      })
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add/Edit Appointment Modal */}
      <AddAppointmentModal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open)
          if (!open) setEditingEvent(null)
        }}
        initialDate={selectedDate}
        onSave={editingEvent ? handleEditEvent : handleAddEvent}
        defaultAssignedTo={user?._id}
        teamMembers={staffMembers.length ? staffMembers : undefined}
        isAdmin={user?.role === 'ADMIN'}
        editingEvent={editingEvent}
        dayEvents={events.filter(ev => {
          const d = new Date(ev.start)
          return d.toDateString() === selectedDate.toDateString()
        })}
      />

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          onDelete={handleDeleteEvent}
          onEdit={canEditEvents ? handleEditClick : undefined}
          onConfirm={canEditEvents ? handleConfirmEvent : undefined}
          canEdit={canEditEvents}
          canDelete={canDeleteEvents}
        />
      )}
    </div>
  )
}
