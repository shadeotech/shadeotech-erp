import type { CollectionId } from '@/stores/pricingChartStore'

// Decimal fractions for width and length (same as QuoteBuilder)
export const DECIMAL_FRACTIONS = [
  { value: '0', label: '0' },
  { value: '0.125', label: '1/8' },
  { value: '0.25', label: '1/4' },
  { value: '0.375', label: '3/8' },
  { value: '0.5', label: '1/2' },
  { value: '0.625', label: '5/8' },
  { value: '0.75', label: '3/4' },
  { value: '0.875', label: '7/8' },
] as const

// Collections for pricing charts (same as QuoteBuilder)
export const QUOTE_COLLECTIONS: { id: CollectionId; name: string }[] = [
  { id: 'duo_basic', name: 'Duo Basic' },
  { id: 'duo_light_filtering', name: 'Duo Light Filtering' },
  { id: 'duo_room_dimming', name: 'Duo Room Dimming' },
  { id: 'tri_light_filtering', name: 'Tri Light Filtering' },
  { id: 'tri_room_dimming', name: 'Tri Room Dimming' },
  { id: 'roller_room_darkening', name: 'Roller Room Darkening' },
  { id: 'roller_light_filtering', name: 'Roller Light Filtering' },
  { id: 'roller_room_darkening_y', name: 'Roller Room Darkening Y Collection' },
  { id: 'roller_light_filtering_y', name: 'Roller Light Filtering Y Collection' },
  { id: 'roller_sun_screen', name: 'Roller Sun Screen' },
  { id: 'room_darkening_sun_screen', name: 'Room Darkening Sun Screen' },
  { id: 'zip', name: 'ZIP' },
  { id: 'wire_guide', name: 'Wire Guide' },
  { id: 'uni_shades', name: 'Uni Shades' },
]
