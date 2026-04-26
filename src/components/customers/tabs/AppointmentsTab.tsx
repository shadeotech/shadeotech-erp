'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Clock, MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

interface Appointment {
  id: string
  title: string
  type: string
  startDateTime: Date
  endDateTime: Date
  location?: string
}

const typeColors: Record<string, string> = {
  CONSULTATION: 'bg-blue-500',
  INSTALLATION: 'bg-green-500',
  DELIVERY: 'bg-purple-500',
  FOLLOW_UP: 'bg-yellow-500',
}

interface AppointmentsTabProps {
  customerId: string
}

export function AppointmentsTab({ customerId }: AppointmentsTabProps) {
  const { token } = useAuthStore()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAppointments = useCallback(async () => {
    if (!token || !customerId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/calendar/events?customerId=${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const events = data.events || data || []
        setAppointments(events.map((e: any) => ({
          id: e.id || e._id,
          title: e.title,
          type: e.type || 'APPOINTMENT',
          startDateTime: new Date(e.start),
          endDateTime: new Date(e.end),
          location: e.location,
        })))
      } else {
        setAppointments([])
      }
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [token, customerId])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const now = new Date()
  const upcoming = appointments.filter(a => new Date(a.startDateTime) > now)
  const past = appointments.filter(a => new Date(a.startDateTime) <= now)

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Appointments ({appointments.length})</h3>
        <Link href={`/calendar?customerId=${customerId}`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Schedule
          </Button>
        </Link>
      </div>

      {/* Upcoming Appointments */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Upcoming</p>
          {upcoming.map((apt) => (
            <div
              key={apt.id}
              className="flex gap-4 rounded-lg border p-4"
            >
              <div className={cn('h-2 w-2 mt-2 rounded-full', typeColors[apt.type] || 'bg-gray-500')} />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{apt.title}</p>
                    <Badge variant="outline" className="mt-1">
                      {(apt.type || '').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {apt.startDateTime.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatTime(apt.startDateTime)} - {formatTime(apt.endDateTime)}
                  </div>
                  {apt.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {apt.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past Appointments */}
      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Past</p>
          {past.map((apt) => (
            <div
              key={apt.id}
              className="flex gap-4 rounded-lg border p-4 opacity-60"
            >
              <div className={cn('h-2 w-2 mt-2 rounded-full', typeColors[apt.type] || 'bg-gray-500')} />
              <div className="flex-1">
                <p className="font-medium">{apt.title}</p>
                <p className="text-sm text-muted-foreground">
                  {apt.startDateTime.toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {appointments.length === 0 && (
        <div className="py-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">No appointments scheduled</p>
          <Link href={`/calendar?customerId=${customerId}`}>
            <Button variant="outline" className="mt-4">
              Schedule Appointment
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

