import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import CalendarEvent from '@/lib/models/CalendarEvent'
import User from '@/lib/models/User'
import CompanySettings from '@/lib/models/CompanySettings'

function extractCity(location?: string | null): string {
  if (!location) return ''
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return ''
  const last = parts[parts.length - 1].replace(/\d{5}(-\d{4})?/, '').trim()
  if (last) return last.toLowerCase()
  if (parts.length > 1) return parts[parts.length - 2].toLowerCase()
  return parts[0].toLowerCase()
}

function buildSlots(startHour: number, lastSlotHour: number): string[] {
  const slots: string[] = []
  for (let h = startHour; h <= lastSlotHour; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
  }
  return slots
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const date = searchParams.get('date') // YYYY-MM-DD

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 })
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    await connectDB()

    // Load booking settings
    const settingsDoc = await CompanySettings.findById('company').lean()
    const bufferHours = settingsDoc?.bookingBuffer ?? 2
    const startHour = settingsDoc?.bookingStartHour ?? 10
    const lastSlotHour = settingsDoc?.bookingLastSlotHour ?? 15

    const ALL_SLOTS = buildSlots(startHour, lastSlotHour)

    // When staffId is 'any' or omitted, aggregate across all staff
    const useAny = !staffId || staffId === 'any'

    // ── 1. Available slots for the requested date ─────────────────────────
    const dayStart = `${date}T00:00:00`
    const dayEnd = `${date}T23:59:59`

    const slotQuery = useAny
      ? { start: { $gte: dayStart, $lte: dayEnd } }
      : { assignedTo: staffId, start: { $gte: dayStart, $lte: dayEnd } }

    const existingOnDate = await CalendarEvent.find(slotQuery)
      .select('start end')
      .lean()

    // Build set of blocked hours with buffer applied
    const blockedHours = new Set<number>()
    for (const ev of existingOnDate) {
      const evHour = parseInt(ev.start.slice(11, 13), 10)
      for (let h = evHour; h < evHour + 1 + bufferHours; h++) {
        blockedHours.add(h)
      }
      for (let h = evHour - bufferHours; h < evHour; h++) {
        blockedHours.add(h)
      }
    }

    const availableSlots = ALL_SLOTS.filter((slot) => {
      const h = parseInt(slot.split(':')[0], 10)
      return !blockedHours.has(h)
    })

    // ── 2. Location hints for the next 28 days ────────────────────────────
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const horizon = new Date(today)
    horizon.setDate(horizon.getDate() + 28)

    const horizonStart = today.toISOString().slice(0, 10) + 'T00:00:00'
    const horizonEnd = horizon.toISOString().slice(0, 10) + 'T23:59:59'

    const hintQuery = useAny
      ? { start: { $gte: horizonStart, $lte: horizonEnd }, location: { $exists: true, $ne: '' } }
      : { assignedTo: staffId, start: { $gte: horizonStart, $lte: horizonEnd }, location: { $exists: true, $ne: '' } }

    const futureEvents = await CalendarEvent.find(hintQuery)
      .select('start location')
      .lean()

    const locationMap: Record<string, string[]> = {}
    for (const ev of futureEvents) {
      const evDate = ev.start.slice(0, 10)
      const city = extractCity(ev.location)
      if (!city) continue
      if (!locationMap[evDate]) locationMap[evDate] = []
      if (!locationMap[evDate].includes(city)) {
        locationMap[evDate].push(city)
      }
    }

    const locationHints = Object.entries(locationMap).map(([d, cities]) => ({ date: d, cities }))

    return NextResponse.json({ availableSlots, locationHints }, { status: 200 })
  } catch (error) {
    console.error('GET /api/booking/slots error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
