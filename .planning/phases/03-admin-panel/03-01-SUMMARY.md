---
phase: 03-admin-panel
plan: 01
subsystem: auth
tags: [proxy, middleware, cookie, hmac, crypto, timingSafeEqual]

requires:
  - phase: 02-onboarding-flow
    provides: "Deployed app with shadcn UI components and dark theme"
provides:
  - "proxy.ts middleware guarding /admin routes"
  - "verifyAdminAuth password checker with timingSafeEqual"
  - "verifySessionCookie for server-side defense-in-depth"
  - "generateCookieValue HMAC-based deterministic token"
  - "POST /api/admin/auth login endpoint with httpOnly cookie"
  - "DELETE /api/admin/auth logout endpoint"
  - "Admin login page with dark-themed UI"
affects: [03-admin-panel]

tech-stack:
  added: []
  patterns: ["HMAC-SHA256 deterministic session cookie", "proxy.ts as Next.js 16 middleware (not middleware.ts)", "defense-in-depth: proxy gate + server-side verify"]

key-files:
  created:
    - proxy.ts
    - lib/auth.ts
    - app/api/admin/auth/route.ts
    - app/admin/login/page.tsx
  modified: []

key-decisions:
  - "HMAC-SHA256 deterministic cookie over random session token — avoids server-side session storage"
  - "proxy.ts default export named 'proxy' per Next.js 16 convention (not 'middleware')"
  - "DELETE handler on same auth route for logout (clears cookie with Max-Age=0)"

patterns-established:
  - "Defense-in-depth: proxy.ts checks cookie existence, server-side verifySessionCookie checks cookie validity"
  - "All secret comparisons via crypto.timingSafeEqual — never plain ==="

requirements-completed: [ADMN-01, ADMN-02]

duration: 8min
completed: 2026-03-11
---

# Phase 3 Plan 01: Admin Auth Summary

**Password-protected admin auth with proxy.ts middleware, HMAC session cookies, and defense-in-depth against CVE-2025-29927**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-11T14:01:10Z
- **Completed:** 2026-03-11T14:09:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- proxy.ts at project root guards /admin routes, redirects unauthenticated visitors to /admin/login
- lib/auth.ts provides verifyAdminAuth (password), verifySessionCookie (cookie), and generateCookieValue using crypto.timingSafeEqual for all comparisons
- POST /api/admin/auth validates password and sets httpOnly secure cookie with 24-hour expiry
- Dark-themed login page with shadcn Card, Input, Button components and error handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Create auth helper and login API route** - `ddd8983` (feat)
2. **Task 2: Create proxy.ts middleware and admin login page** - `0ef952c` (feat)

## Files Created/Modified
- `lib/auth.ts` - verifyAdminAuth, verifySessionCookie, generateCookieValue, ADMIN_COOKIE_NAME
- `app/api/admin/auth/route.ts` - POST login handler (sets cookie), DELETE logout handler (clears cookie)
- `proxy.ts` - Next.js 16 proxy middleware guarding /admin routes
- `app/admin/login/page.tsx` - Dark-themed login page with password input and error display

## Decisions Made
- Used HMAC-SHA256 deterministic cookie value instead of random token — eliminates need for server-side session storage while remaining verifiable
- Named export `proxy` (default) per Next.js 16 convention — `middleware` export name is no longer recognized
- Added DELETE handler on same auth route for logout to keep API surface minimal

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Next.js 16 proxy export name**
- **Found during:** Task 2 (proxy.ts creation)
- **Issue:** Plan referenced `export function middleware()` but Next.js 16.1.6 requires `export default function proxy()` — build failed with "Proxy is missing expected function export name"
- **Fix:** Changed to `export default function proxy(request: NextRequest)` per Next.js 16 convention
- **Files modified:** proxy.ts
- **Verification:** `npx next build` passes, proxy registered
- **Committed in:** `0ef952c` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for build to pass. No scope creep.

## Issues Encountered
None

## User Setup Required
None - ADMIN_PASSWORD env var is already set on Vercel.

## Next Phase Readiness
- Auth layer complete: proxy.ts + verifySessionCookie ready for admin dashboard (Plan 02)
- Plan 02 will import verifySessionCookie in app/admin/page.tsx for defense-in-depth
- Ready for Plan 03-02: admin dashboard with broker table

---
*Phase: 03-admin-panel*
*Completed: 2026-03-11*
