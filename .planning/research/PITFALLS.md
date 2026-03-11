# Pitfalls Research

**Domain:** Webhook-driven multi-step onboarding app (Next.js + Supabase + Vercel, free tier)
**Researched:** 2026-03-11
**Confidence:** MEDIUM (WebSearch verified with official docs for most critical items)

---

## Critical Pitfalls

### Pitfall 1: GHL Webhook Double-Processing (No Idempotency)

**What goes wrong:**
GoHighLevel retries failed webhook deliveries and can fire the same "Deal Won" event multiple times under normal conditions (workflow re-runs, GHL support actions, duplicate contact records). Without idempotency, the endpoint inserts two broker rows for the same person, generating two different tokens, and both onboarding links work — meaning a broker could complete onboarding twice, generating two GHL completion webhooks.

**Why it happens:**
Developers implement a simple `INSERT INTO brokers` without checking if the contact already exists. GHL also fires the retry payload with the same `deliveryId` header, but if you don't log and check that header before processing, duplicates slip through. The retry window is up to 6 retries over ~70 minutes (only on HTTP 429 responses from GHL's perspective, but workflow re-runs are a separate, unconstrained source of duplicates).

**How to avoid:**
- Add a `UNIQUE` constraint on `ghl_contact_id` in Supabase
- Use `supabase.from("brokers").upsert({ ... }, { onConflict: "ghl_contact_id" })` — this is atomic and race-safe at the DB level
- Return `200 OK` immediately if the contact already exists (idempotent success)
- Do NOT return 429 unless you're actually rate-limited — GHL retries on 429 specifically

**Warning signs:**
- Broker reports receiving two onboarding link emails
- Database shows two rows with identical email/phone but different tokens
- GHL contact has two completion webhook events logged

**Phase to address:**
Webhook endpoint implementation (Phase 1) — must be built idempotent from day one, not retrofitted.

---

### Pitfall 2: Supabase Free Tier Auto-Pause Kills Production

**What goes wrong:**
Supabase free tier projects pause after 7 consecutive days of zero database activity. The next webhook from GHL hits a paused database, returns a 5xx error, and — because GHL doesn't retry on 5xx — that broker's onboarding link is never generated. The lead goes cold. You don't notice until a broker complains or Daniel manually checks.

**Why it happens:**
The project is a triggered flow (webhook-only), not a user-driven app with daily traffic. A slow week in deal flow means no DB activity. Free tier has no SLA and no auto-resume on incoming traffic — it requires a manual dashboard unpause or an automated keepalive.

**How to avoid:**
- Set up a GitHub Actions cron job (free) to run `SELECT 1` against Supabase every 3-4 days
- Alternative: Vercel cron endpoint (available on free tier, once per day) that does a lightweight DB read
- Keep a Supabase dashboard bookmark with a "unpause" shortcut for manual recovery
- Monitor: Set up a free UptimeRobot ping to the `/api/health` endpoint that also touches the DB

**Warning signs:**
- Supabase dashboard shows project status as "Paused"
- GHL shows webhook delivery as failed with no retry
- No new rows in `brokers` table despite deals closing in GHL

**Phase to address:**
Infrastructure setup (Phase 1) — add keepalive before go-live, not after first outage.

---

### Pitfall 3: Next.js Middleware-Only Admin Auth (CVE-2025-29927 Pattern)

**What goes wrong:**
Protecting `/admin` solely via Next.js middleware is vulnerable to CVE-2025-29927, a critical (CVSS 9.1) auth bypass disclosed March 2025 and patched in Next.js 15.2.3+. An attacker sends a request with a spoofed `x-middleware-subrequest` header, middleware is skipped entirely, and the admin panel — including all broker PII (names, phones, emails, deal amounts) — is exposed without any password.

**Why it happens:**
The natural pattern for simple password protection in Next.js is a middleware check. This works against casual visitors but fails against anyone who's read the CVE advisory. The vulnerability affects all self-hosted Next.js before 15.2.3.

**How to avoid:**
- Use Next.js 15.2.3+ (patches the vulnerability)
- Never rely solely on middleware for auth — enforce the password check in the admin page's server component or API route handler as well (defense in depth)
- For the admin panel: verify `ADMIN_PASSWORD` in a Server Action or API route that runs on every data fetch, not just at the route level
- Use `crypto.timingSafeEqual` for password comparison to prevent timing attacks (plain string `===` is vulnerable)

**Warning signs:**
- Running Next.js version below 15.2.3
- Admin auth logic exists only in `middleware.ts` with no server-side check in the page itself
- ADMIN_PASSWORD compared with `===` instead of `timingSafeEqual`

**Phase to address:**
Admin panel implementation — build auth correctly from the start; do not add it as an afterthought.

---

### Pitfall 4: Vercel Free Tier 10-Second Function Timeout

**What goes wrong:**
The Vercel Hobby (free) tier hard-limits serverless function execution to 10 seconds. The incoming GHL webhook must: parse payload, validate, query Supabase for existing contact, insert/upsert broker, generate token, and potentially fire a response — all within 10 seconds. If Supabase is cold-starting or responding slowly (shared compute on free tier can reach 300ms), a cold-start Next.js function + slow DB + heavy logic can breach the timeout. Vercel returns a 504 to GHL. GHL does not retry 5xx errors.

**Why it happens:**
Developers chain synchronous awaits without considering accumulated latency: cold-start (up to 2-3 seconds) + DB connection establishment (~100-300ms) + DB query (~50-150ms) + any transformation logic. On a warmed function it's fine; on a cold start it can fail.

**How to avoid:**
- Keep webhook handler lean: only do the minimum (upsert broker, return 200) — no external API calls, no email sends, no secondary webhooks in the same function invocation
- Use Supabase's transaction mode pooler (port 6543) to minimize connection establishment time
- Return 200 immediately after the DB upsert; fire the completion webhook back to GHL as a separate async operation or a follow-up step in the onboarding completion flow (not in the inbound webhook handler)
- Note: Vercel Fluid Compute (enabled by default for new projects as of April 2025) helps with cold starts but the 10-second timeout is still enforced on free tier

**Warning signs:**
- Vercel function logs showing execution time approaching 8-9 seconds
- GHL webhook delivery logs showing 504 responses
- Supabase logs showing connection establishment taking >200ms consistently

**Phase to address:**
Webhook endpoint implementation (Phase 1) — keep the handler intentionally thin.

---

## Moderate Pitfalls

### Pitfall 5: Raw Body Consumed Before Webhook Signature Verification

**What goes wrong:**
In Next.js App Router, the request body is a stream that can only be read once. If you call `request.json()` to parse the payload, the stream is consumed. Any subsequent attempt to read the raw body for HMAC signature verification (if you add it later) will get an empty string, causing all signature checks to fail. Although GHL's current webhook doesn't enforce HMAC by default, this pattern will block you from adding security later.

**Why it happens:**
Developers parse `request.json()` first because it's convenient, then try to add signature verification later and can't figure out why it always fails.

**How to avoid:**
- Use `request.text()` to get the raw body string, then `JSON.parse()` it yourself
- Keep the raw text variable for signature verification
- Pattern: `const raw = await request.text(); const payload = JSON.parse(raw);`

**Warning signs:**
- Webhook handler uses `request.json()` as its first operation
- Signature verification always returns invalid even with correct secret

**Phase to address:**
Webhook endpoint implementation (Phase 1) — use `request.text()` from the start.

---

### Pitfall 6: Step State Lost on Browser Refresh or Accidental Navigation

**What goes wrong:**
Multi-step onboarding state stored only in React component state (`useState`) is wiped on page refresh, browser back button, or accidental tab close. The broker is a sales professional opening this on their phone immediately after a call — interruptions are common. If they lose their edited delivery preferences because they switched apps for 5 minutes and the tab refreshed, they'll call Daniel.

**Why it happens:**
Simple `useState` in a wrapper component is the path of least resistance. URL query params (the correct approach) require more setup. `sessionStorage` is a middle ground but still lost on tab close.

**How to avoid:**
- Persist step progress to Supabase after each step completion (not just at the end)
- On load, fetch the broker's current step and pre-populate the state
- This doubles as resume functionality: if they come back a day later via the same token link, they land on their last incomplete step
- Do not use URL query params for step tracking — the token is already in the URL, adding `?step=3` creates shareable deep links into mid-flow states

**Warning signs:**
- Step state lives only in `useState` with no persistence layer
- No `onboarding_step` or similar column in the Supabase schema
- The GET endpoint returns status but not current step

**Phase to address:**
Onboarding flow implementation — define the DB schema to include `current_step` and `step_data` (JSONB) from the start.

---

### Pitfall 7: Pre-filled Form Data Not Sanitized Before Display

**What goes wrong:**
GHL sends broker data as-is from the CRM. This data can include: ALL CAPS names (`JOHN SMITH`), phone numbers in inconsistent formats (`+17024129233` vs `(702) 412-9233`), company names with special characters, or fields that are blank because the GHL deal didn't have them filled. Displaying raw CRM data makes the "premium" onboarding feel amateur and breaks the ROI calculator if `deal_amount` or `batch_size` is null/empty.

**Why it happens:**
Developers pass webhook payload fields directly to JSX. It works in the happy path test case where all fields are clean, then fails silently in production when real CRM data arrives.

**How to avoid:**
- Normalize names: `toTitleCase()` on first_name and last_name
- Normalize phone: format to display standard `(XXX) XXX-XXXX` for US numbers
- Guard against nulls in ROI calculator: `deal_amount` and `batch_size` must be validated as positive numbers before division — fall back to a "contact Daniel" prompt if missing
- Validate all required fields at webhook receipt time, not at display time
- Store the raw GHL payload in a separate column for debugging, display the normalized values

**Warning signs:**
- Webhook handler stores raw `req.body` fields without transformation
- ROI calculator divides `deal_amount / batch_size` without null/zero checks
- No test with incomplete GHL payload (missing fields)

**Phase to address:**
Webhook endpoint implementation (Phase 1) for validation; ROI calculator component for the null guard.

---

### Pitfall 8: Token Guessability / Token Security

**What goes wrong:**
If the onboarding token is generated with a weak random source (e.g., `Math.random()`, sequential IDs, short UUID4 substrings), an attacker can enumerate tokens and access any broker's onboarding page, exposing PII (name, company, phone, deal amount, vertical) and potentially completing onboarding on their behalf.

**Why it happens:**
Developers use short tokens for "clean URLs" or use predictable generation patterns.

**How to avoid:**
- Generate tokens with `crypto.randomUUID()` (Node.js built-in, cryptographically secure) — full UUID4 format (36 characters with hyphens)
- Never use `Math.random()`, sequential integers, or truncated UUIDs
- The token is the only auth layer for brokers — it must be unguessable

**Warning signs:**
- Token generation uses anything other than `crypto.randomUUID()` or `crypto.randomBytes()`
- Token is shorter than 32 characters
- Tokens appear in any log that might be externally accessible

**Phase to address:**
Webhook endpoint implementation (Phase 1).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store raw GHL payload without normalization | Faster to build | "Welcome JOHN SMITH" embarrasses client on first use | Never — normalize at ingestion |
| Middleware-only admin auth | Simpler code | Full admin bypass via CVE-2025-29927 | Never — always add server-side check |
| `useState` only for step state | Fastest to build | Step loss on refresh, no resume capability | Never for a production flow |
| Plain `===` for password compare | Trivial to write | Timing attack vector on admin password | Never — use `timingSafeEqual` |
| `Math.random()` for token | Readable short tokens | PII enumeration attack | Never |
| No Supabase keepalive | Nothing to set up | Paused DB = missed broker onboarding | Never for production |
| Synchronous DB calls in webhook handler | Simple code | 504 timeout risk on cold start | Never — keep handler minimal |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GHL Webhook inbound | Assume one fire per deal won | Always upsert on `ghl_contact_id`; treat every payload as potentially duplicate |
| GHL Webhook inbound | Return 5xx on processing error | Return 200 immediately, handle errors internally — GHL doesn't retry 5xx, broker link is lost |
| GHL Webhook inbound | Block on secondary work | Return 200 within seconds; defer any slow work (e.g., completion webhook) to the onboarding completion step |
| Supabase on Vercel | Use direct connection string | Use transaction mode pooler (port 6543) with `connection_limit=1` for serverless |
| Supabase free tier | Assume always-on | Set up keepalive cron from day one |
| GHL Completion webhook | Fire during inbound webhook handler | Fire only when broker submits final step in onboarding UI, not inside the inbound handler |
| Next.js App Router | `request.json()` for webhook body | `request.text()` then `JSON.parse()` to preserve raw body for signature verification |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Supabase shared compute slowdown | Admin panel takes 2-3 seconds to load broker list | Add `.select()` with only needed columns; add index on `created_at` for sort | After ~100 brokers with no pagination |
| No pagination on admin broker list | Admin page loads all rows and hangs | Build with pagination from the start (limit 20 per page) | After ~500 brokers |
| Client-side ROI calculation on stale data | Calculator shows wrong price if batch_size/deal_amount updated in GHL | Always re-fetch broker data from token on page load, not from browser cache | Immediately if broker renegotiates deal |
| Supabase free tier 2GB egress | Silent approach to bandwidth limit | Select only required columns; never `SELECT *` in production | With 200+ active brokers doing multiple sessions |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Admin auth only in middleware | Full PII exposure via CVE-2025-29927 header spoofing | Add server-side password check in admin page Server Component + use Next.js 15.2.3+ |
| Weak token generation | Broker PII enumeration | Use `crypto.randomUUID()` exclusively |
| Exposing raw GHL payload in API response | Reveals internal deal structure and CRM IDs | Return only the fields needed by the UI; never return the full row |
| ADMIN_PASSWORD in `.env` without timing-safe compare | Timing attack recovers password character by character | Use `crypto.timingSafeEqual(Buffer.from(input), Buffer.from(expected))` |
| No validation on inbound webhook fields | `deal_amount=0` causes divide-by-zero in ROI calculator visible to broker | Validate all numeric fields at ingestion; reject or flag incomplete payloads |
| `NEXT_PUBLIC_` prefix on secret env vars | Secret leaks to browser bundle | Never prefix Supabase service key or ADMIN_PASSWORD with `NEXT_PUBLIC_` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Progress bar showing step number without total (e.g., "Step 3") | Broker doesn't know how much is left, anxiety about length | Always show "Step 3 of 7" with visual fill bar |
| Validation only on final submit | Broker fills all 7 steps, submits, gets errors on step 2 | Validate each step before allowing Next, surface errors inline |
| Back button loses data on current step | Broker goes back to fix something, current step is blank | Persist current step's values in state before navigating back |
| Error page for invalid token shows only "Invalid link" | Broker panics, doesn't know what to do | Show Daniel's phone number (+1 702-412-9233) prominently with human copy "Call us and we'll sort it out" |
| Mobile form inputs jump when keyboard opens (iOS) | Form content is hidden behind keyboard, broker can't see what they're typing | Use `dvh` instead of `vh` for container heights; test on real iOS Safari |
| "Already onboarded" screen with no next step | Broker feels stuck | Include CTA to badaaas.com and Daniel's contact info on the already-onboarded screen |
| Smooth animations blocking on slow mobile | Onboarding feels laggy on 4G | Use `prefers-reduced-motion` media query; keep transitions under 200ms |

---

## "Looks Done But Isn't" Checklist

- [ ] **Idempotency:** Webhook endpoint tested with same `ghl_contact_id` sent twice — verify only one row is created and second call returns 200 without error
- [ ] **Keepalive:** Supabase keepalive cron is running and has been verified to prevent pause (check Supabase dashboard after 8 days without organic traffic)
- [ ] **Admin auth depth:** Admin page tested by sending `x-middleware-subrequest: middleware` header directly — verify it still requires password
- [ ] **Mobile viewport:** Tested on real iOS Safari (not Chrome DevTools mobile emulation) — verify keyboard doesn't obscure form inputs on step 2 (delivery preferences)
- [ ] **Token security:** Token generation verified to use `crypto.randomUUID()` — not `Math.random()` or `uuid` v1
- [ ] **Null safety:** ROI calculator tested with `deal_amount=null`, `batch_size=0`, `batch_size=null` — verify no NaN or Infinity shown to broker
- [ ] **GHL field completeness:** Webhook handler tested with partial payload (missing `company_name`, missing `secondary_vertical`) — verify graceful handling
- [ ] **Completion webhook:** Verified it fires only on step 7 submission, not on webhook receipt — check GHL contact for double-tagging
- [ ] **Already-completed flow:** Token used after onboarding completion shows "already onboarded" screen, not the onboarding flow
- [ ] **Env var safety:** No Supabase service key or ADMIN_PASSWORD prefixed with `NEXT_PUBLIC_` — verify with `next build` output

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Supabase paused, missed broker webhook | MEDIUM | Manually unpause in dashboard; ask GHL admin to re-trigger "Deal Won" workflow for affected contact; verify row was created |
| Duplicate broker rows created | MEDIUM | Delete duplicate rows in Supabase dashboard; add the missing UNIQUE constraint; broker uses their original token link |
| Admin panel exposed before CVE patch | HIGH | Rotate ADMIN_PASSWORD immediately; upgrade Next.js to 15.2.3+; audit Supabase logs for unauthorized reads of broker table |
| Broker loses step progress on refresh | LOW | They restart from step 1 if no persistence; add `current_step` column to schema and implement resume on next build |
| GHL webhook 504 (function timeout) | MEDIUM | Find and remove blocking synchronous operations in webhook handler; verify Supabase pooler connection string is in use |
| Wrong ROI shown (null deal_amount) | LOW | Backfill correct `deal_amount` and `batch_size` in Supabase for affected broker; update GHL contact and re-fire webhook |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| GHL double-processing / no idempotency | Phase 1: Webhook endpoint | Send same payload twice, verify single DB row |
| Supabase free tier auto-pause | Phase 1: Infrastructure setup | Check Supabase status after 8 days with zero traffic |
| Middleware-only admin auth (CVE-2025-29927) | Admin panel phase | Test with spoofed header; verify server-side check exists |
| Vercel 10-second timeout | Phase 1: Webhook endpoint | Load test with delayed Supabase responses; check logs |
| Raw body consumed before verification | Phase 1: Webhook endpoint | Code review: confirm `request.text()` pattern |
| Step state lost on refresh | Onboarding flow phase | Refresh at step 3, verify return to correct step |
| Pre-filled data not sanitized | Phase 1: Webhook endpoint + UI | Test with ALL CAPS name, null deal_amount |
| Weak token generation | Phase 1: Webhook endpoint | Code review: confirm `crypto.randomUUID()` |
| Mobile viewport / iOS keyboard bug | UI/CSS phase | Test on physical iPhone with iOS Safari |
| NEXT_PUBLIC_ secret leak | Phase 1: Environment setup | Run `next build` and inspect client bundle |

---

## Sources

- GoHighLevel Automated Webhook Retries: https://help.gohighlevel.com/support/solutions/articles/155000007071-automated-webhook-retries
- GoHighLevel Webhook Integration Guide: https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html
- Supabase Free Tier Pricing 2026: https://supabase.com/pricing
- Supabase Connection Management: https://supabase.com/docs/guides/database/connection-management
- Supabase Auto-Pause Prevention (community): https://shadhujan.medium.com/how-to-keep-supabase-free-tier-projects-active-d60fd4a17263
- Vercel Functions Limitations (official): https://vercel.com/docs/functions/limitations
- Vercel Fluid Compute: https://vercel.com/docs/fluid-compute
- CVE-2025-29927 Next.js Middleware Bypass (CVSS 9.1): https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass
- Next.js Security Update 2025: https://nextjs.org/blog/security-update-2025-12-11
- Next.js App Router Raw Body Handling: https://dev.to/thekarlesi/how-to-handle-stripe-and-paystack-webhooks-in-nextjs-the-app-router-way-5bgi
- Tailwind iOS 100vh fix: https://ben.page/tailwind-h-screen
- Supabase Upsert with onConflict: https://supabase.com/docs/reference/javascript/upsert
- Webhook Security Best Practices: https://hookdeck.com/webhooks/guides/webhooks-security-checklist

---
*Pitfalls research for: webhook-driven broker onboarding app (Next.js + Supabase + Vercel)*
*Researched: 2026-03-11*
