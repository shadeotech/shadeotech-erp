'use client'

/**
 * AddressAutocomplete
 *
 * Uses Google Places AutocompleteService + PlacesService (the programmatic API)
 * instead of the Autocomplete widget. This avoids two critical bugs that occur
 * when the widget is used inside a Radix UI Dialog:
 *
 *   1. The widget appends its pac-container to <body>, outside the Dialog's
 *      DOM tree. Radix's focus trap intercepts keyboard events when focus moves
 *      to the pac-container, causing the input to freeze after a few characters.
 *
 *   2. The widget modifies the DOM input value directly, conflicting with React's
 *      controlled-input reconciliation and breaking typing.
 *
 * With the programmatic API we own the dropdown (it lives inside the component),
 * the input is a normal React controlled input, and there are zero focus-trap or
 * z-index issues.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AddressSelection {
  fullAddress: string
  street: string     // street_number + route
  city: string       // locality
  state: string      // administrative_area_level_1 (short, e.g. "TX")
  postalCode: string // postal_code
  country: string    // country (long name)
  lat: number
  lng: number
}

interface Prediction {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (address: AddressSelection) => void
  placeholder?: string
  id?: string
  className?: string
  required?: boolean
  disabled?: boolean
}

// ─── Module-level Maps loader (runs once per page) ────────────────────────────
let _scriptState: 'idle' | 'loading' | 'ready' = 'idle'
const _callbacks: Array<() => void> = []

function loadMaps(apiKey: string, cb: () => void): void {
  // Already fully ready (module state OR window object already present)
  if (_scriptState === 'ready' || (typeof window !== 'undefined' && window.google?.maps?.places?.AutocompleteService)) {
    _scriptState = 'ready'
    cb()
    return
  }
  _callbacks.push(cb)
  if (_scriptState === 'loading') return

  // Check if the script tag already exists in the DOM (e.g. loaded by another component)
  const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
  if (existing) {
    _scriptState = 'loading'
    existing.addEventListener('load', () => {
      _scriptState = 'ready'
      _callbacks.forEach((f) => f())
      _callbacks.length = 0
    })
    return
  }

  _scriptState = 'loading'
  const s = document.createElement('script')
  s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__gmapsReady`
  s.async = true
  ;(window as any).__gmapsReady = () => {
    _scriptState = 'ready'
    _callbacks.forEach((f) => f())
    _callbacks.length = 0
    delete (window as any).__gmapsReady
  }
  s.onerror = () => {
    _scriptState = 'idle'
    console.error('[AddressAutocomplete] Failed to load Google Maps JS API')
  }
  document.head.appendChild(s)
}

// ─── Address component helpers ────────────────────────────────────────────────
function parseComponents(
  components: google.maps.places.AddressComponent[]
): Omit<AddressSelection, 'fullAddress' | 'lat' | 'lng'> {
  const get = (t: string) =>
    components.find((c) => c.types.includes(t))?.long_name ?? ''
  const getShort = (t: string) =>
    components.find((c) => c.types.includes(t))?.short_name ?? ''

  return {
    street: [get('street_number'), get('route')].filter(Boolean).join(' '),
    city:
      get('locality') ||
      get('sublocality_level_1') ||
      get('administrative_area_level_3') ||
      get('administrative_area_level_2'),
    state: getShort('administrative_area_level_1') || get('administrative_area_level_1'),
    postalCode: get('postal_code'),
    country: get('country'),
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing an address…',
  id,
  className,
  required,
  disabled,
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [mapsReady, setMapsReady] = useState(_scriptState === 'ready')

  const svcRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Load Google Maps script ───────────────────────────────────────────────
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.warn('[AddressAutocomplete] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set')
      return
    }
    loadMaps(apiKey, () => {
      svcRef.current = new window.google.maps.places.AutocompleteService()
      sessionRef.current = new window.google.maps.places.AutocompleteSessionToken()
      setMapsReady(true)
    })
  }, [])

  // ── Fetch predictions (debounced) ─────────────────────────────────────────
  const fetchPredictions = useCallback((input: string) => {
    if (!svcRef.current || input.trim().length < 3) {
      setPredictions([])
      setShowDropdown(false)
      return
    }
    setIsFetching(true)
    svcRef.current.getPlacePredictions(
      { input, sessionToken: sessionRef.current ?? undefined },
      (results, status) => {
        setIsFetching(false)
        if (status === 'OK' && results) {
          setPredictions(
            results.map((r) => ({
              placeId: r.place_id,
              description: r.description,
              mainText: r.structured_formatting.main_text,
              secondaryText: r.structured_formatting.secondary_text,
            }))
          )
          setShowDropdown(true)
          setActiveIndex(-1)
        } else {
          if (status !== 'ZERO_RESULTS') {
            console.error('[AddressAutocomplete] Places API error:', status)
          }
          setPredictions([])
          setShowDropdown(false)
        }
      }
    )
  }, [])

  // ── Handle text input ─────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    onChange(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 3) {
      setPredictions([])
      setShowDropdown(false)
      return
    }
    debounceRef.current = setTimeout(() => fetchPredictions(val), 300)
  }

  // ── Select a prediction → resolve full details ────────────────────────────
  const handleSelect = useCallback(
    (pred: Prediction) => {
      setShowDropdown(false)
      setPredictions([])
      onChange(pred.description)

      // PlacesService requires an HTMLElement; a detached div is fine
      const attrDiv = document.createElement('div')
      const placesService = new window.google.maps.places.PlacesService(attrDiv)

      placesService.getDetails(
        {
          placeId: pred.placeId,
          fields: ['formatted_address', 'address_components', 'geometry'],
          sessionToken: sessionRef.current ?? undefined,
        },
        (place, status) => {
          // Rotate session token after each completed session
          sessionRef.current = new window.google.maps.places.AutocompleteSessionToken()

          if (status !== 'OK' || !place) return

          const comps = place.address_components ?? []
          const parsed = parseComponents(comps)

          const selection: AddressSelection = {
            fullAddress: place.formatted_address ?? pred.description,
            lat: place.geometry?.location?.lat() ?? 0,
            lng: place.geometry?.location?.lng() ?? 0,
            ...parsed,
          }

          onChange(selection.fullAddress)
          onSelect(selection)
        }
      )
    },
    [onChange, onSelect]
  )

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || predictions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, predictions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(predictions[activeIndex])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setActiveIndex(-1)
    }
  }

  // ── Close dropdown when clicking outside ─────────────────────────────────
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // ── Cleanup debounce on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* Leading pin icon */}
      <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      {/* Spinner while fetching */}
      {isFetching && (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      <Input
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (predictions.length > 0) setShowDropdown(true)
        }}
        placeholder={placeholder}
        className={cn('pl-9', isFetching && 'pr-9', className)}
        required={required}
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        role="combobox"
      />

      {/* Custom dropdown — lives INSIDE the component tree, no z-index / focus-trap issues */}
      {showDropdown && predictions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-[9999] mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          {predictions.map((pred, idx) => (
            <li key={pred.placeId} role="option" aria-selected={idx === activeIndex}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm',
                  idx === activeIndex
                    ? 'bg-gray-100 dark:bg-gray-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/60'
                )}
                // onMouseDown prevents the input from losing focus before onClick fires
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(pred)}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {pred.mainText}
                  </span>
                  {pred.secondaryText && (
                    <span className="ml-1 text-gray-500 dark:text-gray-400">
                      {pred.secondaryText}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
