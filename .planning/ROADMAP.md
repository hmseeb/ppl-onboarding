# Roadmap: PPL Onboarding

## Overview

The build follows a strict data dependency chain: infrastructure and webhook ingestion come first (everything downstream depends on broker records existing), then the complete 7-step onboarding flow (the core product), then the admin panel (which reads the data the flow produces), then a final polish pass to close UX gaps and harden edge cases. Four phases, each delivering a testable, coherent capability before the next begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Supabase schema, Vercel project, GHL webhook endpoint — broker data flows in
- [ ] **Phase 2: Onboarding Flow** - Token routing, 7-step UI, completion webhook — brokers go from link to done
- [ ] **Phase 3: Admin Panel** - Password-protected broker list with status, dates, preferences, copyable links
- [ ] **Phase 4: Polish & Hardening** - Smooth animations, iOS Safari fixes, per-step validation, final copy pass

## Phase Details

### Phase 1: Foundation
**Goal**: GHL webhook fires and broker data lands correctly in Supabase, ready for the onboarding flow to consume
**Depends on**: Nothing (first phase)
**Requirements**: HOOK-01, HOOK-02, HOOK-03, HOOK-04, HOOK-05, HOOK-06, INFR-01, INFR-02, INFR-03
**Success Criteria** (what must be TRUE):
  1. A POST to /api/webhooks/ghl with a valid GHL payload creates a broker record in Supabase with a UUID token and returns a personalized onboarding URL
  2. A duplicate POST for the same ghl_contact_id returns the existing token URL without creating a second record
  3. A malformed or incomplete webhook payload returns a 400 with error details — no partial record is written
  4. A GET to /api/brokers/[token] returns the broker's data and current onboarding status
  5. The Supabase project does not auto-pause: keepalive mechanism is active before first production webhook fires
**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Project scaffolding, Supabase schema, and shared library layer
- [ ] 01-02-PLAN.md — GHL webhook endpoint, broker token GET, and health keepalive

### Phase 2: Onboarding Flow
**Goal**: A broker who clicks their unique onboarding link completes all 7 steps, selects delivery preferences, and triggers the GHL completion webhook — feeling recognized and ready to close deals
**Depends on**: Phase 1
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05, ONBD-06, ONBD-07, ONBD-08, ONBD-09, ONBD-10, ONBD-11, ONBD-12, ONBD-13, GARD-01, GARD-02, DSGN-01, DSGN-02, DSGN-03, DSGN-05, DSGN-06
**Success Criteria** (what must be TRUE):
  1. A broker who clicks their token URL sees their name, company, and deal details pre-filled — no re-entry needed — and can edit any field inline before proceeding
  2. A broker completes all 7 steps in order, with a progress bar showing their position throughout, and their delivery preferences (SMS/email/CRM webhook, hours, weekend pause) are saved to Supabase on step 7 completion
  3. A broker can close and reopen their onboarding link and resume at the step where they left off
  4. On step 7 completion, a webhook fires to GHL with the broker's ghl_contact_id, onboarding status, and delivery preferences
  5. A broker who revisits a completed link sees the "already onboarded" screen; a broker with an invalid token sees a clean error page with Daniel's contact info
**Plans:** 5 plans

Plans:
- [ ] 02-01-PLAN.md — Install deps, shadcn init, dark theme, delivery schema, GHL webhook caller, API routes
- [ ] 02-02-PLAN.md — Token routing, guard pages, OnboardingStepper, Steps 1-2 (Welcome + Delivery)
- [ ] 02-03-PLAN.md — Steps 3-5 (How It Works, ROI Calculator, Best Practices)
- [ ] 02-04-PLAN.md — Steps 6-7 (Replacement Policy, Confirmation + completion flow)
- [ ] 02-05-PLAN.md — Build verification and visual/functional checkpoint

### Phase 3: Admin Panel
**Goal**: Daniel can see every broker's onboarding status, delivery preferences, and key dates in one password-protected page, and copy any broker's onboarding link with one click
**Depends on**: Phase 2
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04
**Success Criteria** (what must be TRUE):
  1. Visiting /admin without the correct password is blocked — neither middleware spoofing nor direct page access bypasses the server-side check
  2. Daniel can see all brokers in a list with name, company, status (not_started/in_progress/completed), webhook received date, onboarding completed date, and delivery preferences
  3. Daniel can copy any broker's onboarding link to clipboard with one click
**Plans:** 2 plans

Plans:
- [ ] 03-01-PLAN.md — Admin auth: proxy.ts middleware, login page, auth API, server-side verify helper
- [ ] 03-02-PLAN.md — Admin dashboard: broker table with status, dates, preferences, copyable links

### Phase 4: Polish & Hardening
**Goal**: The onboarding flow feels premium and works flawlessly on mobile — smooth step transitions, no iOS Safari keyboard overlap, and validation prevents advancing with incomplete data
**Depends on**: Phase 3
**Requirements**: DSGN-04, INFR-04
**Success Criteria** (what must be TRUE):
  1. Step transitions animate smoothly — steps slide/fade in/out without layout jumps or flicker on mobile
  2. On iOS Safari, the onboarding form is never obscured by the keyboard; the viewport adjusts correctly using dvh units
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/2 | Not started | - |
| 2. Onboarding Flow | 0/5 | Not started | - |
| 3. Admin Panel | 0/2 | Not started | - |
| 4. Polish & Hardening | 0/TBD | Not started | - |
