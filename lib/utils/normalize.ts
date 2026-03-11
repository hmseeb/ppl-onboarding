/**
 * Converts a string to title case (first letter of each word capitalized).
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Formats a phone number to (XXX) XXX-XXXX format.
 * Handles 10-digit and 11-digit (with leading 1) numbers.
 * Returns null for empty/null input, or the original string if format is unrecognized.
 */
export function formatPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return phone // return as-is if format unrecognized
}
