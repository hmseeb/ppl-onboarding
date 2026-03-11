---
phase: 01-foundation
plan: 02
subsystem: api
tags: [nextjs, route-handlers, supabase, zod, webhook, idempotent, keepalive]

requires:
  - phase: 01-foundation
    provides: Supabase clients, Zod schema, Broker types, normalization utils
provides:
  - GHL webhook POST endpoint with Zod validation and idempotent upsert
  - Broker token GET endpoint for onboarding flow data loading
  - Health keepalive endpoint for cron-job.org Supabase ping
affects: [phase-2, phase-3]

tech-stack:
  added: []
  patterns: [select-then-insert-idempotency, race-condition-unique-violation-catch, raw-body-for-hmac]

key-files:
  created:
    - app/api/webhooks/ghl/route.ts
    - app/api/brokers/[token]/route.ts
    - app/api/health/route.ts
  modified: []

key-decisions:
  - "Select-then-insert pattern over .upsert() to preserve existing broker tokens"
  - "Race condition handling via catching Postgres 23505 unique violation and re-querying"
  - "request.text() + JSON.parse instead of request.json() to preserve raw body for future HMAC"

patterns-established:
  - "Idempotent webhook pattern: SELECT existing → return if found → INSERT new → catch unique violation → re-query"
  - "Health endpoint pattern: lightweight DB SELECT for external cron keepalive"

requirements-completed: [HOOK-01, HOOK-02, HOOK-03, HOOK-04, HOOK-05, HOOK-06, INFR-03]

duration: 2min
completed: 2026-03-11
---

# Phase 1 Plan 02: API Endpoints Summary

**GHL webhook handler with Zod validation and idempotent select-then-insert upsert, broker token GET, and Supabase keepalive health endpoint**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-11T12:58:15Z
- **Completed:** 2026-03-11T13:00:04Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- POST /api/webhooks/ghl validates GHL payloads with Zod, creates broker records with idempotent select-then-insert, handles race conditions via unique violation catch
- GET /api/brokers/[token] returns broker data excluding internal fields (id, ghl_contact_id)
- GET /api/health performs lightweight Supabase SELECT for cron-job.org keepalive
- All three endpoints build and type-check with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement GHL webhook POST endpoint** - `0fcc72f` (feat)
2. **Task 2: Implement broker token GET and health keepalive** - `e574344` (feat)

## Files Created/Modified
- `app/api/webhooks/ghl/route.ts` - GHL webhook handler with Zod validation, idempotent upsert, name normalization
- `app/api/brokers/[token]/route.ts` - Broker data lookup by UUID token
- `app/api/health/route.ts` - Supabase keepalive ping for cron-job.org

## Decisions Made
- Used select-then-insert instead of .upsert() to preserve existing broker tokens on duplicate webhooks
- Added race condition handling: catches Postgres 23505 unique violation and re-queries the existing row
- Used request.text() + JSON.parse (not request.json()) to preserve raw body for future HMAC signature verification

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

Remaining manual setup:
- cron-job.org must be configured to ping https://ppl-onboarding.vercel.app/api/health every 72 hours

## Next Phase Readiness
- Phase 1 complete, ready for verification
- All HOOK-* and INFR-* requirements architecturally addressed
- Runtime verification requires the deployed endpoints (Vercel auto-deploy from GitHub push)

---
*Phase: 01-foundation*
*Completed: 2026-03-11*
