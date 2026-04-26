'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarEvent } from './mockCalendarEvents'
import { getEventColor } from './utils'
import type { StaffMember } from './page'

interface TeamWeekViewProps {
  events: CalendarEvent[]
  staffMembers: StaffMember[]
  currentUserId: string
  onEventClick: (event: CalendarEvent) => void
  onCellClick: (date: Date, staffId: string) => void
}

const STAFF_COLORS = [
  '#c8864e', '#6366F1', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899',
]

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getWeekDays(baseDate: Date): Date[] {
  const start = new Date(baseDate)
  // Start from Monday
  const dow = start.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  start.setDate(start.getDate() + diff)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function TeamWeekView({
  events,
  staffMembers,
  currentUserId,
  onEventClick,
  onCellClick,
}: TeamWeekViewProps) {
  const [weekOffset, setWeekOffset] = useState(0)

  const today = new Date()
  const baseDate = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate])

  const weekStart = weekDays[0]
  const weekEnd = weekDays[6]
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  // Build a lookup: staffId → day index → events
  const eventGrid = useMemo(() => {
    const grid: Record<string, Record<number, CalendarEvent[]>> = {}

    const allStaff = staffMembers.length > 0 ? staffMembers : [{ id: currentUserId, name: 'Me' }]
    allStaff.forEach((s) => {
      grid[s.id] = {}
      weekDays.forEach((_, i) => { grid[s.id][i] = [] })
    })

    events.forEach((evt) => {
      const evtDate = new Date(evt.start)
      const dayIdx = weekDays.findIndex((d) => isSameDay(d, evtDate))
      if (dayIdx < 0) return
      const staffId = evt.assignedTo
      if (!grid[staffId]) {
        grid[staffId] = {}
        weekDays.forEach((_, i) => { grid[staffId][i] = [] })
      }
      grid[staffId][dayIdx].push(evt)
    })

    return grid
  }, [events, staffMembers, weekDays, currentUserId])

  const displayStaff = staffMembers.length > 0
    ? staffMembers
    : [{ id: currentUserId, name: 'My Events' }]

  return (
    <div className="space-y-3">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 ml-1">{weekLabel}</span>
        </div>
        {weekOffset !== 0 && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/60">
              {/* Staff column header */}
              <th className="w-36 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 sticky left-0 bg-gray-50 dark:bg-gray-800/60 z-10">
                Consultant
              </th>
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, today)
                return (
                  <th
                    key={i}
                    className={`px-2 py-2.5 text-center text-xs font-semibold border-b border-gray-200 dark:border-gray-700 min-w-[100px] ${
                      isToday
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <div>{DAY_ABBR[day.getDay()]}</div>
                    <div className={`text-sm mt-0.5 ${
                      isToday
                        ? 'h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto font-bold'
                        : 'font-medium text-gray-900 dark:text-white'
                    }`}>
                      {day.getDate()}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {displayStaff.map((staff, si) => {
              const color = STAFF_COLORS[si % STAFF_COLORS.length]
              return (
                <tr key={staff.id} className="group border-b border-gray-100 dark:border-gray-800 last:border-0">
                  {/* Staff name */}
                  <td className="px-3 py-3 sticky left-0 bg-white dark:bg-[#111] group-hover:bg-gray-50 dark:group-hover:bg-gray-900 z-10 border-r border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate max-w-[80px]" title={staff.name}>
                        {staff.name.split(' ')[0]}
                      </span>
                    </div>
                  </td>

                  {/* Day cells */}
                  {weekDays.map((day, di) => {
                    const cellEvents = (eventGrid[staff.id]?.[di] ?? []).sort(
                      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
                    )
                    const isToday = isSameDay(day, today)
                    const isPast = day < today && !isToday

                    return (
                      <td
                        key={di}
                        className={`px-1.5 py-1.5 align-top cursor-pointer border-r border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors min-h-[64px] ${
                          isToday ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''
                        } ${isPast ? 'opacity-60' : ''}`}
                        onClick={() => onCellClick(day, staff.id)}
                      >
                        <div className="space-y-1 min-h-[52px]">
                          {cellEvents.length === 0 && (
                            <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity pt-2">
                              <Plus className="h-3 w-3 text-gray-400" />
                            </div>
                          )}
                          {cellEvents.slice(0, 3).map((evt) => (
                            <button
                              key={evt.id}
                              onClick={(e) => { e.stopPropagation(); onEventClick(evt) }}
                              className="w-full text-left rounded px-1.5 py-1 text-[10px] leading-tight hover:brightness-95 transition-all"
                              style={{
                                backgroundColor: getEventColor(evt.type),
                                borderLeft: `2.5px solid ${color}`,
                              }}
                            >
                              <div className="font-semibold text-gray-800 truncate">{fmtTime(evt.start)}</div>
                              <div className="text-gray-600 truncate">{evt.title}</div>
                            </button>
                          ))}
                          {cellEvents.length > 3 && (
                            <p className="text-[10px] text-muted-foreground pl-1">+{cellEvents.length - 3} more</p>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
