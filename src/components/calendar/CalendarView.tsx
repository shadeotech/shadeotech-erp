'use client'

import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventClickArg, DateSelectArg } from '@fullcalendar/core'

interface CalendarEvent {
  id: string
  title: string
  start: Date | string
  end: Date | string
  allDay?: boolean
  backgroundColor?: string
  borderColor?: string
  extendedProps?: {
    type: string
    customer?: string
    location?: string
  }
}

// Mock events
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Consultation - John Smith',
    start: new Date().toISOString().split('T')[0] + 'T10:00:00',
    end: new Date().toISOString().split('T')[0] + 'T11:30:00',
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    extendedProps: {
      type: 'CONSULTATION',
      customer: 'John Smith',
      location: '123 Main St',
    },
  },
  {
    id: '2',
    title: 'Installation - ABC Corp',
    start: new Date().toISOString().split('T')[0] + 'T14:00:00',
    end: new Date().toISOString().split('T')[0] + 'T17:00:00',
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
    extendedProps: {
      type: 'INSTALLATION',
      customer: 'ABC Corp',
      location: '456 Business Ave',
    },
  },
  {
    id: '3',
    title: 'Follow-up Call - Jane Doe',
    start: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T09:00:00',
    end: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T09:30:00',
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
    extendedProps: {
      type: 'FOLLOW_UP',
      customer: 'Jane Doe',
    },
  },
  {
    id: '4',
    title: 'Delivery - XYZ Inc',
    start: new Date(Date.now() + 172800000).toISOString().split('T')[0] + 'T13:00:00',
    end: new Date(Date.now() + 172800000).toISOString().split('T')[0] + 'T15:00:00',
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
    extendedProps: {
      type: 'DELIVERY',
      customer: 'XYZ Inc',
      location: '789 Industrial Blvd',
    },
  },
]

interface CalendarViewProps {
  onEventClick?: (event: CalendarEvent) => void
  onDateSelect?: (start: Date, end: Date) => void
}

export function CalendarView({ onEventClick, onDateSelect }: CalendarViewProps) {
  const [events] = useState<CalendarEvent[]>(mockEvents)

  const handleEventClick = (info: EventClickArg) => {
    const event: CalendarEvent = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start!,
      end: info.event.end || info.event.start!,
      allDay: info.event.allDay,
      extendedProps: info.event.extendedProps as CalendarEvent['extendedProps'],
    }
    onEventClick?.(event)
  }

  const handleDateSelect = (info: DateSelectArg) => {
    onDateSelect?.(info.start, info.end)
  }

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        eventClick={handleEventClick}
        selectable={true}
        select={handleDateSelect}
        editable={true}
        dayMaxEvents={3}
        height="auto"
        nowIndicator={true}
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short',
        }}
      />
    </div>
  )
}

