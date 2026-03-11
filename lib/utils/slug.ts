import crypto from 'crypto'

/**
 * Generate a URL-friendly slug from a string.
 * Falls back to first + last name if company is empty.
 */
export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/['']/g, '')           // remove apostrophes
    .replace(/[^a-z0-9]+/g, '-')   // non-alphanumeric → hyphen
    .replace(/-+/g, '-')           // collapse consecutive hyphens
    .replace(/^-|-$/g, '')         // trim leading/trailing hyphens
}

/**
 * Generate a broker slug from company name (preferred) or broker name (fallback).
 * Appends a short random suffix if the slug already exists in the DB.
 */
export function generateBrokerSlug(
  companyName: string | null | undefined,
  firstName: string,
  lastName: string
): string {
  const base = companyName?.trim()
    ? toSlug(companyName)
    : toSlug(`${firstName} ${lastName}`)

  // guard against completely empty slugs
  return base || `broker-${crypto.randomBytes(3).toString('hex')}`
}

/**
 * Short random suffix for deduplication (4 hex chars).
 */
export function randomSuffix(): string {
  return crypto.randomBytes(2).toString('hex')
}
