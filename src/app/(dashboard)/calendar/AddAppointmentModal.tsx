'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { mockCustomers } from './mockCustomers'
import { mockPartners } from './mockPartners'
import {
  LEAD_SOURCES,
  EVENT_TYPES,
  type EventType,
  MOCK_USER,
  MOCK_TEAM_MEMBERS,
  APPOINTMENT_STATUSES,
  type AppointmentStatus
} from './constants'
import { AddressAutocomplete, type AddressSelection } from '@/components/shared/AddressAutocomplete'
import { sanitizePhoneInput, validatePhone } from '@/lib/phoneValidation'
import { useCommuteTime } from '@/hooks/useCommuteTime'
import { useAuthStore } from '@/stores/authStore'
import { Search, ChevronDown } from 'lucide-react'

export type TeamMemberOption = { id: string; name: string; email?: string }
import { generateSideMark, formatDateTimeForCalendar, parseCalendarDateTime } from './utils'
import type { CalendarEvent } from './mockCalendarEvents'

/** Customer pre-selected when opening from e.g. customers list (Book Appointment) */
export interface PreselectedCustomer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  sideMark?: string
  taxExempt?: boolean
}

interface AddAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: Date
  onSave: (event: CalendarEvent) => void
  /** When provided (e.g. current user _id), used as default assignedTo so STAFF see their events */
  defaultAssignedTo?: string
  /** Real staff from API; when provided, "Assign to team member" uses these instead of mock data */
  teamMembers?: TeamMemberOption[]
  /** When true, shows "Assign to team member" field (for admins) */
  isAdmin?: boolean
  /** When provided, the modal is in edit mode and will pre-populate with this event's data */
  editingEvent?: CalendarEvent | null
  /** When provided (e.g. from customers list Book Appt), form is pre-filled with this customer */
  preselectedCustomer?: PreselectedCustomer | null
  /** All events on the same day — used to compute commute origin from the previous appointment */
  dayEvents?: CalendarEvent[]
}

const INTERIOR_PRODUCTS = [
  'Roller Shades',
  'Zebra / Dual Shades',
  'Roman Shades',
  'Cellular / Honeycomb',
  'Wood Blinds',
  'Faux Wood Blinds',
  'Vertical Blinds',
  'Shutters',
  'Drapes & Curtains',
  'Motorization',
]

const EXTERIOR_PRODUCTS = [
  'Exterior / Solar Screens',
  'Exterior Roller Shades',
]

const ALL_PRODUCTS = [...INTERIOR_PRODUCTS, ...EXTERIOR_PRODUCTS]

function isExteriorProduct(p: string) {
  return EXTERIOR_PRODUCTS.includes(p)
}

interface RealCustomer {
  id: string
  name: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  sideMark?: string
  taxExempt?: boolean
}

export function AddAppointmentModal({
  open,
  onOpenChange,
  initialDate = new Date(),
  onSave,
  defaultAssignedTo,
  teamMembers,
  isAdmin,
  editingEvent,
  preselectedCustomer,
  dayEvents,
}: AddAppointmentModalProps) {
  const isEditMode = !!editingEvent
  const { token } = useAuthStore()

  // Customer quick-search
  const [customerSearch, setCustomerSearch] = useState('')
  const [allCustomers, setAllCustomers] = useState<RealCustomer[]>([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showNameDropdown, setShowNameDropdown] = useState(false)

  const filteredCustomers = customerSearch.trim().length >= 2
    ? allCustomers.filter((c) => {
        const q = customerSearch.toLowerCase()
        return (
          c.name?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.email?.toLowerCase().includes(q)
        )
      }).slice(0, 8)
    : []

  // Product dropdown open state
  const [productDropdownOpen, setProductDropdownOpen] = useState(false)

  // Form state
  const [eventType, setEventType] = useState<EventType>('CONSULTATION_IN_HOME')
  const [otherTypeName, setOtherTypeName] = useState('')
  const [assignedTo, setAssignedTo] = useState<string>(defaultAssignedTo ?? MOCK_USER.id)
  const [status, setStatus] = useState<AppointmentStatus>('Scheduled')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  const nameFilteredCustomers = firstName.trim().length >= 2
    ? allCustomers.filter((c) => {
        const q = firstName.toLowerCase()
        return c.name?.toLowerCase().includes(q) || (c.firstName ?? '').toLowerCase().startsWith(q)
      }).slice(0, 6)
    : []
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | undefined>()
  const [address, setAddress] = useState('')
  // confirmedAddress is only set when the user selects a suggestion from the
  // Google Places dropdown. Commute runs against this, NOT against the raw
  // typed text, so partial strings like "123 M" never hit Distance Matrix.
  const [confirmedAddress, setConfirmedAddress] = useState('')
  const [lat, setLat] = useState<number | undefined>(undefined)
  const [lng, setLng] = useState<number | undefined>(undefined)
  // Commute time: auto-calculated from address, but can be manually overridden
  const [commuteHours, setCommuteHours] = useState<number>(0)
  const [commuteMinutes, setCommuteMinutes] = useState<number>(0)
  // Track whether commute was manually edited so we don't overwrite user's value
  const commuteManuallyEdited = useRef(false)
  const [date, setDate] = useState<Date>(initialDate)
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')
  const [leadSource, setLeadSource] = useState<string>('')
  const [referralName, setReferralName] = useState('')
  const [partnerReferralId, setPartnerReferralId] = useState('')
  const [sideMark, setSideMark] = useState('')
  const [productsOfInterest, setProductsOfInterest] = useState<string[]>([])
  const [numberOfWindows, setNumberOfWindows] = useState<number>(0)
  const [numberOfOpenings, setNumberOfOpenings] = useState<number>(0)
  const [isCompany, setIsCompany] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [notes, setNotes] = useState('')
  const [taxExempt, setTaxExempt] = useState(false)

  // CRM Lookup
  const [customerMatch, setCustomerMatch] = useState<typeof mockCustomers[0] | null>(null)

  // Company address from Settings → Address (origin for commute)
  const [companyAddress, setCompanyAddress] = useState<string | null>(null)
  useEffect(() => {
    if (open) {
      fetch('/api/settings/company')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.companyAddress === 'string') setCompanyAddress(data.companyAddress)
        })
        .catch(() => {})
    }
  }, [open])

  // Fetch real customers for quick search
  useEffect(() => {
    if (!open || !token) return
    fetch('/api/customers', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.customers) setAllCustomers(d.customers)
      })
      .catch(() => {})
  }, [open, token])

  const handleCustomerSelect = (c: RealCustomer) => {
    const nameParts = c.name?.trim().split(/\s+/) || []
    setFirstName(c.firstName || nameParts[0] || '')
    setLastName(c.lastName || nameParts.slice(1).join(' ') || '')
    setEmail(c.email || '')
    setPhone(c.phone || '')
    setAddress(c.address || '')
    setConfirmedAddress(c.address || '')
    if (c.sideMark) setSideMark(c.sideMark)
    if (c.taxExempt !== undefined) setTaxExempt(c.taxExempt)
    setCustomerSearch(c.name)
    setShowCustomerDropdown(false)
    setCustomerMatch({ id: c.id, firstName: c.firstName || '', lastName: c.lastName || '', email: c.email || '', phone: c.phone || '', address: c.address || '' })
  }

  // Commute origin: use the previous appointment's location if one exists earlier today,
  // otherwise fall back to the company address or the default office address.
  const OFFICE_ADDRESS = '3235 Skylane Dr Carrollton TX'
  const prevAppointmentOrigin = useMemo(() => {
    if (!dayEvents?.length) return null
    const [h, m] = startTime.split(':').map(Number)
    const startMinutes = h * 60 + m
    const before = dayEvents
      .filter(ev => {
        if (ev.id === (editingEvent?.id ?? '')) return false
        if (!ev.location || ev.location === 'Showroom') return false
        const d = new Date(ev.end)
        return d.toDateString() === date.toDateString() && (d.getHours() * 60 + d.getMinutes()) <= startMinutes
      })
      .sort((a, b) => b.end.localeCompare(a.end))
    return before[0]?.location ?? null
  }, [dayEvents, date, startTime, editingEvent?.id])

  const commuteOrigin = prevAppointmentOrigin || companyAddress || OFFICE_ADDRESS

  // Commute runs only against a confirmed (Places-selected) address — never
  // against raw typed text — to avoid Distance Matrix errors on partial strings.
  const shouldCalculateCommute = ['CONSULTATION_IN_HOME', 'SERVICE_CALL', 'FINAL_MEASUREMENT', 'INSTALLATION'].includes(eventType)
  const commute = useCommuteTime(shouldCalculateCommute ? confirmedAddress : '', commuteOrigin)

  // Auto-generate side mark when lead source changes
  useEffect(() => {
    if (leadSource) {
      const type = isCompany ? 'COMMERCIAL' : 'RESIDENTIAL'
      const newSideMark = generateSideMark(type, leadSource as any)
      setSideMark(newSideMark)
    }
  }, [leadSource, isCompany])

  // Set default commute time for showroom only
  useEffect(() => {
    if (eventType === 'CONSULTATION_SHOWROOM' && commuteHours === 0 && commuteMinutes === 0) {
      setCommuteMinutes(5)
    } else if (eventType !== 'CONSULTATION_SHOWROOM' && commuteHours === 0 && commuteMinutes === 5) {
      setCommuteMinutes(0)
    }
  }, [eventType, commuteHours, commuteMinutes])

  // Auto-populate commute fields when Google Directions returns a result
  useEffect(() => {
    if (commute.isLoading || commute.error || !commute.durationMinutes) return
    if (commuteManuallyEdited.current) return
    setCommuteHours(Math.floor(commute.durationMinutes / 60))
    setCommuteMinutes(commute.durationMinutes % 60)
  }, [commute.durationMinutes, commute.isLoading, commute.error])

  // When modal opens, sync assignedTo to current user so STAFF see their events
  // Or populate form with editingEvent data if in edit mode
  useEffect(() => {
    if (open) {
      if (editingEvent) {
        // Populate form with existing event data
        setEventType(editingEvent.type)
        setOtherTypeName(editingEvent.otherTypeName || '')
        setAssignedTo(editingEvent.assignedTo)
        setStatus((editingEvent.status || 'Scheduled') as AppointmentStatus)
        
        // Parse date and time from start/end
        const startDate = parseCalendarDateTime(editingEvent.start)
        const endDate = parseCalendarDateTime(editingEvent.end)
        setDate(startDate)
        setStartTime(startDate.toTimeString().slice(0, 5)) // HH:MM format
        setEndTime(endDate.toTimeString().slice(0, 5))
        
        // Parse commute time if exists
        if (editingEvent.commuteTime) {
          const commuteMatch = editingEvent.commuteTime.match(/(\d+)\s*(hour|hours|min|mins)/g)
          if (commuteMatch) {
            let hours = 0
            let minutes = 0
            commuteMatch.forEach(part => {
              const num = parseInt(part)
              if (part.includes('hour')) hours = num
              else if (part.includes('min')) minutes = num
            })
            setCommuteHours(hours)
            setCommuteMinutes(minutes)
          }
        }
        
        // Customer info — fetch from real API if customerId exists
        if (editingEvent.customerId && token) {
          fetch(`/api/customers/${editingEvent.customerId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              const c = data?.customer ?? data
              if (c && (c.firstName || c.lastName || c.email)) {
                const nameParts = (c.name || '').trim().split(/\s+/)
                const first = c.firstName || nameParts[0] || ''
                const last = c.lastName || nameParts.slice(1).join(' ') || ''
                setFirstName(first)
                setLastName(last)
                setEmail(c.email || '')
                setPhone(c.phone || '')
                setAddress(c.address || editingEvent.location || '')
                setConfirmedAddress(c.address || editingEvent.location || '')
                setSideMark((prev) => prev || c.sideMark || editingEvent.sideMark || '')
                if (c.taxExempt !== undefined) setTaxExempt(c.taxExempt)
                setCustomerMatch({
                  id: c._id || c.id,
                  firstName: first,
                  lastName: last,
                  email: c.email || '',
                  phone: c.phone || '',
                  address: c.address || '',
                  sideMark: c.sideMark,
                })
              }
            })
            .catch(() => {})
        } else {
          // No customerId — extract name from title (format: "Event Type – Name")
          const titleParts = editingEvent.title.split(' – ')
          if (titleParts.length > 1) {
            const name = titleParts[1]
            if (editingEvent.isCompany) {
              setCompanyName(name)
            } else {
              const nameParts = name.split(' ')
              setFirstName(nameParts[0] || '')
              setLastName(nameParts.slice(1).join(' ') || '')
            }
          }
          if (editingEvent.location && editingEvent.location !== 'Showroom') {
            setAddress(editingEvent.location)
            setConfirmedAddress(editingEvent.location)
          }
        }
        
        setLeadSource(editingEvent.leadSource || '')
        setReferralName(editingEvent.referralName || '')
        setPartnerReferralId(editingEvent.partnerReferralName || '')
        setSideMark(prev => prev || editingEvent.sideMark || '')
        setProductsOfInterest(editingEvent.productsOfInterest || [])
        setNumberOfWindows(editingEvent.numberOfWindows || 0)
        setNumberOfOpenings(editingEvent.numberOfOpenings || 0)
        setIsCompany(editingEvent.isCompany || false)
        setCompanyName(prev => prev || editingEvent.companyName || '')
        setWebsite(editingEvent.website || '')
        setNotes(editingEvent.notes || '')
        setTaxExempt(editingEvent.taxExempt === true)
      } else if (preselectedCustomer) {
        // Pre-fill from customers list (Book Appointment)
        const nameParts = preselectedCustomer.name.trim().split(/\s+/)
        const first = nameParts[0] || ''
        const last = nameParts.slice(1).join(' ') || ''
        setFirstName(first)
        setLastName(last)
        setEmail(preselectedCustomer.email || '')
        setPhone(preselectedCustomer.phone || '')
        setAddress(preselectedCustomer.address || '')
        setSideMark(preselectedCustomer.sideMark || '')
        setCustomerMatch({
          id: preselectedCustomer.id,
          firstName: first,
          lastName: last,
          email: preselectedCustomer.email || '',
          phone: preselectedCustomer.phone || '',
          address: preselectedCustomer.address || '',
          sideMark: preselectedCustomer.sideMark,
        })
        setTaxExempt(preselectedCustomer.taxExempt === true)
      } else {
        // Reset form for new event
        handleReset()
      }
    }
  }, [open, defaultAssignedTo, editingEvent, preselectedCustomer])

  // CRM Lookup on email or phone change (skip during initial edit mode population)
  const [isInitializing, setIsInitializing] = useState(false)
  
  useEffect(() => {
    if (open && editingEvent) {
      setIsInitializing(true)
      // Reset flag after a short delay to allow manual changes
      const timer = setTimeout(() => setIsInitializing(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [open, editingEvent])

  useEffect(() => {
    // Skip CRM lookup during initialization from editingEvent or when opened with preselectedCustomer
    if (isInitializing || preselectedCustomer) return

    if (email || phone) {
      const match = mockCustomers.find(
        c => c.email.toLowerCase() === email.toLowerCase() || c.phone === phone
      )
      if (match) {
        setCustomerMatch(match)
        setFirstName(match.firstName)
        setLastName(match.lastName)
        setEmail(match.email)
        setPhone(match.phone)
        setAddress(match.address)
        if (match.sideMark) {
          setSideMark(match.sideMark)
        }
      } else {
        setCustomerMatch(null)
      }
    }
  }, [email, phone, isInitializing, preselectedCustomer])

  // Reset form function
  const handleReset = () => {
    setEventType('CONSULTATION_IN_HOME')
    setOtherTypeName('')
    setAssignedTo(defaultAssignedTo ?? MOCK_USER.id)
    setStatus('Scheduled')
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setPhoneError(undefined)
    setAddress('')
    setConfirmedAddress('')
    setLat(undefined)
    setLng(undefined)
    setCommuteHours(0)
    setCommuteMinutes(0)
    commuteManuallyEdited.current = false
    setDate(initialDate)
    setStartTime('10:00')
    setEndTime('11:00')
    setLeadSource('')
    setReferralName('')
    setPartnerReferralId('')
    setSideMark('')
    setProductsOfInterest([])
    setNumberOfWindows(0)
    setNumberOfOpenings(0)
    setIsCompany(false)
    setCompanyName('')
    setWebsite('')
    setNotes('')
    setTaxExempt(false)
    setCustomerMatch(null)
    setCustomerSearch('')
    setProductDropdownOpen(false)
  }

  const handleAddressSelect = (sel: AddressSelection) => {
    setAddress(sel.fullAddress)
    setConfirmedAddress(sel.fullAddress)  // triggers commute calculation
    setLat(sel.lat)
    setLng(sel.lng)
    commuteManuallyEdited.current = false
  }

  const handleProductToggle = (product: string) => {
    setProductsOfInterest(prev =>
      prev.includes(product)
        ? prev.filter(p => p !== product)
        : [...prev, product]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const phoneErr = validatePhone(phone)
    if (phoneErr) {
      setPhoneError(phoneErr)
      return
    }
    setPhoneError(undefined)

    const startDateTime = formatDateTimeForCalendar(date, startTime)
    const endDateTime = formatDateTimeForCalendar(date, endTime)

    // Generate event title
    const eventLabel = eventType === 'OTHER' && otherTypeName 
      ? otherTypeName 
      : EVENT_TYPES[eventType].label

    // Format commute time from hours and minutes
    let commuteTimeFormatted: string | undefined = undefined
    if (commuteHours > 0 || commuteMinutes > 0) {
      const parts: string[] = []
      if (commuteHours > 0) {
        parts.push(`${commuteHours} ${commuteHours === 1 ? 'hour' : 'hours'}`)
      }
      if (commuteMinutes > 0) {
        parts.push(`${commuteMinutes} ${commuteMinutes === 1 ? 'min' : 'mins'}`)
      }
      commuteTimeFormatted = parts.join(' ')
    }

    const newEvent: CalendarEvent = {
      id: isEditMode && editingEvent ? editingEvent.id : `evt_${Date.now()}`,
      title: `${eventLabel} – ${isCompany ? companyName : `${firstName} ${lastName}`}`,
      start: startDateTime,
      end: endDateTime,
      type: eventType,
      assignedTo: assignedTo,
      status: status,
      otherTypeName: eventType === 'OTHER' ? otherTypeName : undefined,
      customerId: customerMatch?.id,
      location: eventType === 'CONSULTATION_SHOWROOM' ? 'Showroom' : address,
      leadSource: leadSource as any,
      referralName: leadSource === 'Referral' ? referralName : undefined,
      partnerReferralName: leadSource === 'Partner Referral' ? partnerReferralId : undefined,
      sideMark,
      productsOfInterest: productsOfInterest.length > 0 ? productsOfInterest : undefined,
      numberOfWindows: numberOfWindows > 0 ? numberOfWindows : undefined,
      numberOfOpenings: numberOfOpenings > 0 ? numberOfOpenings : undefined,
      isCompany,
      companyName: isCompany ? companyName : undefined,
      website: isCompany ? website : undefined,
      commuteTime: commuteTimeFormatted,
      commuteDistance: commute.distanceText || undefined,
      notes: notes || undefined,
      taxExempt: taxExempt || undefined,
      lat: lat,
      lng: lng,
    }

    onSave(newEvent)
    if (!isEditMode) {
      handleReset()
    }
  }

  const handleClose = () => {
    if (!isEditMode) {
      handleReset()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Appointment' : 'Add Appointment'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the appointment details below.'
              : 'Create a new consultation appointment. The system will check if the customer already exists.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Quick Customer Search ──────────────────────────────── */}
          <div className="relative space-y-1">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search Customer</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true) }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Type name, phone, or email…"
                className="pl-9 h-10 text-sm font-medium"
                autoComplete="off"
              />
              {customerMatch && !showCustomerDropdown && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Found</span>
              )}
            </div>
            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                    onClick={() => handleCustomerSelect(c)}
                  >
                    <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        {(c.name || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.phone || c.email || ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showCustomerDropdown && customerSearch.trim().length >= 2 && filteredCustomers.length === 0 && (
              <p className="text-xs text-muted-foreground pl-1">No matches — fill details below as new customer</p>
            )}
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label>Event Type *</Label>
            <Select value={eventType} onValueChange={(v) => {
              setEventType(v as EventType)
              if (v !== 'OTHER') {
                setOtherTypeName('')
              }
            }} required>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONSULTATION_IN_HOME">In-Home Consultation</SelectItem>
                <SelectItem value="CONSULTATION_VIRTUAL">Virtual Consultation</SelectItem>
                <SelectItem value="CONSULTATION_SHOWROOM">Showroom Consultation</SelectItem>
                <SelectItem value="SERVICE_CALL">Service Call</SelectItem>
                <SelectItem value="FINAL_MEASUREMENT">Final Measurement</SelectItem>
                <SelectItem value="INSTALLATION">Installation</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Show text input when "Other" is selected */}
            {eventType === 'OTHER' && (
              <div className="mt-2">
                <Input
                  value={otherTypeName}
                  onChange={(e) => setOtherTypeName(e.target.value)}
                  placeholder="Please specify event type"
                  required={eventType === 'OTHER'}
                />
              </div>
            )}
          </div>

          {/* Assign to Team Member - Admin only */}
          {isAdmin && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="assignedTo">Assign to Team Member *</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo} required>
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {(teamMembers && teamMembers.length > 0 ? teamMembers : MOCK_TEAM_MEMBERS).map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Personal Info Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Personal Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setShowNameDropdown(true) }}
                  onFocus={() => setShowNameDropdown(true)}
                  onBlur={() => setTimeout(() => setShowNameDropdown(false), 150)}
                  autoComplete="off"
                  required
                />
                {showNameDropdown && nameFilteredCustomers.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
                    {nameFilteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { handleCustomerSelect(c); setShowNameDropdown(false) }}
                      >
                        <div className="h-7 w-7 rounded-full bg-[#c8864e]/10 flex items-center justify-center shrink-0 text-[#c8864e] font-bold text-xs">
                          {(c.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.phone || c.email || ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {customerMatch && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ Customer found: {customerMatch.firstName} {customerMatch.lastName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const v = sanitizePhoneInput(e.target.value)
                    setPhone(v)
                    setPhoneError(validatePhone(v))
                  }}
                  className={phoneError ? 'border-destructive' : ''}
                  required
                />
                {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
              </div>
            </div>

            {/* Address with Google Places Autocomplete */}
            {(['CONSULTATION_IN_HOME', 'CONSULTATION_VIRTUAL', 'SERVICE_CALL', 'FINAL_MEASUREMENT', 'INSTALLATION'].includes(eventType)) && (
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <AddressAutocomplete
                  id="address"
                  value={address}
                  onChange={(val) => {
                    setAddress(val)
                    // Clear confirmed address when user edits manually so stale
                    // commute time is dismissed until they pick a new suggestion
                    if (val !== confirmedAddress) setConfirmedAddress('')
                  }}
                  onSelect={handleAddressSelect}
                  placeholder="Start typing a customer address…"
                  required
                />
                {/* Commute time indicator */}
                {commute.isLoading && (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    🚗 Calculating commute time…
                  </p>
                )}
                {!commute.isLoading && commute.durationText && !commute.error && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    🚗 {commute.durationText} · {commute.distanceText} from company
                  </p>
                )}
                {!commute.isLoading && commute.error && address.length >= 10 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠ {commute.error} — you can still enter commute time manually
                  </p>
                )}
              </div>
            )}

            {/* Commute Time — auto-filled from Google Directions, manual override allowed */}
            {MOCK_USER.role === 'admin' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Commute Time</Label>
                  {commute.durationText && !commute.isLoading && (
                    <span className="text-xs text-muted-foreground">(auto-calculated · edit to override)</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commuteHours" className="text-xs text-muted-foreground">Hours</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <Input
                        id="commuteHours"
                        type="number"
                        min="0"
                        max="24"
                        value={commuteHours || ''}
                        onChange={(e) => {
                          commuteManuallyEdited.current = true
                          setCommuteHours(parseInt(e.target.value) || 0)
                        }}
                        placeholder="0"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commuteMinutes" className="text-xs text-muted-foreground">Minutes</Label>
                    <Input
                      id="commuteMinutes"
                      type="number"
                      min="0"
                      max="59"
                      value={commuteMinutes || ''}
                      onChange={(e) => {
                        commuteManuallyEdited.current = true
                        setCommuteMinutes(parseInt(e.target.value) || 0)
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Date & Time</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Status</h3>
            <div className="space-y-2">
              <Label htmlFor="status">Appointment Status *</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)} required>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lead Source */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Lead Source</h3>
            <div className="space-y-2">
              <Label htmlFor="leadSource">Lead Source *</Label>
              <Select value={leadSource} onValueChange={setLeadSource} required>
                <SelectTrigger id="leadSource">
                  <SelectValue placeholder="Select lead source" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conditional: Referral Name */}
            {leadSource === 'Referral' && (
              <div className="space-y-2">
                <Label htmlFor="referralName">Who referred? *</Label>
                <Input
                  id="referralName"
                  value={referralName}
                  onChange={(e) => setReferralName(e.target.value)}
                  placeholder="Referrer's name"
                  required
                />
              </div>
            )}

            {/* Conditional: Partner Referral */}
            {leadSource === 'Partner Referral' && (
              <div className="space-y-2">
                <Label htmlFor="partnerReferral">Partner *</Label>
                <Select value={partnerReferralId} onValueChange={setPartnerReferralId} required>
                  <SelectTrigger id="partnerReferral">
                    <SelectValue placeholder="Select partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPartners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name} ({partner.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Side Mark (Read-only) */}
          {sideMark && (
            <div className="space-y-2 border-t pt-4">
              <Label>Side Mark (Auto-Generated)</Label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md">
                <span className="text-sm font-mono text-gray-700 dark:text-white">{sideMark}</span>
              </div>
            </div>
          )}

          {/* Tax exempt */}
          <div className="space-y-2 border-t pt-4">
            <Label>Tax exempt</Label>
            <Select value={taxExempt ? 'yes' : 'no'} onValueChange={(v) => setTaxExempt(v === 'yes')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Tax-exempt clients do not pay the 8.25% order tax.</p>
          </div>

          {/* Products & Windows */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Products & Scope</h3>

            {/* Product multi-select dropdown */}
            <div className="space-y-2 relative">
              <Label>Products of Interest</Label>
              <button
                type="button"
                onClick={() => setProductDropdownOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-input bg-background text-sm hover:border-muted-foreground transition-colors"
              >
                <span className={productsOfInterest.length === 0 ? 'text-muted-foreground' : 'text-foreground'}>
                  {productsOfInterest.length === 0
                    ? 'Select products…'
                    : productsOfInterest.length === 1
                    ? productsOfInterest[0]
                    : `${productsOfInterest.length} products selected`}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>

              {productDropdownOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
                  {/* Interior */}
                  <div className="px-3 pt-2 pb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Interior</p>
                  </div>
                  {INTERIOR_PRODUCTS.map((p) => (
                    <label key={p} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <Checkbox
                        checked={productsOfInterest.includes(p)}
                        onCheckedChange={() => handleProductToggle(p)}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{p}</span>
                    </label>
                  ))}
                  {/* Exterior */}
                  <div className="px-3 pt-2 pb-1 border-t border-gray-100 dark:border-gray-700 mt-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Exterior</p>
                  </div>
                  {EXTERIOR_PRODUCTS.map((p) => (
                    <label key={p} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <Checkbox
                        checked={productsOfInterest.includes(p)}
                        onCheckedChange={() => handleProductToggle(p)}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{p}</span>
                    </label>
                  ))}
                  <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setProductDropdownOpen(false)}
                      className="w-full text-xs text-center text-muted-foreground hover:text-foreground py-1"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {/* Selected product chips */}
              {productsOfInterest.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {productsOfInterest.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                    >
                      {p}
                      <button type="button" onClick={() => handleProductToggle(p)} className="text-amber-600 hover:text-amber-800">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Conditional counts based on product type */}
            {productsOfInterest.some((p) => !isExteriorProduct(p)) && (
              <div className="space-y-2">
                <Label htmlFor="numberOfWindows">Number of Windows (Interior)</Label>
                <Input
                  id="numberOfWindows"
                  type="number"
                  min="0"
                  max="100"
                  value={numberOfWindows || ''}
                  onChange={(e) => setNumberOfWindows(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 8"
                  className="max-w-[120px]"
                />
              </div>
            )}

            {productsOfInterest.some((p) => isExteriorProduct(p)) && (
              <div className="space-y-2">
                <Label htmlFor="numberOfOpenings">Number of Openings (Exterior)</Label>
                <Input
                  id="numberOfOpenings"
                  type="number"
                  min="0"
                  max="100"
                  value={numberOfOpenings || ''}
                  onChange={(e) => setNumberOfOpenings(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 4"
                  className="max-w-[120px]"
                />
              </div>
            )}
          </div>

          {/* Company Toggle */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Is this a company?</Label>
              <RadioGroup value={isCompany ? 'yes' : 'no'} onValueChange={(v) => setIsCompany(v === 'yes')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="company-yes" />
                  <Label htmlFor="company-yes" className="font-normal cursor-pointer">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="company-no" />
                  <Label htmlFor="company-no" className="font-normal cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Conditional: Company Fields */}
            {isCompany && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required={isCompany}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="www.example.com"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about this appointment..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">{isEditMode ? 'Update Appointment' : 'Create Appointment'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

