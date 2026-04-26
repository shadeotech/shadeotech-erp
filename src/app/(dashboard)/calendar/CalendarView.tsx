'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventClickArg, DateSelectArg, EventDropArg, EventChangeArg, EventContentArg } from '@fullcalendar/core'
import { DateClickArg } from '@fullcalendar/interaction'
import { CalendarEvent } from './mockCalendarEvents'
import { getEventColor as getColor, getEventBorderColor } from './utils'
import { EVENT_TYPES } from './constants'

// Icon per event type
const EVENT_ICONS: Record<string, string> = {
  CONSULTATION_IN_HOME: '🏠',
  CONSULTATION_VIRTUAL: '💻',
  CONSULTATION_SHOWROOM: '🪟',
  SERVICE_CALL: '🔧',
  FINAL_MEASUREMENT: '📐',
  INSTALLATION: '🔩',
  OTHER: '📋',
}

interface CalendarViewProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onDateSelect: (date: Date) => void
  onEventUpdate?: (eventId: string, newStart: string, newEnd: string) => void
  onDayClick?: (date: Date, dayEvents: CalendarEvent[]) => void
}

export function CalendarView({ events, onEventClick, onDateSelect, onEventUpdate, onDayClick }: CalendarViewProps) {
  const [isMobile, setIsMobile] = useState(false)
  const calendarRef = useRef<FullCalendar>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      calendarRef.current?.getApi().updateSize()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const getEffectiveColor = (event: CalendarEvent): string => {
    if (event.status === 'Pending Approval') return '#F59E0B'
    if (event.status === 'Confirmed') return '#10B981'
    return getColor(event.type)
  }

  const getEffectiveBorderColor = (event: CalendarEvent): string => {
    if (event.status === 'Pending Approval') return '#B45309'
    if (event.status === 'Confirmed') return '#047857'
    return getEventBorderColor(event.type)
  }

  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: 'inherit',
      classNames: ['calendar-event-wrapper'],
      display: 'block',
      allDay: false,
      extendedProps: { ...event },
    }))
  }, [events]) // eslint-disable-line react-hooks/exhaustive-deps

  const renderEventContent = (arg: EventContentArg) => {
    const event = arg.event.extendedProps as CalendarEvent
    const icon = EVENT_ICONS[event.type] || '📋'
    const isPending = event.status === 'Pending Approval'
    const isTimeGrid = arg.view.type.startsWith('timeGrid')
    const color = getEffectiveColor(event)
    const borderColor = getEffectiveBorderColor(event)
    const typeLabel = EVENT_TYPES[event.type]?.label || ''
    // Title format is "Type Label – Customer Name"; extract customer name
    const titleParts = arg.event.title.split(' – ')
    const customerName = titleParts.length > 1 ? titleParts[1] : titleParts[0]

    if (isTimeGrid) {
      return (
        <div
          className="w-full h-full rounded px-1.5 py-1 overflow-hidden flex flex-col gap-0.5"
          style={{
            backgroundColor: color,
            borderLeft: `3px solid ${borderColor}`,
            borderTop: isPending ? `2px dashed ${borderColor}` : undefined,
          }}
        >
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[11px] leading-none shrink-0">{icon}</span>
            <span className="text-[11px] font-semibold text-white truncate leading-tight">{customerName}</span>
          </div>
          <span className="text-[10px] text-white/70 leading-none truncate">{typeLabel}</span>
          <span className="text-[10px] text-white/80 leading-none">{arg.timeText}</span>
        </div>
      )
    }

    // Month / day grid — Trello-style: white card with narrow colored bar at top
    return (
      <div
        className="w-full rounded-md bg-white dark:bg-gray-800 overflow-hidden"
        style={{
          border: `1px solid ${isPending ? borderColor : '#e5e7eb'}`,
          borderStyle: isPending ? 'dashed' : 'solid',
          boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <div className="px-1.5 pt-1.5">
          <div className="flex gap-1">
            <div className="h-[4px] w-9 rounded-sm shrink-0" style={{ backgroundColor: color }} />
          </div>
        </div>
        <div className="px-1.5 pb-1.5 pt-1">
          <p className="text-[11px] font-medium text-gray-800 dark:text-gray-100 leading-tight truncate">
            {icon} {customerName}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight truncate">{typeLabel}</p>
          {arg.timeText && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">{arg.timeText}</p>
          )}
        </div>
      </div>
    )
  }

  const handleEventClick = (info: EventClickArg) => {
    const eventData = info.event.extendedProps as CalendarEvent
    onEventClick(eventData)
  }

  const handleDateSelect = (info: DateSelectArg) => {
    onDateSelect(info.start)
  }

  const handleDateClick = (info: DateClickArg) => {
    if (onDayClick) {
      const clickedDate = info.dateStr.slice(0, 10)
      const dayEvts = events.filter(e => e.start.startsWith(clickedDate))
      onDayClick(info.date, dayEvts)
    }
  }

  const handleEventDrop = (info: EventDropArg) => {
    if (onEventUpdate) {
      const eventData = info.event.extendedProps as CalendarEvent
      onEventUpdate(eventData.id, info.event.startStr, info.event.endStr || info.event.startStr)
    }
  }

  const handleEventResize = (info: EventChangeArg) => {
    if (onEventUpdate) {
      const eventData = info.event.extendedProps as CalendarEvent
      onEventUpdate(eventData.id, info.event.startStr, info.event.endStr || info.event.startStr)
    }
  }

  return (
    <div ref={containerRef} className="calendar-container">
      <FullCalendar
        ref={calendarRef}
        key={isMobile ? 'mobile' : 'desktop'}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={isMobile ? 'timeGridDay' : 'dayGridMonth'}
        headerToolbar={
          isMobile
            ? { left: 'prev,next', center: 'title', right: 'today' }
            : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }
        }
        footerToolbar={isMobile ? { center: 'dayGridMonth,timeGridWeek,timeGridDay' } : undefined}
        dayHeaderFormat={isMobile ? { weekday: 'narrow' } : { weekday: 'short' }}
        events={calendarEvents}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        selectable={true}
        select={handleDateSelect}
        dateClick={handleDateClick}
        editable={!isMobile}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        dayMaxEvents={isMobile ? 2 : 5}
        moreLinkClick="popover"
        height="auto"
        nowIndicator={true}
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short',
        }}
        eventDisplay="block"
        dayCellClassNames="calendar-day-cell"
      />
    </div>
  )
}
