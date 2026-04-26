'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  CalendarDays,
  Clock,
  ClipboardList,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Star,
  AlertTriangle,
  Plus,
  Trash2,
  X,
  ChevronDown,
  CalendarPlus,
  ExternalLink,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

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

const SERVICE_TYPES = ['In-Home Consultation', 'Virtual Consultation', 'Showroom Visit']

const STEPS = [
  { id: 1, label: 'Your Info', icon: ClipboardList },
  { id: 2, label: 'Date & Time', icon: CalendarDays },
  { id: 3, label: 'Confirm', icon: CheckCircle2 },
]

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_ABBR = ['SUN','MON','TUE','WED','THU','FRI','SAT']

const HQ_LAT = 32.9587
const HQ_LNG = -96.9029
const RADIUS_MILES = 50

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationHint { date: string; cities: string[] }
interface Measurement { room: string; width: string; height: string }

interface BookingForm {
  name: string; email: string; phone: string
  address: string; city: string; lat: number | null; lng: number | null
  products: string[]
  numberOfWindows: string
  numberOfOpenings: string
  measurements: Measurement[]
  serviceType: string; notes: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getNext28Days() {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Array.from({ length: 28 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i + 1); return d })
}

function toYMD(d: Date) { return d.toISOString().slice(0, 10) }

function formatDisplayDate(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatSlot(s: string) {
  const h = parseInt(s)
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`
}

function dow(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' })
}

function monthLabel(ymd: string) {
  const [y, m] = ymd.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function hasInterior(products: string[]) { return products.some((p) => INTERIOR_PRODUCTS.includes(p)) }
function hasExterior(products: string[]) { return products.some((p) => EXTERIOR_PRODUCTS.includes(p)) }

function generateICS(booking: { id: string; date: string; time: string; serviceType: string; name: string }) {
  const [y, m, d] = booking.date.split('-').map(Number)
  const h = booking.time ? parseInt(booking.time.split(':')[0]) : 10
  const start = `${String(y)}${String(m).padStart(2,'0')}${String(d).padStart(2,'0')}T${String(h).padStart(2,'0')}0000`
  const end = `${String(y)}${String(m).padStart(2,'0')}${String(d).padStart(2,'0')}T${String(h+1).padStart(2,'0')}0000`
  const now = new Date().toISOString().replace(/[-:]/g,'').slice(0,15) + 'Z'
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shadeotech//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@shadeotech.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${booking.serviceType} – Shadeotech (Pending Confirmation)`,
    'DESCRIPTION:Your appointment is pending confirmation. We will contact you within 24 hours.',
    'LOCATION:Your Home / TBD',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

// ─── Light theme input classes ────────────────────────────────────────────────
const inputCls = 'bg-white border-[#e0d0bc] text-[#1e140a] placeholder:text-[#c4a882] focus:border-[#c8864e] focus:ring-0 focus:outline-none transition-colors'
const btnOutlineCls = 'border-[#e0d0bc] bg-white text-[#7a5c3c] hover:bg-[#fdf4eb] hover:text-[#1e140a] hover:border-[#c8864e]'

// ─── Step Progress ─────────────────────────────────────────────────────────────

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {STEPS.map((step, idx) => {
        const done = current > step.id; const active = current === step.id
        const Icon = step.icon
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all',
                done ? 'bg-[#c8864e] border-[#c8864e]' : active ? 'border-[#c8864e] bg-amber-50' : 'border-[#e0d0bc] bg-white')}>
                {done ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Icon className={cn('h-3.5 w-3.5', active ? 'text-[#c8864e]' : 'text-[#c4a882]')} />}
              </div>
              <span className={cn('text-[10px] font-medium hidden sm:block', active ? 'text-[#c8864e]' : done ? 'text-[#a07050]' : 'text-[#c4a882]')}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && <div className={cn('h-px w-8 sm:w-10 mx-1 mb-3', done ? 'bg-[#c8864e]' : 'bg-[#e0d0bc]')} />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Outside Radius Modal ─────────────────────────────────────────────────────

function OutsideRadiusModal({ onContinue, onClose }: { onContinue: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#e8ddd0] p-6 shadow-2xl shadow-amber-900/10">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#c4a882] hover:text-[#7a5c3c]"><X className="h-4 w-4" /></button>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1e140a]">Outside Our Service Area</h3>
            <p className="text-sm text-[#7a5c3c] mt-2 leading-relaxed">
              Your address is outside our 50-mile service radius. We can still do your project — we&apos;ll just need your measurements to provide an estimate. Once approved, we&apos;ll come out to you.
            </p>
          </div>
          <div className="w-full space-y-2 pt-1">
            <Button onClick={onContinue} className="w-full bg-[#c8864e] hover:bg-[#b8764e] text-white">Continue Booking</Button>
            <Button variant="ghost" onClick={onClose} className="w-full text-[#a07050] hover:text-[#7a5c3c] hover:bg-amber-50">Go Back</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Product Multi-Select Dropdown ────────────────────────────────────────────

function ProductDropdown({ selected, onToggle }: { selected: string[]; onToggle: (p: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const label = selected.length === 0 ? 'Select products interested in…'
    : selected.length === 1 ? selected[0]
    : `${selected.length} products selected`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn('w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors',
          open ? 'border-[#c8864e] bg-white ring-1 ring-[#c8864e]/20' : 'border-[#e0d0bc] bg-white hover:border-[#c4a882]')}
      >
        <span className={selected.length ? 'text-[#1e140a]' : 'text-[#c4a882]'}>{label}</span>
        <ChevronDown className={cn('h-4 w-4 text-[#a07050] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-[#e8ddd0] bg-white shadow-xl shadow-amber-900/10 overflow-hidden max-h-72 overflow-y-auto">
          <div className="px-3 pt-2.5 pb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a07050]">Interior</p>
          </div>
          {INTERIOR_PRODUCTS.map((p) => (
            <label key={p} className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 cursor-pointer">
              <div className={cn('h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-all',
                selected.includes(p) ? 'border-[#c8864e] bg-[#c8864e]' : 'border-[#d4bfa0] bg-white')}
                onClick={() => onToggle(p)}>
                {selected.includes(p) && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm text-[#3a2010]">{p}</span>
            </label>
          ))}
          <div className="px-3 pt-2.5 pb-1 border-t border-[#f0e8de] mt-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#a07050]">Exterior</p>
          </div>
          {EXTERIOR_PRODUCTS.map((p) => (
            <label key={p} className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 cursor-pointer">
              <div className={cn('h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-all',
                selected.includes(p) ? 'border-[#c8864e] bg-[#c8864e]' : 'border-[#d4bfa0] bg-white')}
                onClick={() => onToggle(p)}>
                {selected.includes(p) && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm text-[#3a2010]">{p}</span>
            </label>
          ))}
          <div className="p-2 border-t border-[#f0e8de]">
            <button type="button" onClick={() => setOpen(false)} className="w-full py-1.5 text-xs text-[#c8864e] hover:text-[#b8764e] font-medium transition-colors">
              Done ({selected.length} selected)
            </button>
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-[#8b4e1e] border border-amber-200">
              {p}
              <button type="button" onClick={() => onToggle(p)} className="ml-0.5 text-[#c8864e]/70 hover:text-[#c8864e]">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Step 1: Your Info ────────────────────────────────────────────────────────

function InfoStep({ form, onChange, onProductToggle, onAddMeasurement, onRemoveMeasurement, onMeasurementChange, onNext }:
  {
    form: BookingForm
    onChange: (field: keyof BookingForm, value: string | number | null) => void
    onProductToggle: (p: string) => void
    onAddMeasurement: () => void
    onRemoveMeasurement: (i: number) => void
    onMeasurementChange: (i: number, f: keyof Measurement, v: string) => void
    onNext: () => void
  }) {
  const addressRef = useRef<HTMLInputElement>(null)
  const [outsideRadius, setOutsideRadius] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = window as any
    const init = () => {
      if (!addressRef.current || !g.google?.maps?.places) return
      const ac = new g.google.maps.places.Autocomplete(addressRef.current, {
        types: ['address'], componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'geometry', 'address_components'],
      })
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place.formatted_address) return
        const lat: number | null = place.geometry?.location?.lat() ?? null
        const lng: number | null = place.geometry?.location?.lng() ?? null
        const cityComp = place.address_components?.find((c: { types: string[]; long_name: string }) => c.types.includes('locality'))
        onChange('address', place.formatted_address)
        onChange('city', cityComp?.long_name ?? '')
        onChange('lat', lat); onChange('lng', lng)
        if (lat !== null && lng !== null && haversineMiles(lat, lng, HQ_LAT, HQ_LNG) > RADIUS_MILES) {
          setOutsideRadius(true); setShowModal(true)
        } else { setOutsideRadius(false) }
      })
    }
    if (g.google?.maps?.places) { init() } else {
      const id = 'gm-script'
      if (!document.getElementById(id)) {
        const s = document.createElement('script'); s.id = id
        s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        s.async = true; s.defer = true; s.onload = init
        document.head.appendChild(s)
      }
    }
  }, [onChange])

  const canNext = form.name.trim() && form.email.trim() && form.phone.trim() && form.address.trim() && form.serviceType

  return (
    <div className="space-y-5">
      {showModal && (
        <OutsideRadiusModal
          onContinue={() => setShowModal(false)}
          onClose={() => { setShowModal(false); onChange('address', ''); onChange('city', ''); onChange('lat', null); onChange('lng', null); setOutsideRadius(false) }}
        />
      )}

      <div className="text-center">
        <h2 className="text-xl font-semibold text-[#1e140a]">Tell Us About You</h2>
        <p className="text-sm text-[#7a5c3c] mt-1">We&apos;ll match you with the right consultant</p>
      </div>

      <div className="space-y-4">
        {/* Name / Email */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[#7a5c3c] text-xs font-semibold uppercase tracking-wide">Full Name <span className="text-[#c8864e]">*</span></Label>
            <Input value={form.name} onChange={(e) => onChange('name', e.target.value)} placeholder="Jane Smith" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#7a5c3c] text-xs font-semibold uppercase tracking-wide">Email <span className="text-[#c8864e]">*</span></Label>
            <Input type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} placeholder="jane@example.com" className={inputCls} />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label className="text-[#7a5c3c] text-xs font-semibold uppercase tracking-wide">Phone <span className="text-[#c8864e]">*</span></Label>
          <Input type="tel" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="(555) 000-0000" className={inputCls} />
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <Label className="text-[#7a5c3c] text-xs font-semibold uppercase tracking-wide">Home Address <span className="text-[#c8864e]">*</span></Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#c4a882]" />
            <input
              ref={addressRef}
              value={form.address}
              onChange={(e) => onChange('address', e.target.value)}
              placeholder="Start typing your address…"
              className={cn('w-full pl-9 pr-3 py-2 rounded-md border text-sm', inputCls)}
            />
          </div>
          {outsideRadius && (
            <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Outside 50-mile radius — measurements required for estimate</p>
          )}
        </div>

        {/* Service Type */}
        <div className="space-y-1.5">
          <Label className="text-[#7a5c3c] text-xs font-semibold uppercase tracking-wide">Service Type <span className="text-[#c8864e]">*</span></Label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES.map((s) => (
              <button key={s} type="button" onClick={() => onChange('serviceType', s)}
                className={cn('px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                  form.serviceType === s ? 'border-[#c8864e] bg-amber-50 text-[#c8864e]' : 'border-[#e0d0bc] bg-white text-[#7a5c3c] hover:border-[#c4a882] hover:bg-amber-50/50')}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="space-y-1.5">
          <Label className="text-[#7a5c3c] text-xs font-semibold uppercase tracking-wide">
            Products Interested In <span className="text-[#a07050] font-normal normal-case">(select all that apply)</span>
          </Label>
          <ProductDropdown selected={form.products} onToggle={onProductToggle} />
        </div>

        {/* Conditional: interior → # windows */}
        {hasInterior(form.products) && (
          <div className="space-y-1.5">
            <Label className="text-[#7a5c3c] text-xs font-semibold uppercase tracking-wide">
              Approx. Number of Windows <span className="text-[#a07050] font-normal normal-case">(optional)</span>
            </Label>
            <Input type="number" min="0" value={form.numberOfWindows} onChange={(e) => onChange('numberOfWindows', e.target.value)}
              placeholder="e.g. 8" className={cn(inputCls, 'max-w-[120px]')} />
          </div>
        )}

        {/* Conditional: exterior → # openings */}
        {hasExterior(form.products) && (
          <div className="space-y-1.5">
            <Label className="text-[#7a5c3c] text-xs font-semibold uppercase tracking-wide">
              Approx. Number of Openings <span className="text-[#a07050] font-normal normal-case">(exterior, optional)</span>
            </Label>
            <Input type="number" min="0" value={form.numberOfOpenings} onChange={(e) => onChange('numberOfOpenings', e.target.value)}
              placeholder="e.g. 4" className={cn(inputCls, 'max-w-[120px]')} />
          </div>
        )}

        {/* Measurements */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[#7a5c3c] text-xs font-semibold uppercase tracking-wide">
              Window Measurements <span className="text-[#a07050] font-normal normal-case">(optional — for ballpark estimate)</span>
            </Label>
            <button type="button" onClick={onAddMeasurement} className="flex items-center gap-1 text-[10px] text-[#c8864e] hover:text-[#b8764e] transition-colors font-medium">
              <Plus className="h-3 w-3" /> Add Window
            </button>
          </div>
          {form.measurements.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_80px_32px] gap-2 px-1">
                <span className="text-[10px] text-[#a07050] uppercase tracking-wide">Room / Area</span>
                <span className="text-[10px] text-[#a07050] uppercase tracking-wide text-center">W (in)</span>
                <span className="text-[10px] text-[#a07050] uppercase tracking-wide text-center">H (in)</span>
                <span />
              </div>
              {form.measurements.map((m, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center">
                  <Input value={m.room} onChange={(e) => onMeasurementChange(i, 'room', e.target.value)} placeholder="Living Room" className={cn(inputCls, 'h-8 text-xs')} />
                  <Input value={m.width} onChange={(e) => onMeasurementChange(i, 'width', e.target.value)} placeholder="36" className={cn(inputCls, 'h-8 text-xs text-center')} />
                  <Input value={m.height} onChange={(e) => onMeasurementChange(i, 'height', e.target.value)} placeholder="48" className={cn(inputCls, 'h-8 text-xs text-center')} />
                  <button type="button" onClick={() => onRemoveMeasurement(i)} className="flex items-center justify-center h-8 w-8 rounded text-[#c4a882] hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className="text-[#7a5c3c] text-xs font-semibold uppercase tracking-wide">
            Notes <span className="text-[#a07050] font-normal normal-case">(optional)</span>
          </Label>
          <Textarea value={form.notes} onChange={(e) => onChange('notes', e.target.value)}
            placeholder="Anything else we should know…" rows={2}
            className={cn(inputCls, 'resize-none text-sm')} />
        </div>
      </div>

      <Button onClick={onNext} disabled={!canNext} className="w-full bg-[#c8864e] hover:bg-[#b8764e] text-white font-medium disabled:opacity-40">
        Continue <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}

// ─── Step 2: Date & Time (Calendly-style split layout) ────────────────────────

function DateTimeStep({
  serviceType, locationHints, clientCity,
  selectedDate, selectedSlot, requestedTime, slotsLoading, availableSlots,
  onSelectDate, onSelectSlot, onRequestedTime, onNext, onBack,
}: {
  serviceType: string
  locationHints: LocationHint[]
  clientCity: string
  selectedDate: string
  selectedSlot: string
  requestedTime: string
  slotsLoading: boolean
  availableSlots: string[]
  onSelectDate: (ymd: string) => void
  onSelectSlot: (s: string) => void
  onRequestedTime: (v: string) => void
  onNext: () => void
  onBack: () => void
}) {
  const [showRequest, setShowRequest] = useState(false)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  const firstDow = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()

  const recDates = useMemo(() => {
    if (!clientCity.trim()) return new Set<string>()
    const norm = clientCity.trim().toLowerCase()
    const s = new Set<string>()
    for (const h of locationHints) {
      if (h.cities.some((c) => c.includes(norm) || norm.includes(c))) s.add(h.date)
    }
    return s
  }, [locationHints, clientCity])

  const canNext = !!selectedSlot || (showRequest && requestedTime.trim().length > 0)

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) } else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) } else setCalMonth(m => m + 1)
  }

  const selectedDayLabel = selectedDate
    ? new Date(...(selectedDate.split('-').map(Number) as [number, number, number])).toLocaleDateString('en-US', { weekday: 'long' })
    : ''

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-[#1e140a]">Select Date & Time</h2>
        <p className="text-sm text-[#7a5c3c] mt-1">Pick an available day, then choose your arrival window</p>
      </div>

      {/* Service + duration badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 px-4 py-2.5 rounded-xl border border-[#e0d0bc] bg-white">
          <p className="text-sm font-medium text-[#1e140a]">{serviceType || 'Consultation'}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#e0d0bc] bg-white shrink-0">
          <Clock className="h-3.5 w-3.5 text-[#a07050]" />
          <span className="text-sm text-[#3a2010] font-medium">1 hour</span>
        </div>
      </div>

      {/* Location hint banner */}
      {clientCity.trim() && recDates.size > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <Star className="h-4 w-4 text-[#c8864e] mt-0.5 shrink-0" />
          <p className="text-xs text-[#8b4e1e]">
            <strong>Tip:</strong> We have a consultant near {clientCity} on {Array.from(recDates).slice(0,2).map(formatDisplayDate).join(' and ')} — dates marked ★
          </p>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* ── Left: Calendar ── */}
        <div className="flex-1 min-w-0">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth}
              className="p-1.5 rounded-lg text-[#a07050] hover:text-[#c8864e] hover:bg-amber-50 transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-[#1e140a]">{MONTH_NAMES[calMonth]} {calYear}</span>
            <button onClick={nextMonth}
              className="p-1.5 rounded-lg text-[#a07050] hover:text-[#c8864e] hover:bg-amber-50 transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_ABBR.map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-[#a07050] py-1">{d}</div>
            ))}
          </div>

          {/* Date grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const d = new Date(calYear, calMonth, day)
              const ymd = toYMD(d)
              const isPast = d < today
              const isSel = selectedDate === ymd
              const isToday = d.getTime() === today.getTime()
              const isRec = recDates.has(ymd)
              return (
                <button key={day} onClick={() => !isPast && onSelectDate(ymd)} disabled={isPast}
                  className={cn(
                    'flex flex-col items-center justify-center h-9 w-full rounded-xl text-sm transition-all font-medium',
                    isPast ? 'text-[#d4b894] cursor-not-allowed'
                      : isSel ? 'bg-[#c8864e] text-white shadow-sm'
                      : isToday ? 'bg-amber-100 text-[#c8864e] ring-1 ring-[#c8864e]'
                      : isRec ? 'text-[#1e140a] hover:bg-amber-50 ring-1 ring-amber-300'
                      : 'text-[#1e140a] hover:bg-amber-50/60'
                  )}>
                  {day}
                  {isRec && !isSel && !isPast && <span className="text-[6px] leading-none text-amber-500 -mt-0.5">★</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Right: Time slots ── */}
        <div className="sm:w-44 shrink-0">
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center">
              <CalendarDays className="h-8 w-8 text-[#e0d0bc] mb-2" />
              <p className="text-xs text-[#c4a882]">Select a date to<br />see available times</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#1e140a] mb-2">{selectedDayLabel}</p>
              {slotsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-[#c8864e]" /></div>
              ) : availableSlots.length === 0 && !showRequest ? (
                <div className="text-center py-4">
                  <p className="text-xs text-[#a07050]">No slots available.</p>
                  <button type="button" onClick={() => setShowRequest(true)}
                    className="text-xs text-[#c8864e] hover:underline mt-1">Request time →</button>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    {availableSlots.map(slot => (
                      <button key={slot} onClick={() => { onSelectSlot(slot); setShowRequest(false); onRequestedTime('') }}
                        className={cn(
                          'w-full py-2.5 px-3 rounded-xl border text-sm font-medium transition-all text-center',
                          selectedSlot === slot && !showRequest
                            ? 'border-[#c8864e] bg-amber-50 text-[#c8864e] shadow-sm'
                            : 'border-[#e8ddd0] bg-white text-[#3a2010] hover:border-[#c8864e] hover:bg-amber-50/50'
                        )}>
                        {formatSlot(slot)}
                      </button>
                    ))}
                  </div>
                  {!showRequest && (
                    <button type="button" onClick={() => { setShowRequest(true); onSelectSlot('') }}
                      className="w-full text-[10px] text-[#a07050] hover:text-[#c8864e] transition-colors py-1">
                      Need a different time? →
                    </button>
                  )}
                </>
              )}

              {showRequest && (
                <div className="space-y-2 p-3 rounded-xl border border-amber-200 bg-amber-50">
                  <p className="text-[11px] font-semibold text-[#8b4e1e]">Request a Time</p>
                  <input value={requestedTime} onChange={(e) => onRequestedTime(e.target.value)}
                    placeholder="e.g. Saturday AM, after 5 PM…"
                    className={cn('w-full px-2.5 py-1.5 rounded-lg border text-xs', inputCls)} />
                  <button type="button" onClick={() => { setShowRequest(false); onRequestedTime('') }}
                    className="text-[10px] text-[#c4a882] hover:text-[#7a5c3c]">Cancel</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected summary */}
      {(selectedSlot || (showRequest && requestedTime)) && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
          <Clock className="h-3.5 w-3.5 text-[#c8864e] shrink-0" />
          <span className="text-sm text-[#3a2010] font-medium">
            {formatDisplayDate(selectedDate)} · {selectedSlot ? formatSlot(selectedSlot) : `Requested: ${requestedTime}`}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className={cn('flex-1', btnOutlineCls)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
        <Button onClick={onNext} disabled={!canNext} className="flex-1 bg-[#c8864e] hover:bg-[#b8764e] text-white disabled:opacity-40">
          Continue <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ─── Step 4: Confirm ──────────────────────────────────────────────────────────

function ConfirmStep({ form, date, slot, requestedTime, submitting, error, onSubmit, onBack }:
  { form: BookingForm; date: string; slot: string; requestedTime: string; submitting: boolean; error: string; onSubmit: () => void; onBack: () => void }) {
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-[#1e140a]">Review & Confirm</h2>
        <p className="text-sm text-[#7a5c3c] mt-1">Check your details before submitting</p>
      </div>

      <div className="rounded-xl bg-[#fdf8f2] border border-[#e8ddd0] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e8ddd0] bg-white">
          <p className="text-xs font-semibold text-[#a07050] uppercase tracking-wide">Appointment Summary</p>
        </div>
        <div className="p-5 space-y-3">
          <SRow label="Name" value={form.name} />
          <SRow label="Service" value={form.serviceType} />
          <SRow label="Date" value={formatDisplayDate(date)} icon={<CalendarDays className="h-3.5 w-3.5 text-[#c8864e]" />} />
          <SRow label="Time" value={slot ? `${formatSlot(slot)} (1-hr arrival window)` : `Requested: ${requestedTime}`} icon={<Clock className="h-3.5 w-3.5 text-[#c8864e]" />} />
          <SRow label="Address" value={form.address} icon={<MapPin className="h-3.5 w-3.5 text-[#c8864e]" />} />
          {form.products.length > 0 && <SRow label="Products" value={form.products.join(', ')} />}
          {form.numberOfWindows && <SRow label="Windows" value={form.numberOfWindows} />}
          {form.numberOfOpenings && <SRow label="Openings" value={form.numberOfOpenings} />}
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <div onClick={() => setAgreed(!agreed)}
          className={cn('mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all cursor-pointer',
            agreed ? 'border-[#c8864e] bg-[#c8864e]' : 'border-[#d4bfa0] bg-white group-hover:border-[#c8864e]')}>
          {agreed && <CheckCircle2 className="h-3 w-3 text-white" />}
        </div>
        <p className="text-xs text-[#7a5c3c] leading-relaxed">
          I understand that my selected date and time are subject to confirmation by Shadeotech. I also acknowledge that the scheduled time represents a <strong className="text-[#3a2010]">1-hour arrival window</strong>.
        </p>
      </label>

      {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200"><p className="text-sm text-red-600">{error}</p></div>}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={submitting} className={cn('flex-1', btnOutlineCls)}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
        <Button onClick={onSubmit} disabled={submitting || !agreed} className="flex-1 bg-[#c8864e] hover:bg-[#b8764e] text-white disabled:opacity-40">
          {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</> : 'Request Appointment'}
        </Button>
      </div>
    </div>
  )
}

function SRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-[#a07050] shrink-0">{label}</span>
      <span className="text-sm text-[#1e140a] text-right flex items-center gap-1.5">{icon}{value}</span>
    </div>
  )
}

// ─── Confirmed Screen ─────────────────────────────────────────────────────────

function ConfirmedScreen({ booking }: { booking: { id: string; date: string; time: string; serviceType: string; name?: string } }) {
  function downloadICS() {
    const ics = generateICS({ ...booking, name: booking.name ?? '' })
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'shadeotech-appointment.ics'
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-[#1e140a]">Request Submitted!</h2>
          <p className="text-sm text-[#7a5c3c] mt-1">We&apos;ll confirm your appointment within 24 hours.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-medium text-amber-700">Pending Approval</span>
        </div>
      </div>

      <div className="rounded-xl bg-[#fdf8f2] border border-[#e8ddd0] overflow-hidden text-left">
        <div className="px-5 py-3 border-b border-[#e8ddd0] bg-white">
          <p className="text-xs font-semibold text-[#a07050] uppercase tracking-wide">Summary</p>
        </div>
        <div className="p-5 space-y-3">
          <SRow label="Service" value={booking.serviceType} />
          <SRow label="Requested Date" value={formatDisplayDate(booking.date)} icon={<CalendarDays className="h-3.5 w-3.5 text-[#c8864e]" />} />
          <SRow label="Requested Time" value={booking.time ? `${formatSlot(booking.time)} arrival window` : 'By request'} icon={<Clock className="h-3.5 w-3.5 text-[#c8864e]" />} />
          <SRow label="Reference" value={`#${booking.id.slice(-8).toUpperCase()}`} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button onClick={downloadICS} variant="outline" className={cn('w-full', btnOutlineCls)}>
          <CalendarPlus className="h-4 w-4 mr-2" /> Add to My Calendar (.ics)
        </Button>
        <a href="/portal" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className={cn('w-full', btnOutlineCls)}>
            <ExternalLink className="h-4 w-4 mr-2" /> View Your Portal
          </Button>
        </a>
      </div>

      <p className="text-xs text-[#c4a882] leading-relaxed">
        You&apos;ll receive an email confirmation once your appointment is approved.{' '}
        <a href="mailto:info@shadeotech.com" className="text-[#c8864e] hover:underline font-medium">Contact us</a>
      </p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const [step, setStep] = useState(1)

  const [form, setForm] = useState<BookingForm>({
    name: '', email: '', phone: '',
    address: '', city: '', lat: null, lng: null,
    products: [], numberOfWindows: '', numberOfOpenings: '',
    measurements: [],
    serviceType: '', notes: '',
  })

  const [selectedDate, setSelectedDate] = useState('')
  const [locationHints, setLocationHints] = useState<LocationHint[]>([])

  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [requestedTime, setRequestedTime] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmedBooking, setConfirmedBooking] = useState<{ id: string; date: string; time: string; serviceType: string; name: string } | null>(null)

  const fetchSlots = useCallback(async () => {
    if (!selectedDate) return
    setLoadingSlots(true); setSelectedSlot('')
    try {
      const res = await fetch(`/api/booking/slots?staffId=any&date=${selectedDate}`)
      const d = await res.json()
      setAvailableSlots(d.availableSlots ?? [])
      setLocationHints(d.locationHints ?? [])
    } catch { setAvailableSlots([]) } finally { setLoadingSlots(false) }
  }, [selectedDate])

  useEffect(() => { if (step === 2 && selectedDate) fetchSlots() }, [step, fetchSlots])

  function handleFormChange(field: keyof BookingForm, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleProduct(p: string) {
    setForm((prev) => ({
      ...prev,
      products: prev.products.includes(p) ? prev.products.filter((x) => x !== p) : [...prev.products, p],
    }))
  }

  function addMeasurement() { setForm((p) => ({ ...p, measurements: [...p.measurements, { room: '', width: '', height: '' }] })) }
  function removeMeasurement(i: number) { setForm((p) => ({ ...p, measurements: p.measurements.filter((_, j) => j !== i) })) }
  function updateMeasurement(i: number, f: keyof Measurement, v: string) {
    setForm((p) => { const m = [...p.measurements]; m[i] = { ...m[i], [f]: v }; return { ...p, measurements: m } })
  }

  async function handleSubmit() {
    setSubmitting(true); setSubmitError('')
    try {
      const outsideRadius = form.lat !== null && form.lng !== null
        ? haversineMiles(form.lat, form.lng, HQ_LAT, HQ_LNG) > RADIUS_MILES : false
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedSlot || null,
          name: form.name, email: form.email, phone: form.phone,
          address: form.address, city: form.city,
          serviceType: form.serviceType,
          products: form.products,
          numberOfWindows: form.numberOfWindows ? parseInt(form.numberOfWindows) : undefined,
          numberOfOpenings: form.numberOfOpenings ? parseInt(form.numberOfOpenings) : undefined,
          measurements: form.measurements.filter((m) => m.room || m.width || m.height),
          requestedTime: requestedTime || null,
          outsideRadius, notes: form.notes,
        }),
      })
      const d = await res.json()
      if (!res.ok) { setSubmitError(d.error ?? 'Something went wrong.'); return }
      setConfirmedBooking({ ...d.booking, name: form.name })
      setStep(4)
    } catch { setSubmitError('Network error. Please check your connection.') } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-[#fdf8f2] text-[#1e140a]">
      {/* Header */}
      <header className="border-b border-[#e8ddd0] bg-white/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm shadow-amber-900/5">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <div className="relative h-9 w-40">
            <Image src="/images/shadotech-logo (1).webp" alt="Shadeotech" fill className="object-contain object-left" priority />
          </div>
        </div>
      </header>

      {step < 4 && (
        <div className="bg-gradient-to-b from-white to-[#fdf8f2] border-b border-[#e8ddd0]">
          <div className="max-w-lg mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1e140a]">Book a Consultation</h1>
            <p className="text-sm text-[#7a5c3c] mt-2 max-w-sm mx-auto">
              Free in-home, virtual, or showroom consultations with our window covering experts.
            </p>
          </div>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 py-8">
        {step < 4 && <StepProgress current={step} />}

        <div className="rounded-2xl bg-white border border-[#e8ddd0] p-6 shadow-lg shadow-amber-900/5">
          {step === 1 && (
            <InfoStep form={form} onChange={handleFormChange} onProductToggle={toggleProduct}
              onAddMeasurement={addMeasurement} onRemoveMeasurement={removeMeasurement}
              onMeasurementChange={updateMeasurement} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <DateTimeStep
              serviceType={form.serviceType}
              locationHints={locationHints}
              clientCity={form.city}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              requestedTime={requestedTime}
              slotsLoading={loadingSlots}
              availableSlots={availableSlots}
              onSelectDate={(ymd) => { setSelectedDate(ymd); setSelectedSlot('') }}
              onSelectSlot={setSelectedSlot}
              onRequestedTime={setRequestedTime}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <ConfirmStep form={form} date={selectedDate} slot={selectedSlot} requestedTime={requestedTime}
              submitting={submitting} error={submitError} onSubmit={handleSubmit} onBack={() => setStep(2)} />
          )}
          {step === 4 && confirmedBooking && <ConfirmedScreen booking={confirmedBooking} />}
        </div>

        {step < 4 && (
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            {[['Free In-Home Visits', <MapPin key="m" className="h-3.5 w-3.5" />],
              ['Flexible Scheduling', <Clock key="c" className="h-3.5 w-3.5" />],
              ['5-Star Rated', <Star key="s" className="h-3.5 w-3.5" />]].map(([label, icon]) => (
              <div key={label as string} className="flex items-center gap-1.5 text-[#a07050]">
                <span className="text-[#c8864e]/70">{icon}</span>
                <span className="text-xs font-medium">{label as string}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[#e8ddd0] mt-12">
        <div className="max-w-lg mx-auto px-4 py-6 text-center">
          <p className="text-xs text-[#c4a882]">&copy; {new Date().getFullYear()} Shadeotech. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
