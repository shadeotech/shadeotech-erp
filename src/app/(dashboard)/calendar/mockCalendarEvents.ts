import { EventType } from './constants'

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  type: EventType
  assignedTo: string
  status?: string
  otherTypeName?: string
  customerId?: string
  partnerId?: string
  location?: string
  leadSource?: string
  referralName?: string
  partnerReferralName?: string
  sideMark?: string
  productsOfInterest?: string[]
  numberOfWindows?: number
  numberOfOpenings?: number
  isCompany?: boolean
  companyName?: string
  website?: string
  commuteTime?: string
  /** Driving distance from factory to appointment location, e.g. "14.2 mi" */
  commuteDistance?: string
  notes?: string
  /** If true, customer does not pay the 8% tax on orders */
  taxExempt?: boolean
  /** Latitude of the appointment location (from Google Places) */
  lat?: number
  /** Longitude of the appointment location (from Google Places) */
  lng?: number
}

// Mock data removed – events are now stored in DB and fetched via /api/calendar/events

