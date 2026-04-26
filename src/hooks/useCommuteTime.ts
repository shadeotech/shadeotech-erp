'use client'

import { useState, useEffect, useRef } from 'react'

/** Default factory / origin address when none is provided from settings */
const DEFAULT_ORIGIN_ADDRESS = '3235 Skylane Dr. Unit 111, Carrollton, TX 75006'

/** Minimum characters before we attempt a route calculation */
const MIN_ADDRESS_LENGTH = 10

/** Debounce delay in ms — avoids a request on every keystroke */
const DEBOUNCE_MS = 900

/** How long to wait for Google Maps to become available after script load */
const MAPS_WAIT_TIMEOUT_MS = 8000

export interface CommuteResult {
  /** Human-readable duration, e.g. "23 mins" */
  durationText: string
  /** Duration in whole minutes */
  durationMinutes: number
  /** Human-readable distance, e.g. "14.2 mi" */
  distanceText: string
  /** Distance in miles (rounded to 1 decimal) */
  distanceMiles: number
  isLoading: boolean
  /** Non-null when route could not be calculated */
  error: string | null
}

const DEFAULT_RESULT: CommuteResult = {
  durationText: '',
  durationMinutes: 0,
  distanceText: '',
  distanceMiles: 0,
  isLoading: false,
  error: null,
}

function isMapsReady(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.google?.maps?.DistanceMatrixService
  )
}

/** Wait for google.maps to become available, up to `timeoutMs`. */
function waitForMaps(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (isMapsReady()) {
      resolve(true)
      return
    }
    const start = Date.now()
    const interval = setInterval(() => {
      if (isMapsReady()) {
        clearInterval(interval)
        resolve(true)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval)
        resolve(false)
      }
    }, 150)
  })
}

/**
 * Calculates driving commute time from the company (Shadeotech) address to a given address.
 *
 * - Automatically debounces requests (900 ms)
 * - Waits for Google Maps JS API to be ready
 * - Returns loading/error states
 *
 * @param destinationAddress  The customer's or appointment full address string
 * @param originAddress      Optional. Company address (from Settings → Address). If not set, uses default.
 */
export function useCommuteTime(
  destinationAddress: string,
  originAddress?: string | null
): CommuteResult {
  const origin = (originAddress && originAddress.trim()) || DEFAULT_ORIGIN_ADDRESS
  const [result, setResult] = useState<CommuteResult>(DEFAULT_RESULT)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track the current request so stale responses are discarded
  const requestIdRef = useRef(0)

  useEffect(() => {
    // Clear any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Reset if address is too short
    if (!destinationAddress || destinationAddress.length < MIN_ADDRESS_LENGTH) {
      setResult(DEFAULT_RESULT)
      return
    }

    debounceRef.current = setTimeout(async () => {
      const thisRequestId = ++requestIdRef.current

      setResult((prev) => ({ ...prev, isLoading: true, error: null }))

      const mapsReady = await waitForMaps(MAPS_WAIT_TIMEOUT_MS)

      if (thisRequestId !== requestIdRef.current) return // stale

      if (!mapsReady) {
        setResult((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Google Maps failed to load',
        }))
        return
      }

      try {
        const service = new window.google.maps.DistanceMatrixService()
        service.getDistanceMatrix(
          {
            origins: [origin],
            destinations: [destinationAddress],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.IMPERIAL,
          },
          (response, status) => {
            if (thisRequestId !== requestIdRef.current) return // stale

            if (status !== 'OK' || !response) {
              setResult((prev) => ({
                ...prev,
                isLoading: false,
                error: 'Unable to calculate commute time',
              }))
              return
            }

            const element = response.rows[0]?.elements[0]
            if (!element || element.status !== 'OK') {
              setResult((prev) => ({
                ...prev,
                isLoading: false,
                error:
                  element?.status === 'ZERO_RESULTS'
                    ? 'No driving route found for this address'
                    : 'Could not calculate route',
              }))
              return
            }

            const durationMinutes = Math.round(element.duration.value / 60)
            const distanceMiles =
              Math.round((element.distance.value / 1609.344) * 10) / 10

            setResult({
              durationText: element.duration.text,
              durationMinutes,
              distanceText: element.distance.text,
              distanceMiles,
              isLoading: false,
              error: null,
            })
          }
        )
      } catch {
        if (thisRequestId !== requestIdRef.current) return
        setResult((prev) => ({
          ...prev,
          isLoading: false,
          error: 'An error occurred while calculating the commute',
        }))
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [destinationAddress, origin])

  return result
}
