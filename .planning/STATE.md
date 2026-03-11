# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-11)

**Core value:** Every broker who buys referrals completes onboarding fast, feels recognized, understands the network, and is set up to receive and close leads immediately.
**Current focus:** Phase 3 — Admin Panel

## Current Position

Phase: 3 of 4 (Admin Panel)
Plan: 2 of 2 in current phase
Status: Phase complete, pending verification
Last activity: 2026-03-11 — Completed 03-02-PLAN.md

Progress: [█████████░] 90%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 7min
- Total execution time: 0.23 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 2 | 14min | 7min |
| 03 | 2 | 10min | 5min |

**Recent Trend:**
- Last 5 plans: 12min, 2min, 8min, 2min
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 03-02: Server action for logout instead of separate API route
- 03-02: BrokerTable as "use client" for clipboard interaction
- 03-01: HMAC-SHA256 deterministic session cookie — avoids server-side session storage
- 03-01: proxy.ts default export named 'proxy' per Next.js 16 convention
- 03-01: DELETE handler on auth route for logout (clears cookie with Max-Age=0)
- 01-02: Select-then-insert over .upsert() to preserve existing broker tokens on duplicate webhooks
- 01-02: request.text() + JSON.parse for future HMAC support
- 01-01: Used createServiceClient (no cookies) for Route Handlers; createServerClient (cookies) for Server Components
- 01-01: Supabase project PPL-Onboarding created in East US (North Virginia)
- Pre-roadmap: Next.js + Supabase + Vercel (free tier) chosen as stack
- Pre-roadmap: Token-in-URL access — no broker auth, zero friction
- Pre-roadmap: Dynamic price per referral (deal_amount / batch_size), not hardcoded
- Pre-roadmap: Completion webhook back to GHL to trigger downstream automation
- Pre-roadmap: Admin password via env var ADMIN_PASSWORD (BadAaa$2026)

### Pending Todos

None yet.

### Blockers/Concerns

- **Phase 1**: GHL webhook payload field names must be confirmed against a real "Deal Won" test trigger before DB schema is locked — field name mismatch would require renaming Zod schema + DB columns
- **Phase 2**: Outbound GHL completion webhook URL and expected payload format unconfirmed — Daniel must provide before lib/ghl.ts is implemented
- **Phase 1**: Vercel Pro vs Hobby plan must be confirmed — Hobby plan prohibits commercial use

## Session Continuity

Last session: 2026-03-11
Stopped at: Completed Phase 3, pending verification
Resume file: None
