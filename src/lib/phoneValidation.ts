/**
 * Shared phone number validation for forms (quotes, customers, appointments, etc.)
 */

export const PHONE_MAX_LENGTH = 10
export const PHONE_MIN_LENGTH = 10
export const PHONE_REGEX = /^\d{10}$/

/**
 * Validates a phone number. Returns an error message if invalid, undefined if valid.
 * Requires exactly 10 digits, no formatting characters.
 */
export function validatePhone(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined // Empty is allowed (optional field)
  if (!PHONE_REGEX.test(trimmed)) {
    return 'Phone number must be exactly 10 digits'
  }
  return undefined
}

/**
 * Sanitizes input for a phone field: strips invalid chars and enforces max length.
 * Use in onChange to prevent invalid input.
 */
export function sanitizePhoneInput(value: string): string {
  const digitsOnly = value.replace(/\D/g, '')
  return digitsOnly.slice(0, PHONE_MAX_LENGTH)
}
