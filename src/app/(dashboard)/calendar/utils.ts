import { LeadSource, LEAD_SOURCE_CODES, SIDE_MARK_TYPES } from './constants'

/**
 * Generate a random 5-digit number
 */
export function generateRandomNumber(): string {
  return Math.floor(10000 + Math.random() * 90000).toString()
}

/**
 * Generate Side Mark based on type and lead source
 * Format: SHT-LL#####
 * - SH = prefix
 * - T = type: A=At Shades Franchisee, R=Residential, C=Commercial, P=Partner
 * - LL = source: MT=Meta, GL=Google, RF=Referral, PR=Partner Referral, DH=Door Hanger,
 *   DD=Door to Door Sales, LK=LinkedIn, VH=Vehicle, WI=Walk-In, OP=Other Paid, OO=Other Organic
 * - ##### = randomly generated unique 5-digit number
 */
export function generateSideMark(
  type: 'RESIDENTIAL' | 'COMMERCIAL' | 'PARTNER' | 'AT_SHADES_FRANCHISEE',
  leadSource?: LeadSource
): string {
  const typeCode = SIDE_MARK_TYPES[type]
  const sourceCode = leadSource ? LEAD_SOURCE_CODES[leadSource] : 'XX'
  const randomNum = generateRandomNumber()
  
  return `SH${typeCode}-${sourceCode}${randomNum}`
}

/**
 * Calculate mock commute time based on address
 * This is a mock calculation - in real app would use Google Maps API
 */
export function calculateCommuteTime(address: string): string {
  // Mock calculation based on address length and some randomness
  const baseTime = Math.floor(address.length / 5)
  const randomVariation = Math.floor(Math.random() * 20) + 5
  const totalMinutes = baseTime + randomVariation
  
  return `${totalMinutes} mins`
}

/**
 * Format date to ISO string for calendar (local date to avoid timezone shift)
 */
export function formatDateForCalendar(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Format datetime to ISO string
 */
export function formatDateTimeForCalendar(date: Date, time: string): string {
  const dateStr = formatDateForCalendar(date)
  return `${dateStr}T${time}:00`
}

/**
 * Parse ISO datetime string to Date
 */
export function parseCalendarDateTime(isoString: string): Date {
  return new Date(isoString)
}

/**
 * Format time for display (HH:MM AM/PM)
 */
export function formatTimeDisplay(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format date for display
 */
export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** Richer, more saturated event palette */
export function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    CONSULTATION_IN_HOME: '#3B82F6',
    CONSULTATION_VIRTUAL: '#6366F1',
    CONSULTATION_SHOWROOM: '#10B981',
    SERVICE_CALL: '#8B5CF6',
    FINAL_MEASUREMENT: '#F59E0B',
    INSTALLATION: '#EF4444',
    OTHER: '#6B7280',
  }
  return colors[type] || '#6B7280'
}

export function getEventBorderColor(type: string): string {
  const colors: Record<string, string> = {
    CONSULTATION_IN_HOME: '#1D4ED8',
    CONSULTATION_VIRTUAL: '#4338CA',
    CONSULTATION_SHOWROOM: '#047857',
    SERVICE_CALL: '#6D28D9',
    FINAL_MEASUREMENT: '#B45309',
    INSTALLATION: '#B91C1C',
    OTHER: '#374151',
  }
  return colors[type] || '#374151'
}

export function getEventBgColor(type: string): string {
  return getEventColor(type)
}

