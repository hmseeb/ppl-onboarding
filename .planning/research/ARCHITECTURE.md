# Architecture Research

**Domain:** Webhook-driven multi-step onboarding app (Next.js + Supabase)
**Researched:** 2026-03-11
**Confidence:** HIGH (verified against Next.js 16.1.6 official docs + Supabase official docs + multiple community sources)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     External Systems                            │
│  ┌──────────────────┐           ┌─────────────────────────┐    │
│  │  GoHighLevel CRM │           │     Broker's Device     │    │
│  │  (Deal Won →     │           │  (phone/desktop browser)│    │
│  │   webhook fires) │           └────────────┬────────────┘    │
│  └────────┬─────────┘                        │ GET /onboard/   │
│           │ POST /api/webhooks/ghl            │     [token]     │
└───────────┼──────────────────────────────────┼─────────────────┘
            ↓                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js on Vercel                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Route Handlers (API Layer)               │  │
│  │  app/api/webhooks/ghl/route.ts   — inbound webhook       │  │
│  │  app/api/brokers/[token]/route.ts — GET broker by token  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Server Components (Page Layer)             │  │
│  │  app/onboard/[token]/page.tsx — personalized onboarding  │  │
│  │  app/admin/page.tsx            — admin panel             │  │
│  │  app/onboard/[token]/complete/page.tsx — done screen     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             Client Components (Interactive Layer)        │  │
│  │  OnboardingStepper — step navigation + progress bar      │  │
│  │  StepForms         — form state, inline editing          │  │
│  │  ROICalculator     — dynamic deal_amount/batch_size math │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Middleware                          │  │
│  │  middleware.ts — /admin password protection (cookie)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Supabase JS client
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase (Postgres)                           │
│                                                                 │
│  brokers table                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  id, token (UUID), ghl_contact_id (UNIQUE)               │  │
│  │  first_name, last_name, email, phone, company_name       │  │
│  │  state, primary_vertical, secondary_vertical             │  │
│  │  batch_size, deal_amount                                  │  │
│  │  delivery_method, delivery_email, delivery_phone          │  │
│  │  crm_webhook_url, contact_hours, weekend_pause           │  │
│  │  status (pending | completed), created_at, completed_at  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `app/api/webhooks/ghl/route.ts` | Receive GHL payload, generate token, upsert broker record, return 200 | Route Handler (POST), Supabase server client |
| `app/api/brokers/[token]/route.ts` | Return broker data + status by token (for client-side fetches in steps) | Route Handler (GET) |
| `app/onboard/[token]/page.tsx` | Server-render personalized onboarding shell; validate token, fetch broker | Async Server Component, Supabase server client |
| `OnboardingStepper` | Client-side multi-step navigation, progress bar, step transitions | Client Component with useState/useReducer |
| `StepForm` components (1-7) | Collect user input per step, inline editing of pre-filled data | Client Components, controlled form inputs |
| `app/admin/page.tsx` | List all brokers, statuses, copyable links, delivery prefs | Server Component (protected by middleware) |
| `middleware.ts` | Password-check cookie for `/admin` routes | Next.js Middleware, cookie validation |
| `lib/supabase/server.ts` | Supabase client for Server Components and Route Handlers | `createServerClient` with cookie adapter |
| `lib/supabase/client.ts` | Supabase client for Client Components (browser) | `createBrowserClient` |
| `lib/tokens.ts` | Token generation utility (`crypto.randomUUID()`) | Pure function, no deps |
| `lib/ghl.ts` | Fire completion webhook back to GHL | `fetch` wrapper, called via `waitUntil` |

## Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── ghl/
│   │   │       └── route.ts        # Inbound webhook from GHL
│   │   ├── brokers/
│   │   │   └── [token]/
│   │   │       └── route.ts        # GET broker data by token
│   │   └── admin/
│   │       └── auth/
│   │           └── route.ts        # POST admin password → set cookie
│   ├── onboard/
│   │   └── [token]/
│   │       ├── page.tsx            # SSR: validate token, fetch broker, render stepper
│   │       └── complete/
│   │           └── page.tsx        # Already-completed screen
│   ├── admin/
│   │   ├── page.tsx                # Broker list (protected by middleware)
│   │   └── login/
│   │       └── page.tsx            # Password entry form
│   ├── error/
│   │   └── page.tsx                # Invalid token screen (Daniel's contact)
│   ├── layout.tsx
│   └── page.tsx                    # Root redirect or landing
├── components/
│   ├── onboarding/
│   │   ├── OnboardingStepper.tsx   # Multi-step container
│   │   ├── ProgressBar.tsx
│   │   ├── steps/
│   │   │   ├── Step1Welcome.tsx    # Pre-filled summary + inline edit
│   │   │   ├── Step2Delivery.tsx   # SMS/email/CRM webhook prefs
│   │   │   ├── Step3HowItWorks.tsx # Education screen
│   │   │   ├── Step4ROI.tsx        # ROI calculator
│   │   │   ├── Step5BestPractices.tsx
│   │   │   ├── Step6Policy.tsx     # Checkbox acknowledgment
│   │   │   └── Step7Confirm.tsx    # Final summary + CTA
│   │   └── StepTransition.tsx      # Animation wrapper
│   └── admin/
│       ├── BrokerTable.tsx
│       └── CopyLinkButton.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts               # Server-side client
│   │   └── client.ts               # Browser client
│   ├── tokens.ts                   # Token generation
│   ├── ghl.ts                      # GHL completion webhook caller
│   └── types.ts                    # Shared TypeScript types (Broker, DeliveryPrefs)
├── middleware.ts                   # Admin route protection
└── styles/
    └── globals.css
```

### Structure Rationale

- **`app/api/`:** All route handlers live here — clean separation between API (route handlers) and UI (pages). No co-location with page.tsx to avoid conflicts.
- **`app/onboard/[token]/`:** Dynamic segment captures the broker's access token directly from the URL. Server Component fetches data before any client JS runs.
- **`components/onboarding/steps/`:** One file per step keeps each step independently editable without merge conflicts or cognitive overhead.
- **`lib/supabase/`:** Two separate files for server vs browser clients, following Supabase's official recommendation to avoid leaking server credentials to the browser.
- **`middleware.ts`:** Single file at project root — Next.js requires this location.

## Architectural Patterns

### Pattern 1: Token-in-URL Access (No Auth Required)

**What:** The broker's unique token is part of the URL path (`/onboard/abc123`). The server component reads the `params.token`, queries Supabase for a matching broker record, and either renders the onboarding flow or redirects to an error/completed page.

**When to use:** When users are non-technical, friction must be zero, and there's no need to differentiate between "who is accessing" vs "what are they accessing." This is the correct pattern for one-time personalized flows.

**Trade-offs:** Tokens are URL-shareable (low risk here — broker shared link with themselves; link is permanent not time-limited per design decision). No session management needed, no cookie expiry issues.

**Example:**
```typescript
// app/onboard/[token]/page.tsx
export default async function OnboardPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createClient() // server client

  const { data: broker } = await supabase
    .from('brokers')
    .select('*')
    .eq('token', token)
    .single()

  if (!broker) redirect('/error')
  if (broker.status === 'completed') redirect(`/onboard/${token}/complete`)

  // Pass pre-fetched broker as prop to client component
  return <OnboardingStepper broker={broker} token={token} />
}
```

### Pattern 2: Webhook Idempotency via UNIQUE Constraint + Upsert

**What:** The `brokers` table has a UNIQUE constraint on `ghl_contact_id`. The inbound webhook handler uses Supabase's `.upsert()` with `onConflict: 'ghl_contact_id'`. If GHL fires the same webhook twice (retry behavior), the second call updates rather than duplicates.

**When to use:** Whenever processing external webhooks. Senders retry on timeout — idempotency prevents duplicate records.

**Trade-offs:** Upsert overwrites data on conflict. For this app, this is correct behavior — if GHL resends, we want the latest data.

**Example:**
```typescript
// app/api/webhooks/ghl/route.ts
export async function POST(request: Request) {
  const payload = await request.json()
  const token = crypto.randomUUID()

  const { data: broker, error } = await supabase
    .from('brokers')
    .upsert(
      {
        ghl_contact_id: payload.ghl_contact_id,
        token,            // only set on insert; use ignoreDuplicates: false to update
        first_name: payload.first_name,
        // ... rest of payload
        status: 'pending',
      },
      { onConflict: 'ghl_contact_id' }
    )
    .select('token')
    .single()

  if (error) return new Response('Error', { status: 500 })

  const onboardingUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/onboard/${broker.token}`
  return Response.json({ url: onboardingUrl })
}
```

**Important:** Token must be preserved on duplicate — use `ignoreDuplicates: true` OR handle with a conditional insert approach: insert first, catch conflict, then select existing token.

### Pattern 3: Completion Webhook with waitUntil (Fire-and-Forget on Vercel)

**What:** When the broker completes Step 7, the client calls the completion API. That API updates the Supabase record to `completed` and fires a webhook back to GHL. The GHL webhook call must use `waitUntil` from `@vercel/functions` — bare unresolved promises are NOT guaranteed to complete in Vercel's serverless environment.

**When to use:** Any background work that shouldn't block the user response but must complete before the function terminates.

**Trade-offs:** `waitUntil` is Vercel-specific. Works on serverless (not edge runtime for this case). Keeps user response fast while ensuring GHL gets notified.

**Example:**
```typescript
import { waitUntil } from '@vercel/functions'

export async function POST(request: Request) {
  const { token, deliveryPrefs } = await request.json()

  // Update Supabase first (blocking — we need this to succeed)
  const { data: broker } = await supabase
    .from('brokers')
    .update({ status: 'completed', ...deliveryPrefs, completed_at: new Date().toISOString() })
    .eq('token', token)
    .select()
    .single()

  // Fire GHL callback without blocking the response
  waitUntil(notifyGHL(broker))

  return Response.json({ success: true })
}
```

### Pattern 4: Admin Protection via Middleware Cookie Check

**What:** `middleware.ts` intercepts all requests to `/admin/*`. It reads a specific cookie (`admin_auth`). If missing or invalid, it redirects to `/admin/login`. The login page POSTs to `/api/admin/auth/route.ts` which validates the password against `process.env.ADMIN_PASSWORD` and sets an HttpOnly cookie.

**When to use:** Simple single-password protection without a user database. Correct for v1 internal tooling.

**Trade-offs:** Not secure against targeted attacks — password is shared and the cookie provides no user identity. Sufficient for this use case (internal admin only, low-value target, v1).

**Example:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get('admin_auth')
    if (!authCookie || authCookie.value !== process.env.ADMIN_COOKIE_SECRET) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

### Pattern 5: Server Component + Client Component Split for Onboarding

**What:** The page-level Server Component fetches broker data from Supabase (no client JS, no loading state, data arrives pre-filled). It passes the broker object as a prop to `OnboardingStepper`, which is a Client Component (`'use client'`) managing step index, form state, and transitions.

**When to use:** Any page where initial data must render without a loading spinner and subsequent interaction is client-driven. Correct for personalized onboarding where "feels like we know you" is the goal.

**Trade-offs:** Serialization boundary means only plain objects (not class instances, functions) cross from Server to Client. Supabase row data is always plain JSON — no issue here.

## Data Flow

### Flow 1: GHL "Deal Won" → Broker Record Created

```
GHL CRM (Deal Won status)
    ↓ POST /api/webhooks/ghl
Route Handler
    ↓ request.json() → validate required fields
Supabase .upsert() on ghl_contact_id
    ↓ returns existing token OR new token
Route Handler
    ↓ constructs https://[domain]/onboard/[token]
Response 200 { url: "..." }
    ↓ (GHL can log this or use it in automation)
```

### Flow 2: Broker Opens Onboarding Link

```
Broker clicks link: /onboard/[token]
    ↓ Next.js App Router
Server Component (page.tsx)
    ↓ await params → token
Supabase query: SELECT * FROM brokers WHERE token = [token]
    ↓
    ├─ broker.status = 'completed' → redirect /onboard/[token]/complete
    ├─ broker not found → redirect /error
    └─ broker found, pending → render OnboardingStepper with broker data
Client Component receives pre-filled broker object
    ↓ User progresses through 7 steps (all client-side state)
Step 7 submit → POST /api/brokers/[token]/complete
    ↓
Supabase UPDATE: status='completed', delivery prefs, completed_at
    ↓ waitUntil fires GHL callback webhook
Response → UI shows success screen
```

### Flow 3: Admin Views Broker List

```
Admin navigates to /admin
    ↓
middleware.ts checks admin_auth cookie
    ├─ missing/invalid → redirect /admin/login
    └─ valid → allow request
Server Component (admin/page.tsx)
    ↓ Supabase query: SELECT * FROM brokers ORDER BY created_at DESC
Render BrokerTable with all rows (status, dates, delivery prefs, copyable links)
```

### Step State Management

```
OnboardingStepper (Client Component)
    ├─ state: currentStep (1-7)
    ├─ state: formData (all 7 steps collected)
    │   ├─ step1: name, email, phone, company edits
    │   ├─ step2: delivery_method, hours, weekend_pause, crm_webhook_url
    │   └─ step7: assembled for submission
    ├─ on "Next" → increment step + animate transition
    ├─ on "Back" → decrement step
    └─ on Step 7 "Complete" → POST to completion endpoint
```

State lives entirely in React component state within `OnboardingStepper`. No global state manager needed — the flow is linear, single-session, no cross-component state sharing required.

## Database Schema

### `brokers` Table

```sql
CREATE TABLE brokers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token           uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  ghl_contact_id  text NOT NULL UNIQUE,           -- idempotency key

  -- Webhook-supplied data (GHL source of truth)
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  email           text NOT NULL,
  phone           text,
  company_name    text,
  state           text,
  primary_vertical   text,
  secondary_vertical text,
  batch_size      integer NOT NULL,
  deal_amount     numeric NOT NULL,

  -- Broker-supplied during onboarding (stored locally only)
  delivery_method text,                           -- 'sms' | 'email' | 'crm_webhook'
  delivery_email  text,
  delivery_phone  text,
  crm_webhook_url text,
  contact_hours   text,                           -- e.g. "9am-5pm EST"
  weekend_pause   boolean DEFAULT false,

  -- Status tracking
  status          text NOT NULL DEFAULT 'pending', -- 'pending' | 'completed'
  created_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

-- Indexes for common queries
CREATE INDEX brokers_status_idx ON brokers(status);
CREATE INDEX brokers_created_at_idx ON brokers(created_at DESC);
```

### Key Design Decisions

- `token` is a separate UUID from `id` — `id` is internal PK, `token` is the URL-safe access key. Separating them means the internal DB PK is never exposed in URLs.
- `ghl_contact_id` is the idempotency key — UNIQUE constraint at the DB level enforces deduplication even if application-level checks fail.
- Broker edits (step 1 inline editing) overwrite the original webhook-supplied fields. This is intentional per PROJECT.md: "Edits stored locally only, GHL remains source of truth for original data" (GHL data unchanged in GHL, local edits update Supabase).
- No `expires_at` — per PROJECT.md decision: links stay valid forever.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GoHighLevel (inbound) | POST webhook to `/api/webhooks/ghl` | GHL fires on "Deal Won" status change; validate required fields, respond 200 fast |
| GoHighLevel (outbound) | `fetch` POST to GHL webhook URL stored in env | Fires on onboarding completion; use `waitUntil` on Vercel to guarantee execution |
| Vercel | Serverless deployment, automatic Node.js runtime | Route handlers deploy as serverless functions; no persistent state |
| Supabase | JS client (`@supabase/supabase-js`), two clients (server + browser) | Server client uses `SUPABASE_SERVICE_ROLE_KEY` for webhook handler (bypasses RLS); browser client uses anon key |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Route Handler ↔ Supabase | Direct Supabase JS client calls | Use service role key in route handlers for webhook processing (no user session context) |
| Server Component ↔ Supabase | Direct Supabase JS client calls | Use service role or anon key with token-based lookup (no RLS needed — no user auth) |
| Server Component → Client Component | Props (serialized JSON) | Broker data crosses the boundary as a plain object |
| Client Component → Route Handler | `fetch` POST | Step completion, form submission |
| Middleware → Cookies | `request.cookies.get()` | Admin auth check; set via `/api/admin/auth` route |

## Suggested Build Order

Build dependencies flow strictly in this order — each layer depends on the previous:

1. **Database schema** — Everything depends on this. Create `brokers` table with all columns + constraints. Validate with a direct Supabase insert.

2. **Supabase client utilities** (`lib/supabase/server.ts`, `lib/supabase/client.ts`) — Required by all route handlers and server components.

3. **Inbound webhook handler** (`/api/webhooks/ghl`) — Core entry point. Once this works, broker records exist and all other flows have data.

4. **Token lookup route** (`/api/brokers/[token]`) — Required to verify tokens work end-to-end before building UI.

5. **Onboarding page shell** (`/onboard/[token]/page.tsx`) — Server component that validates token and fetches broker. Build the routing logic (pending/completed/error) before building the steps.

6. **Onboarding steps** (Step 1 → Step 7 sequentially) — Client components. Build the stepper container first, then add steps one at a time. Step 4 ROI calculator depends on `deal_amount` and `batch_size` from broker data.

7. **Completion handler** (`/api/brokers/[token]/complete`) — Needs all step form data shape finalized before implementation. Includes GHL callback via `waitUntil`.

8. **Middleware + Admin login** — Independent from onboarding flow. Build after core flow is working.

9. **Admin panel** (`/admin`) — Depends on middleware. Simple read-only Supabase query.

10. **Error + completed screens** — Polish. Build alongside step 5 (shell) but low priority.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k brokers | Current architecture is fine. Supabase free tier (500MB) handles ~100K+ rows of this schema. Vercel free tier (100GB bandwidth) handles this volume trivially. |
| 1k-10k brokers | Admin table needs pagination (Supabase `.range()` / limit-offset). Add created_at index (already in schema). No infrastructure changes needed. |
| 10k+ brokers | Consider caching completed broker pages at edge (ISR or CDN). Webhook handler may need queue (e.g., add Inngest or similar) to handle burst retries from GHL. |

### Scaling Priorities

1. **First bottleneck:** Admin panel loads all brokers — add pagination before 500+ records for UX.
2. **Second bottleneck:** Webhook handler latency — GHL has short timeout windows. Keep handler fast: validate, upsert, respond. Move any slow work to `waitUntil`.

## Anti-Patterns

### Anti-Pattern 1: Bare Unresolved Promise for GHL Callback

**What people do:** `fetch(ghlWebhookUrl, { ... })` without awaiting, not using `waitUntil`.
**Why it's wrong:** Vercel serverless functions terminate after the response is sent. The GHL callback may never fire. The deal is closed, the broker completed onboarding, but GHL never gets the signal for downstream automation.
**Do this instead:** `waitUntil(notifyGHL(broker))` from `@vercel/functions`. This registers the promise with the Vercel runtime, which waits for it before terminating.

### Anti-Pattern 2: Storing Token as the Primary Key

**What people do:** Use the URL token directly as the table's primary key (id = token).
**Why it's wrong:** Exposes internal DB structure in URLs. Makes it harder to rotate tokens later (cascade updates). Primary keys should be stable internal identifiers.
**Do this instead:** Separate `id` (internal PK, never exposed) from `token` (URL-safe access key). Both are UUIDs but serve different purposes.

### Anti-Pattern 3: Client-Side Token Validation Only

**What people do:** Pass token to a Client Component and validate it client-side with a `useEffect` fetch.
**Why it's wrong:** User sees a blank screen or flash before the "invalid token" redirect. Personalized data arrives after first paint, breaking the "feels like we know you" first impression.
**Do this instead:** Validate token in the Server Component (page.tsx), redirect server-side before any HTML is sent. Broker data arrives with the first HTML response.

### Anti-Pattern 4: Separate Tables for Step State

**What people do:** Create a `onboarding_steps` or `step_progress` table to track which steps are complete.
**Why it's wrong:** For a 7-step linear flow with a single binary outcome (pending → completed), this is massive over-engineering. The step state only matters during the session and doesn't need persistence.
**Do this instead:** Track only the outcome (`status: pending | completed`) in the `brokers` table. Step navigation is pure client-side React state.

### Anti-Pattern 5: Using Supabase Auth for Broker Access

**What people do:** Create Supabase Auth users for brokers, use email magic links.
**Why it's wrong:** Brokers are "sales pros, not tech people" (PROJECT.md). They open the link immediately after a sales call, on their phone. Adding an auth step (check email for magic link, click it, now you're in) introduces friction that kills completion rates.
**Do this instead:** Token-in-URL pattern. Zero friction. The URL IS the credential.

## Sources

- [Next.js Route Handlers — Official Docs (v16.1.6, 2026-02-27)](https://nextjs.org/docs/app/getting-started/route-handlers) — HIGH confidence
- [Next.js route.js API Reference (v16.1.6, 2026-02-27)](https://nextjs.org/docs/app/api-reference/file-conventions/route) — HIGH confidence
- [Supabase Upsert Documentation](https://supabase.com/docs/reference/javascript/upsert) — HIGH confidence
- [Secure One-Time Tokens with Supabase and Postgres — MakerKit](https://makerkit.dev/blog/tutorials/one-time-tokens-supabase-postgres) — MEDIUM confidence
- [Fire-and-forget pattern discussion — Vercel Community](https://community.vercel.com/t/fire-and-forget-next-js-api-route/15865) — HIGH confidence (Vercel team confirmed `waitUntil`)
- [Password protecting Next.js routes — Alex Chan](https://www.alexchantastic.com/password-protecting-next) — MEDIUM confidence
- [Next.js App Router Architecture Patterns 2026 — dev.to](https://dev.to/teguh_coding/nextjs-app-router-the-patterns-that-actually-matter-in-2026-146) — MEDIUM confidence
- [Next.js Middleware Authentication — HashBuilds 2025](https://www.hashbuilds.com/articles/next-js-middleware-authentication-protecting-routes-in-2025) — MEDIUM confidence
- [GoHighLevel Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html) — MEDIUM confidence

---
*Architecture research for: Webhook-driven multi-step onboarding app (PPL Onboarding)*
*Researched: 2026-03-11*
