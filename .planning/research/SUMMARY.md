# Project Research Summary

**Project:** PPL Onboarding — Webhook-driven broker onboarding activation app
**Domain:** Webhook-triggered multi-step onboarding for a pay-per-lead broker network (B2B SaaS / internal tooling)
**Researched:** 2026-03-11
**Confidence:** HIGH

## Executive Summary

This is a webhook-driven, token-gated onboarding activation tool — not a general-purpose SaaS app. The architecture is narrowly scoped: GoHighLevel fires a webhook on "Deal Won", the app creates a personalized broker record with a UUID token, and brokers complete a 7-step onboarding flow via a unique link. The recommended approach is Next.js 16 (App Router) + Supabase + Vercel Pro, with no auth system, no login, and no session management. The broker's URL token IS their credential — zero friction for a "closer" audience opening links on their phone immediately after a sales call. All personalization data arrives via the inbound webhook; brokers only need to supply delivery preferences and acknowledge the replacement policy.

The central technical challenge is correctness at the integration boundaries: the inbound GHL webhook must be idempotent (upsert on `ghl_contact_id`), the outbound completion webhook must be fire-and-forget with `waitUntil` (not a bare unresolved promise), and the Supabase free tier must have a keepalive to prevent auto-pause on slow deal weeks. The stack is production-ready and all version numbers are npm-verified as of today. The build order strictly follows data dependencies: DB schema first, then webhook handler (the entry point for all data), then the onboarding UI, then admin tooling.

The primary risks are operational rather than architectural. The Supabase free-tier auto-pause could silently drop broker webhooks during a slow sales week with no alerting. The middleware-only admin auth pattern is vulnerable to CVE-2025-29927 (CVSS 9.1) and must include a server-side password check in addition to the middleware layer. These are both preventable with day-one infrastructure decisions, not retrofits.

## Key Findings

### Recommended Stack

The stack is a tight, well-justified composition — every library earns its place. Next.js 16 with App Router provides Server Components (for SSR of pre-filled broker data without loading states), Route Handlers (for the GHL webhook endpoint), and the `proxy.ts` middleware file for admin auth. Supabase replaces an ORM — direct SQL access via `@supabase/supabase-js` with two client files (server and browser) per the SSR docs. Tailwind CSS v4 (CSS-first, no config file) + shadcn/ui 4.x handles the dark theme with a `#EF4444` red accent in 5 CSS variables. The `motion` library (imported from `"motion/react"`, not the deprecated `"framer-motion"` path) handles step transition animations.

**Core technologies:**
- **Next.js 16.1.6**: App Router, Route Handlers, Server Components, `proxy.ts` for admin protection — all in one codebase
- **React 19.2**: Ships with Next.js 16; React Compiler eliminates manual memoization for form step state
- **Supabase (@supabase/supabase-js ^2.99.1 + @supabase/ssr ^0.9.0)**: Postgres DB for broker records; free tier (500MB) is sufficient; `createServerClient` / `createBrowserClient` pattern required
- **Tailwind CSS 4.2.1 + shadcn/ui 4.0.2**: Dark theme, red accent, accessible component primitives (button, card, input, progress, dialog)
- **react-hook-form 7.71.2 + @hookform/resolvers 5.2.2 + zod 4.3.6**: Form state for delivery preferences (step 2) and inline editing (step 1); Zod also validates inbound webhook payload before DB write
- **motion 12.35.2**: Step transition animations; requires `"use client"` on all motion components
- **Vercel Pro** (not Hobby — commercial use explicitly prohibited on Hobby): Serverless functions for webhook endpoints, 10s timeout on free tier

**Critical version notes:**
- Next.js 16 uses `proxy.ts` not `middleware.ts` for middleware
- `@supabase/ssr` replaces the deprecated `@supabase/auth-helpers-nextjs` — do not mix them
- `@hookform/resolvers` v5 is required for Zod v4 compatibility (breaking change from v3)
- `tailwindcss-animate` is deprecated; shadcn init auto-installs `tw-animate-css`
- Node.js 20.9+ required for Next.js 16

### Expected Features

The full feature list has clear MVP boundaries. All 15 P1 features are required for launch because they form a dependency chain — the completion callback to GHL depends on delivery preferences being saved, which depends on the 7-step flow, which depends on token routing, which depends on the webhook endpoint. No feature in the P1 list is optional.

**Must have (table stakes):**
- Webhook ingestion endpoint with idempotent upsert — the entry point for all data
- Token generation and unique URL routing (`/onboard/[token]`) — the personalization mechanism
- 7-step onboarding flow with pre-filled data from webhook payload — the core product
- Delivery preference form (step 2: SMS/email/CRM webhook, hours, weekend toggle) — blocks lead delivery without this
- Completion callback to GHL — triggers downstream automation; useless app without it
- Progress bar ("Step X of 7") — abandonment prevention; users won't proceed without knowing the end
- Already-onboarded guard — re-visits must show a summary screen, not the form again
- Invalid token error page — shows Daniel's phone number, not a crash screen
- Admin panel (`/admin`) — password-protected broker list with status, dates, prefs, copyable links
- Mobile-first responsive design — brokers open this on their phone immediately after the sales call
- Inline editing on step 1 — CRM data will be stale or wrong; editing reduces support calls
- ROI calculator (step 4) — high-value differentiator using `deal_amount / batch_size` already in payload
- Replacement policy checkbox (step 6) — legal acknowledgment gating step 7

**Should have (differentiators):**
- Smooth step transitions via `motion` (AnimatePresence) — premium feel; add after core flow confirmed
- Conditional CRM webhook URL field (show only when delivery method = CRM) — progressive disclosure
- Copyable onboarding link button in admin panel — one-click resend without token regeneration
- "Closer tone" copy throughout — direct, dollar-motivated language for a sales professional audience
- Visual referral timeline (step 3: Day 1 → follow up → Day 7 replace) — expectation-setting, reduces "where are my leads?" support calls

**Defer (v2+):**
- Broker dashboard / self-service preference updates — only if volume justifies it; GHL handles stats
- Rate limiting on webhook endpoint — low-volume internal tool; add when patterns emerge
- Multi-language support — English-only for v1; no validated non-English broker volume
- Email/SMS delivery of onboarding link — GHL handles this; app is the destination, not the delivery mechanism

**Explicit anti-features (do not build):**
- Broker login / account creation — token-in-URL IS the credential; auth adds friction
- Link expiration / time limits — idempotency guard handles re-visits; permanent links are simpler
- Syncing broker edits back to GHL — bidirectional sync creates conflict resolution complexity

### Architecture Approach

The architecture is a clean 3-layer Next.js App Router setup: Route Handlers (API layer) handle webhook I/O, Server Components (page layer) do SSR with pre-fetched broker data, and Client Components (interactive layer) manage form state and step transitions. No global state manager is needed — the 7-step flow is linear, single-session, and all step state lives in `OnboardingStepper` (`useState`). The only persistent state is the Supabase `brokers` table. One table, one schema, no joins.

**Major components:**
1. `app/api/webhooks/ghl/route.ts` — Inbound webhook handler: validate payload with Zod, upsert broker record, return 200 fast
2. `app/onboard/[token]/page.tsx` — Server Component: validate token, fetch broker, redirect on error/completed, pass data to stepper
3. `OnboardingStepper` (Client Component) — Step navigation, progress bar, form state collection, step transitions
4. `StepN` components (7 client components) — One file per step: Welcome+editing, Delivery prefs, How It Works, ROI calc, Best practices, Policy checkbox, Confirmation
5. `app/api/brokers/[token]/complete/route.ts` — Completion handler: update Supabase status, fire GHL callback with `waitUntil`
6. `app/admin/page.tsx` — Server Component (protected by `proxy.ts`): renders BrokerTable
7. `lib/supabase/server.ts` + `lib/supabase/client.ts` — Two separate Supabase clients (server vs browser); never mix

**Key patterns:**
- **Token-in-URL access** (no auth): URL token is the only credential; server validates in page.tsx before any HTML is sent
- **Webhook idempotency via UNIQUE + upsert**: `UNIQUE(ghl_contact_id)` at DB level + `.upsert({ onConflict: 'ghl_contact_id' })` — atomic, race-safe
- **waitUntil for GHL callback**: `waitUntil(notifyGHL(broker))` from `@vercel/functions` — guarantees execution after Vercel response sent without blocking user
- **Server Component + Client Component split**: Server fetches data (no loading spinner, data arrives pre-filled), Client Component manages interactive state

### Critical Pitfalls

1. **GHL webhook double-processing** — Without `UNIQUE(ghl_contact_id)` + upsert, duplicate webhooks create two broker records with two tokens. Prevention: add the DB constraint before accepting any production webhooks; upsert is atomic and race-safe.

2. **Supabase free tier auto-pause** — Projects pause after 7 days of zero DB activity. A slow sales week = paused DB = missed broker onboarding = cold leads. Prevention: set up a GitHub Actions or Vercel cron keepalive on day one, before go-live.

3. **Middleware-only admin auth (CVE-2025-29927, CVSS 9.1)** — Spoofed `x-middleware-subrequest` header bypasses Next.js middleware, exposing all broker PII. Prevention: add server-side password check in the admin page Server Component in addition to middleware; use `crypto.timingSafeEqual` for comparison; use Next.js 15.2.3+ (patches vulnerability).

4. **Vercel 10-second function timeout on cold starts** — Cold-start + Supabase latency + heavy logic in the webhook handler can breach 10s. Prevention: keep the webhook handler intentionally thin (only upsert + return 200); no secondary API calls in the inbound handler; use Supabase transaction mode pooler (port 6543).

5. **Step state lost on browser refresh** — React `useState` only for step progress means refreshing at step 5 drops the broker back to step 1. Prevention: add `current_step` and `step_data` (JSONB) columns to the DB schema from the start; persist after each step advancement; load on page entry.

## Implications for Roadmap

Based on the strict data dependency chain (DB → webhook → token URL → onboarding flow → admin), the natural phase structure follows the build order from ARCHITECTURE.md. Each phase produces a testable artifact before the next phase begins.

### Phase 1: Foundation — Database + Webhook Endpoint

**Rationale:** Everything else is blocked until broker records exist. The DB schema and inbound webhook handler are the only true dependencies in this project. This phase must be built correctly (idempotency, thin handler, data normalization) or all downstream phases inherit the bugs. This is also where most critical pitfalls live.

**Delivers:** A working GHL → Supabase pipeline. After this phase, a "Deal Won" event in GHL creates a broker record in Supabase with a UUID token. The onboarding URL can be manually constructed and tested.

**Addresses:** Webhook ingestion, token generation, idempotent upsert, Zod payload validation, data normalization (title-case names, phone formatting, null guards for `deal_amount`/`batch_size`)

**Avoids:** GHL double-processing (Pitfall 1), Vercel 10-second timeout (Pitfall 4), raw body consumed before verification (Pitfall 5), weak token generation (Pitfall 8), pre-filled data not sanitized (Pitfall 7)

**Infrastructure included:** Supabase project setup, DB schema creation, Vercel Pro project, environment variables, Supabase keepalive cron (Pitfall 2)

### Phase 2: Onboarding Flow — Token Routing + 7-Step UI

**Rationale:** With broker records in the DB, the onboarding URL can be validated and the personalized experience built. This is the core product — the reason the app exists. Steps should be built in sequence (1 → 7) because earlier steps inform the data shape passed to later steps.

**Delivers:** A fully functional broker onboarding experience. A broker who clicks their unique link completes all 7 steps, delivery preferences are saved to Supabase, and the GHL completion callback fires.

**Addresses:** Token URL routing (`/onboard/[token]`), already-onboarded guard, invalid token error page, 7-step onboarding flow (all steps), pre-filled data + inline editing (step 1), delivery preferences form (step 2), visual referral timeline (step 3), ROI calculator (step 4), replacement policy checkbox (step 6), completion callback via `waitUntil`, progress bar, mobile-first responsive layout, dark theme + branding

**Avoids:** Client-side token validation only (validate server-side in page.tsx), separate tables for step state (use `status` field only), Supabase Auth for broker access (token-in-URL only), step state lost on refresh (add `current_step` + `step_data` to schema)

**Uses:** Server Component + Client Component split pattern, `motion` for step transitions, `react-hook-form` + `zod` for delivery preferences form

### Phase 3: Admin Panel

**Rationale:** After the onboarding flow is complete and verified end-to-end, the admin panel is straightforward — a protected read from the `brokers` table. Build this last so the data it displays is known and complete.

**Delivers:** A password-protected `/admin` page showing all broker records with status, dates, delivery preferences, and copyable onboarding links. Enables monitoring of real broker completions from day one of launch.

**Addresses:** Password protection via `proxy.ts` + server-side check (defense in depth), admin login flow, broker list with status and dates, copyable link button per row

**Avoids:** Middleware-only admin auth (CVE-2025-29927), plain `===` password compare (use `crypto.timingSafeEqual`), loading all broker rows without pagination (add limit/offset from the start)

### Phase 4: Polish + Hardening

**Rationale:** After end-to-end flow is verified with real broker data, add the differentiating UX polish and close the "looks done but isn't" checklist items from PITFALLS.md.

**Delivers:** Smooth step transitions (AnimatePresence), conditional CRM webhook URL field, `prefers-reduced-motion` support, iOS Safari keyboard/viewport fixes (`dvh` not `vh`), per-step validation before advancing, "closer tone" copy pass

**Addresses:** Smooth step transitions (P2), conditional delivery fields (P2), mobile viewport iOS keyboard bug, UX pitfalls (validation only on final submit, back button losing data, animations blocking on slow mobile)

### Phase Ordering Rationale

- Phase 1 before everything: the webhook handler creates all broker data; nothing else can be built or tested without it
- Phase 2 before Phase 3: admin panel displays onboarding data — the schema, completion status, and delivery prefs must be defined before the table can render them meaningfully
- Phase 3 before Phase 4: hardening requires a known, stable feature set; polish added to moving targets creates churn
- ROI calculator (step 4) stays in Phase 2 despite `deal_amount`/`batch_size` dependency — these fields are set in Phase 1's DB schema and webhook handler, so the dependency is already satisfied when Phase 2 begins
- Supabase keepalive cron belongs in Phase 1 infrastructure, not Phase 4 — it prevents data loss that cannot be recovered retroactively

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Webhook endpoint):** GHL webhook payload field names must be confirmed against a real "Deal Won" event payload before schema is finalized. ARCHITECTURE.md lists expected field names but these should be verified against an actual GHL workflow test trigger before schema is locked.
- **Phase 2 (Completion callback):** The outbound GHL webhook URL and expected payload format for tagging/automation triggers must be confirmed with Daniel before implementation. The `lib/ghl.ts` pattern is clear but the endpoint URL and required payload fields are not documented in research.

Phases with standard patterns (skip research-phase):
- **Phase 3 (Admin panel):** Standard Next.js middleware + Supabase query pattern; well-documented, no novel integrations
- **Phase 4 (Polish):** CSS animations, form validation patterns — established, no research needed

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All package versions npm-verified on 2026-03-11; official docs consulted for Next.js 16, Supabase SSR, shadcn 4.x, Vercel limits |
| Features | MEDIUM-HIGH | Core patterns verified across multiple sources; B2B onboarding patterns drawn from PartnerStack and Stripe Hosted Onboarding; broker-specific nuances (closer tone, replacement policy) inferred from project context |
| Architecture | HIGH | Verified against Next.js 16.1.6 official docs + Supabase official docs; all code patterns are documented patterns, not inventions |
| Pitfalls | MEDIUM | Most critical items verified with official docs (CVE-2025-29927, Vercel timeout limits, Supabase auto-pause); GHL retry behavior verified via official GHL docs |

**Overall confidence:** HIGH

### Gaps to Address

- **GHL webhook payload field names:** The exact field names in the GHL "Deal Won" webhook payload (e.g., `ghl_contact_id`, `deal_amount`, `batch_size`, `primary_vertical`) must be validated against a real test trigger before the DB schema is locked in Phase 1. If field names differ, the Zod schema and DB columns need renaming before any data is stored.

- **Outbound GHL webhook details:** The endpoint URL, authentication method, and required payload format for the completion callback to GHL are unspecified in research. Daniel needs to confirm the GHL workflow that receives the completion event and what fields it expects. This must be resolved before Phase 2 implementation of `lib/ghl.ts`.

- **Supabase free tier project pause behavior:** Research confirms auto-pause at 7 days but the keepalive mechanism (GitHub Actions cron vs Vercel cron) should be chosen and implemented before first webhook fires in production.

- **Vercel Pro seat count:** Stack research confirms Hobby plan is prohibited for commercial use. Verify whether the project needs 1 or multiple seats on Vercel Pro before provisioning.

## Sources

### Primary (HIGH confidence)
- Next.js 16.1.6 official docs (route handlers, proxy.ts, v16 upgrade guide) — https://nextjs.org/docs/app/api-reference/file-conventions/route
- Supabase SSR docs (createBrowserClient / createServerClient) — https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase Upsert documentation — https://supabase.com/docs/reference/javascript/upsert
- npm registry (all packages verified 2026-03-11) — next@16.1.6, @supabase/supabase-js@2.99.1, @supabase/ssr@0.9.0, motion@12.35.2, react-hook-form@7.71.2, @hookform/resolvers@5.2.2, zod@4.3.6, tailwindcss@4.2.1, next-themes@0.4.6, uuid@13.0.0, shadcn@4.0.2
- shadcn/ui official docs (Next.js installation, Tailwind v4 migration) — https://ui.shadcn.com/docs/installation/next
- Vercel Hobby plan commercial use restriction — https://vercel.com/docs/plans/hobby
- Vercel Functions Limitations — https://vercel.com/docs/functions/limitations
- CVE-2025-29927 Next.js Middleware Bypass (CVSS 9.1) — https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass
- GoHighLevel Webhook Integration Guide — https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html
- GoHighLevel Automated Webhook Retries — https://help.gohighlevel.com/support/solutions/articles/155000007071-automated-webhook-retries
- Webhook Idempotency Implementation — https://hookdeck.com/webhooks/guides/implement-webhook-idempotency
- Stripe Hosted Onboarding (pre-filled data pattern) — https://docs.stripe.com/connect/hosted-onboarding

### Secondary (MEDIUM confidence)
- PartnerStack partner onboarding patterns — https://partnerstack.com/resources/partner-playbook/plays/onboarding-and-activating-referrals-for-a-partner-program
- B2B Onboarding Best Practices 2026 — https://www.guidde.com/knowledge-hub/b2b-onboarding-best-practices-2026-guide
- Mobile Onboarding UX Best Practices 2026 — https://www.designstudiouiux.com/blog/mobile-app-onboarding-best-practices/
- Onboarding UX: B2B Product Introduction — https://blog.logrocket.com/ux-design/onboarding-ux-b2b-introduction/
- Vercel fire-and-forget / waitUntil — https://community.vercel.com/t/fire-and-forget-next-js-api-route/15865
- Supabase free tier auto-pause prevention — https://shadhujan.medium.com/how-to-keep-supabase-free-tier-projects-active-d60fd4a17263
- Next.js App Router raw body handling — https://dev.to/thekarlesi/how-to-handle-stripe-and-paystack-webhooks-in-nextjs-the-app-router-way-5bgi
- Password protecting Next.js routes — https://www.alexchantastic.com/password-protecting-next

### Tertiary (LOW confidence)
- Onboarding anti-patterns — https://www.dcaulfield.com/onboarding-antipatterns (single source; patterns corroborated by established UX literature)
- Mobile UX patterns 2026 — https://www.sanjaydey.com/mobile-ux-ui-design-patterns-2026-data-backed/ (blog source; patterns align with established research)

---
*Research completed: 2026-03-11*
*Ready for roadmap: yes*
