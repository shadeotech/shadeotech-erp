// Minimal Google Maps type declarations (no npm package required)
// Covers AutocompleteService + PlacesService (programmatic API) and DistanceMatrixService

declare namespace google {
  namespace maps {
    namespace places {
      // ── Programmatic autocomplete (no DOM widget, no focus-trap issues) ───────
      class AutocompleteService {
        getPlacePredictions(
          request: AutocompletionRequest,
          callback: (
            predictions: AutocompletePrediction[] | null,
            status: PlacesServiceStatus
          ) => void
        ): void
      }

      class AutocompleteSessionToken {}

      interface AutocompletionRequest {
        input: string
        types?: string[]
        sessionToken?: AutocompleteSessionToken
        componentRestrictions?: { country: string | string[] }
      }

      interface AutocompletePrediction {
        place_id: string
        description: string
        structured_formatting: {
          main_text: string
          secondary_text: string
        }
      }

      // ── PlacesService (needed to resolve place_id → full address + geometry) ─
      class PlacesService {
        constructor(attrContainer: HTMLDivElement)
        getDetails(
          request: PlaceDetailsRequest,
          callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void
        ): void
      }

      interface PlaceDetailsRequest {
        placeId: string
        fields?: string[]
        sessionToken?: AutocompleteSessionToken
      }

      interface PlaceResult {
        formatted_address?: string
        address_components?: AddressComponent[]
        geometry?: {
          location?: {
            lat(): number
            lng(): number
          }
        }
      }

      interface AddressComponent {
        long_name: string
        short_name: string
        types: string[]
      }

      type PlacesServiceStatus =
        | 'OK'
        | 'ZERO_RESULTS'
        | 'NOT_FOUND'
        | 'INVALID_REQUEST'
        | 'REQUEST_DENIED'
        | 'UNKNOWN_ERROR'
        | 'OVER_QUERY_LIMIT'
    }

    interface MapsEventListener {
      remove(): void
    }

    class DistanceMatrixService {
      getDistanceMatrix(
        request: DistanceMatrixRequest,
        callback: (response: DistanceMatrixResponse | null, status: string) => void
      ): void
    }

    interface DistanceMatrixRequest {
      origins: string[]
      destinations: string[]
      travelMode: TravelMode
      unitSystem?: UnitSystem
    }

    interface DistanceMatrixResponse {
      rows: Array<{
        elements: Array<{
          status: string
          duration: { text: string; value: number }
          distance: { text: string; value: number }
        }>
      }>
    }

    enum TravelMode {
      DRIVING = 'DRIVING',
      WALKING = 'WALKING',
      BICYCLING = 'BICYCLING',
      TRANSIT = 'TRANSIT',
    }

    enum UnitSystem {
      METRIC = 0,
      IMPERIAL = 1,
    }

    namespace event {
      function clearInstanceListeners(instance: object): void
    }
  }
}
