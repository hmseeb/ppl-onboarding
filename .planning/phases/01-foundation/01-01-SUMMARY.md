---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [nextjs, supabase, zod, typescript, tailwind, vercel]

requires:
  - phase: none
    provides: first phase
provides:
  - Next.js 16 project scaffold with TypeScript and Tailwind CSS v4
  - Supabase brokers table with UNIQUE constraints on token and ghl_contact_id
  - Server and browser Supabase clients (createServiceClient, createServerClient, createClient)
  - Zod webhook validation schema with coercion for numeric fields
  - Broker TypeScript type matching database schema
  - Normalization utilities (toTitleCase, formatPhone)
affects: [01-02, phase-2, phase-3]

tech-stack:
  added: [next@16.1.6, react@19, "@supabase/supabase-js", "@supabase/ssr", zod, "@vercel/functions", next-themes, tailwindcss@4]
  patterns: [app-router-route-handlers, service-role-client-for-webhooks, zod-coerce-for-ghl-strings]

key-files:
  created:
    - lib/supabase/server.ts
    - lib/supabase/client.ts
    - lib/types.ts
    - lib/validations/webhook.ts
    - lib/utils/normalize.ts
    - supabase/schema.sql
    - .env.example
    - app/layout.tsx
    - app/page.tsx
  modified: []

key-decisions:
  - "Used createServiceClient (no cookie adapter) for Route Handlers and createServerClient (with cookies) for Server Components — webhook handlers don't need sessions"
  - "Zod optional fields use .optional().nullable() to handle both undefined and null from GHL"
  - "Fixed .gitignore to use specific .env.local pattern instead of .env* glob so .env.example can be committed"

patterns-established:
  - "Service client pattern: createServiceClient() for all Route Handler DB access"
  - "Zod coercion pattern: z.coerce.number() for GHL numeric fields that arrive as strings"

requirements-completed: [INFR-01, INFR-02]

duration: 12min
completed: 2026-03-11
---

# Phase 1 Plan 01: Project Scaffolding & Shared Library Summary

**Next.js 16 scaffold with Supabase brokers table, Zod webhook schema, TypeScript Broker type, and dual Supabase clients (service + browser)**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-11T12:43:36Z
- **Completed:** 2026-03-11T12:55:45Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Next.js 16 project scaffolded with TypeScript, Tailwind CSS v4, ESLint, dark theme
- Supabase project created (PPL-Onboarding, ref: kovcroqqudozpaocpeks), brokers table deployed via migration
- Shared library layer: dual Supabase clients, Zod webhook schema with coercion, Broker type, normalization utils
- Vercel project linked and deployed to https://ppl-onboarding.vercel.app with all env vars configured
- All dependencies installed: @supabase/supabase-js, @supabase/ssr, zod, @vercel/functions, next-themes

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project and install all dependencies** - `82a6937` (feat)
2. **Task 2: Create Supabase schema SQL and shared library layer** - `e7f0986` (feat)

## Files Created/Modified
- `package.json` - Next.js 16 project with all dependencies
- `app/layout.tsx` - Root layout with ThemeProvider (forced dark)
- `app/page.tsx` - Placeholder page confirming app is running
- `app/globals.css` - Tailwind v4 with dark theme CSS vars
- `lib/supabase/server.ts` - createServiceClient and createServerClient
- `lib/supabase/client.ts` - createClient for browser components
- `lib/types.ts` - Broker interface and BrokerStatus type
- `lib/validations/webhook.ts` - GHLWebhookSchema with Zod coercion
- `lib/utils/normalize.ts` - toTitleCase and formatPhone utilities
- `supabase/schema.sql` - Brokers table DDL
- `.env.example` - Template for required env vars
- `.env.local` - Local env vars with real Supabase credentials (gitignored)
- `.gitignore` - Fixed to allow .env.example commits
- `tsconfig.json` - TypeScript config with @/* path alias

## Decisions Made
- Used separate createServiceClient (no cookies) for Route Handlers vs createServerClient (with cookies) for Server Components
- Fixed .gitignore from `.env*` to specific patterns so .env.example is tracked
- Supabase project created in East US (North Virginia) region for low-latency Vercel integration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed .gitignore pattern blocking .env.example**
- **Found during:** Task 1 (committing scaffold)
- **Issue:** create-next-app's .gitignore used `.env*` glob which blocked `.env.example` from being committed
- **Fix:** Changed to specific patterns: `.env`, `.env.local`, `.env*.local`
- **Files modified:** .gitignore
- **Verification:** `git add .env.example` succeeds
- **Committed in:** 82a6937 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor .gitignore fix, no scope creep.

## Issues Encountered
None

## User Setup Required

Infrastructure was configured programmatically:
- Supabase project created via CLI (PPL-Onboarding, ref: kovcroqqudozpaocpeks)
- Brokers table deployed via `supabase db push`
- Vercel project linked and deployed with all env vars set
- GitHub repo created and pushed (hmseeb/ppl-onboarding)

Remaining manual setup:
- cron-job.org keepalive (will be configured after Plan 01-02 implements /api/health)

## Next Phase Readiness
- Ready for Plan 01-02: All shared library files compile, Supabase connected, Vercel deployed
- Broker table exists in Supabase with correct schema and constraints
- All env vars configured in both .env.local and Vercel

---
*Phase: 01-foundation*
*Completed: 2026-03-11*
