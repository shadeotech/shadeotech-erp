// Event Types and Color Coding
export const EVENT_TYPES = {
  CONSULTATION_IN_HOME: {
    label: 'In-Home Consultation',
    color: '#3b82f6', // Blue
    bgColor: '#dbeafe',
  },
  CONSULTATION_VIRTUAL: {
    label: 'Virtual Consultation',
    color: '#6366f1', // Indigo
    bgColor: '#e0e7ff',
  },
  CONSULTATION_SHOWROOM: {
    label: 'Showroom Consultation',
    color: '#10b981', // Green
    bgColor: '#d1fae5',
  },
  SERVICE_CALL: {
    label: 'Service Call',
    color: '#8b5cf6', // Purple
    bgColor: '#ede9fe',
  },
  FINAL_MEASUREMENT: {
    label: 'Final Measurement',
    color: '#f59e0b', // Amber
    bgColor: '#fef3c7',
  },
  INSTALLATION: {
    label: 'Installation',
    color: '#ef4444', // Red
    bgColor: '#fee2e2',
  },
  OTHER: {
    label: 'Other',
    color: '#6b7280', // Gray
    bgColor: '#f3f4f6',
  },
} as const

export type EventType = keyof typeof EVENT_TYPES

// Lead Source Options
export const LEAD_SOURCES = [
  'Meta',
  'Google',
  'Referral',
  'Partner Referral',
  'Door Hanger',
  'Door to Door Sales',
  'LinkedIn',
  'Vehicle',
  'Walk-In',
  'Other Paid',
  'Other Organic',
] as const

export type LeadSource = typeof LEAD_SOURCES[number]

// Lead Source Codes for Side Mark
export const LEAD_SOURCE_CODES: Record<LeadSource, string> = {
  'Meta': 'MT',
  'Google': 'GL',
  'Referral': 'RF',
  'Partner Referral': 'PR',
  'Door Hanger': 'DH',
  'Door to Door Sales': 'DD',
  'LinkedIn': 'LK',
  'Vehicle': 'VH',
  'Walk-In': 'WI',
  'Other Paid': 'OP',
  'Other Organic': 'OO',
}

// Side Mark Type Codes
export const SIDE_MARK_TYPES = {
  AT_SHADES_FRANCHISEE: 'A',
  RESIDENTIAL: 'R',
  COMMERCIAL: 'C',
  PARTNER: 'P',
} as const

// Mock User (Admin)
export const MOCK_USER = {
  id: 'admin_1',
  role: 'admin',
  name: 'Admin User',
}

// Address Autocomplete Mock Suggestions
export const MOCK_ADDRESS_SUGGESTIONS = [
  '123 Main Street, San Francisco, CA 94102',
  '456 Market Street, San Francisco, CA 94103',
  '789 Mission Street, San Francisco, CA 94105',
  '321 California Street, San Francisco, CA 94104',
  '654 Powell Street, San Francisco, CA 94108',
  '987 Geary Street, San Francisco, CA 94109',
  '147 Van Ness Avenue, San Francisco, CA 94102',
  '258 Fillmore Street, San Francisco, CA 94117',
  '369 Divisadero Street, San Francisco, CA 94117',
  '741 Castro Street, San Francisco, CA 94114',
]

// Team Members
export const MOCK_TEAM_MEMBERS = [
  {
    id: 'admin_1',
    name: 'Admin User',
    email: 'admin@shadeotech.com',
  },
  {
    id: 'user_1',
    name: 'John Smith',
    email: 'john@shadeotech.com',
  },
  {
    id: 'user_2',
    name: 'Sarah Johnson',
    email: 'sarah@shadeotech.com',
  },
  {
    id: 'user_3',
    name: 'Mike Davis',
    email: 'mike@shadeotech.com',
  },
  {
    id: 'user_4',
    name: 'Emily Brown',
    email: 'emily@shadeotech.com',
  },
]

// Appointment Status Options
export const APPOINTMENT_STATUSES = [
  'Scheduled',
  'Confirmed',
  'Rescheduled',
  'Cancelled',
  'Completed',
] as const

export type AppointmentStatus = typeof APPOINTMENT_STATUSES[number]
