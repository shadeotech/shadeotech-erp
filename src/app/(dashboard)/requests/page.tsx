'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  RefreshCw,
} from 'lucide-react'

interface AppointmentRequest {
  id: string
  title: string
  start: string
  end: string
  status: string
  type: string
  location?: string
  notes?: string
  productsOfInterest?: string[]
}

const TYPE_LABELS: Record<string, string> = {
  CONSULTATION_IN_HOME: 'In-Home Consultation',
  CONSULTATION_VIRTUAL: 'Virtual Consultation',
  CONSULTATION_SHOWROOM: 'Showroom Visit',
  SERVICE_CALL: 'Service Call',
  FINAL_MEASUREMENT: 'Final Measurement',
  INSTALLATION: 'Installation',
  OTHER: 'Other',
}

const TYPE_ICONS: Record<string, string> = {
  CONSULTATION_IN_HOME: '🏠',
  CONSULTATION_VIRTUAL: '💻',
  CONSULTATION_SHOWROOM: '🪟',
  SERVICE_CALL: '🔧',
  FINAL_MEASUREMENT: '📐',
  INSTALLATION: '🔩',
  OTHER: '📋',
}

function parseNote(notes: string | undefined, key: string): string {
  if (!notes) return ''
  const lines = notes.split('\n')
  const line = lines.find(l => l.toLowerCase().startsWith(key.toLowerCase() + ':'))
  return line ? line.slice(key.length + 1).trim() : ''
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  }
}

export default function RequestsPage() {
  const { token } = useAuthStore()
  const [requests, setRequests] = useState<AppointmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    if (!token) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/calendar/events?status=Pending+Approval', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load requests')
      const data = await res.json()
      setRequests(data.events || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  async function updateStatus(id: string, status: 'Confirmed' | 'Cancelled') {
    if (!token) return
    setActionLoading(id)
    try {
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Update failed')
      setRequests(prev => prev.filter(r => r.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Appointment Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Booking submissions awaiting your approval</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading requests…
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-400 opacity-60" />
            <p className="font-medium text-gray-700 dark:text-gray-300">All caught up!</p>
            <p className="text-sm mt-1">No pending appointment requests.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {requests.map(req => {
            const { date, time } = formatDateTime(req.start)
            const customerName = parseNote(req.notes, 'Customer') || req.title
            const customerEmail = parseNote(req.notes, 'Email')
            const customerPhone = parseNote(req.notes, 'Phone')
            const address = parseNote(req.notes, 'Address')
            const requestedTime = parseNote(req.notes, 'Requested Time')
            const isActing = actionLoading === req.id
            const icon = TYPE_ICONS[req.type] || '📋'

            return (
              <Card key={req.id} className="flex flex-col">
                <CardContent className="p-5 flex flex-col gap-4 flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl">{icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{customerName}</p>
                        <p className="text-xs text-muted-foreground">{TYPE_LABELS[req.type] || req.type}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 shrink-0">
                      Pending
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{requestedTime || time} — 1-hr arrival window</span>
                    </div>
                    {address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{address}</span>
                      </div>
                    )}
                    {customerEmail && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <a href={`mailto:${customerEmail}`} className="hover:text-foreground truncate">{customerEmail}</a>
                      </div>
                    )}
                    {customerPhone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <a href={`tel:${customerPhone}`} className="hover:text-foreground">{customerPhone}</a>
                      </div>
                    )}
                    {req.productsOfInterest && req.productsOfInterest.length > 0 && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Package className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="text-xs">{req.productsOfInterest.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => updateStatus(req.id, 'Confirmed')}
                      disabled={isActing}
                    >
                      {isActing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Confirm</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                      onClick={() => updateStatus(req.id, 'Cancelled')}
                      disabled={isActing}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
