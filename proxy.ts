import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_COOKIE_NAME = 'admin_session'

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only intercept /admin routes, excluding /admin/login and /api/admin/*
  if (
    pathname.startsWith('/admin') &&
    pathname !== '/admin/login' &&
    !pathname.startsWith('/api/admin')
  ) {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)

    // First gate: redirect to login if no cookie present
    // The real verification happens server-side in the admin page (defense in depth)
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
