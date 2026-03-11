import * as crypto from 'crypto'

export const ADMIN_COOKIE_NAME = 'admin_session'

/**
 * Verify the admin password using timing-safe comparison.
 * Returns false if ADMIN_PASSWORD env var is not set (fail closed).
 */
export function verifyAdminAuth(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  if (password.length !== expected.length) return false

  try {
    return crypto.timingSafeEqual(
      Buffer.from(password),
      Buffer.from(expected)
    )
  } catch {
    return false
  }
}

/**
 * Generate a deterministic HMAC cookie value from the admin password.
 * This avoids needing server-side session storage — the cookie value
 * can be verified by recomputing the HMAC.
 */
export function generateCookieValue(): string {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) throw new Error('ADMIN_PASSWORD not set')

  return crypto
    .createHmac('sha256', secret)
    .update('admin_session')
    .digest('hex')
}

/**
 * Verify a session cookie value using timing-safe comparison.
 * Recomputes the expected HMAC and compares against the provided value.
 * This is the defense-in-depth layer (CVE-2025-29927).
 */
export function verifySessionCookie(cookieValue: string): boolean {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update('admin_session')
    .digest('hex')

  if (cookieValue.length !== expected.length) return false

  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieValue),
      Buffer.from(expected)
    )
  } catch {
    return false
  }
}
