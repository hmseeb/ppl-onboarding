# Phase 1: Foundation - Research

**Researched:** 2026-03-11
**Domain:** Next.js Route Handlers + Supabase Postgres + GHL webhook ingestion + Vercel deployment
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOOK-01 | POST /api/webhooks/ghl accepts GHL payload with all required fields (first_name, last_name, email, phone, company_name, state, primary_vertical, secondary_vertical, batch_size, deal_amount, ghl_contact_id) | Route Handler pattern confirmed; Zod schema validates all fields before DB write |
| HOOK-02 | Webhook payload validated with Zod schema before DB write; malformed payloads return 400 with error details | Zod 4.3.6 + App Router Route Handler pattern fully documented; parse errors map directly to 400 responses |
| HOOK-03 | Broker record stored in Supabase with generated UUID token on successful webhook | `crypto.randomUUID()` + Supabase `.upsert()` pattern confirmed; token is separate UUID column from PK |
| HOOK-04 | Webhook response returns JSON with onboarding_url, broker_name, and status ("created" or "exists") | Route Handler `Response.json()` pattern; status derived from upsert conflict detection |
| HOOK-05 | Duplicate webhooks for same ghl_contact_id handled idempotently (upsert, return existing token URL) | UNIQUE constraint on ghl_contact_id + `.upsert({ onConflict: 'ghl_contact_id' })` is atomic and race-safe |
| HOOK-06 | GET endpoint (/api/brokers/[token]) returns broker data and onboarding status | Dynamic Route Handler with `params.token` lookup; returns full broker row + status field |
| INFR-01 | Next.js app deployed on Vercel with all environment variables configured | Vercel Pro required (commercial use); env vars set via Vercel dashboard; NEXT_PUBLIC_ prefix rules apply |
| INFR-02 | Supabase project with brokers table schema matching webhook payload + onboarding fields | Full schema documented in ARCHITECTURE.md; one table, UNIQUE constraint on ghl_contact_id, UUID token column |
| INFR-03 | Supabase keepalive mechanism to prevent free-tier auto-pause | cron-job.org pings /api/health endpoint every 3-4 days; health endpoint does a lightweight Supabase SELECT |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire data pipeline: the Next.js project is created, deployed to Vercel, the Supabase `brokers` table is created, and the inbound GHL webhook handler is implemented with full idempotency. This is the only phase where all downstream work is blocked — nothing in Phase 2, 3, or 4 can be built or tested without broker records existing in the DB.

The technical core of this phase is the webhook handler (`app/api/webhooks/ghl/route.ts`). It must be intentionally minimal: receive payload, validate with Zod, upsert to Supabase, return 200 with the onboarding URL. No secondary API calls, no blocking work, no GHL completion webhook (that fires only at Phase 2 step 7). The 10-second Vercel function timeout is real — fat handlers that chain awaits on cold starts will 504. GHL does not retry on 5xx, so a timed-out webhook is a permanently lost broker onboarding link.

The three infrastructure decisions that must happen before the first production webhook fires are: (1) UNIQUE constraint on `ghl_contact_id` in the DB schema (prevents duplicate broker records), (2) Supabase keepalive via cron-job.org pinging `/api/health` every 3-4 days (prevents silent data loss during slow deal weeks), and (3) all required env vars set in Vercel dashboard. These cannot be retrofitted without risk — the DB constraint especially must precede any real webhook traffic.

**Primary recommendation:** Build in this strict order — Supabase schema first, then Supabase client utils, then the webhook handler, then the token GET endpoint, then keepalive + health endpoint. Verify idempotency (send same payload twice, confirm single row) before declaring phase complete.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router framework; Route Handlers for webhook endpoints | Vercel-native, zero-config deploy; Route Handlers are the correct primitive for external POST webhooks (not Server Actions) |
| React | 19.2 | Ships with Next.js 16 | No choice; React Compiler eliminates manual memoization |
| TypeScript | 5.x (min 5.1) | Type safety | Required by Next.js 16; Zod schemas give end-to-end validated types |
| @supabase/supabase-js | ^2.99.1 | Postgres DB client for broker records | Direct SQL access, no ORM needed for single-table schema |
| @supabase/ssr | ^0.9.0 | Server-side Supabase client for App Router | Required for Route Handlers and Server Components; replaces deprecated auth-helpers |
| zod | 4.3.6 | Webhook payload validation + type inference | Single source of truth for payload shape; parse errors automatically map to 400 responses |
| uuid | 13.0.0 | Broker token generation (fallback if needed) | Though `crypto.randomUUID()` is preferred (built-in, no dependency) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vercel/functions | latest | `waitUntil` for fire-and-forget async work | Phase 1 doesn't need this yet (no completion webhook); install now so Phase 2 doesn't require a dependency addition mid-build |
| next-themes | 0.4.6 | Dark mode provider | Needed in root layout even in Phase 1 to prevent hydration mismatch in Phase 2 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `crypto.randomUUID()` | `uuid` v13 | `crypto.randomUUID()` is built-in Node.js 19+, no dependency; uuid adds a dep for no benefit here |
| Supabase `.upsert()` | Manual SELECT-then-INSERT | Upsert is atomic; manual check has a race condition window between the SELECT and INSERT under concurrent webhooks |
| Zod 4.3.6 | Zod 3.x | Zod 4 has breaking changes but is the current standard; `@hookform/resolvers` v5 is required for Zod 4 (not v3) |

**Installation:**
```bash
# Bootstrap Next.js 16 with App Router + TypeScript + Tailwind v4
npx create-next-app@latest ppl-onboarding \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias "@/*"

# Initialize shadcn/ui (installs Tailwind v4, tw-animate-css)
npx shadcn@latest init

# Supabase clients
npm install @supabase/supabase-js @supabase/ssr

# Webhook validation
npm install zod

# Token utility (optional — crypto.randomUUID() is built-in)
npm install uuid && npm install -D @types/uuid

# Vercel functions for waitUntil (used in Phase 2, install now)
npm install @vercel/functions
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope)

```
app/
├── api/
│   ├── webhooks/
│   │   └── ghl/
│   │       └── route.ts        # POST — inbound GHL webhook (HOOK-01 through HOOK-05)
│   ├── brokers/
│   │   └── [token]/
│   │       └── route.ts        # GET — broker data + status by token (HOOK-06)
│   └── health/
│       └── route.ts            # GET — keepalive ping endpoint (INFR-03)
├── layout.tsx                  # Root layout (dark theme setup)
└── page.tsx                    # Root redirect or placeholder
lib/
├── supabase/
│   ├── server.ts               # createServerClient — used in Route Handlers and Server Components
│   └── client.ts               # createBrowserClient — for Phase 2 Client Components
├── validations/
│   └── webhook.ts              # Zod schema for GHL payload (single source of truth)
└── types.ts                    # Shared TypeScript types (Broker)
proxy.ts                        # Admin route protection (Phase 3; create stub now)
```

### Pattern 1: Webhook Route Handler (Thin Handler)

**What:** The GHL webhook handler reads the raw body, validates with Zod, upserts to Supabase, and returns 200 with the onboarding URL. Nothing else happens in this function.

**When to use:** All inbound webhook endpoints. The 10-second Vercel timeout makes "thin handler" a non-negotiable constraint, not a preference.

**Example:**
```typescript
// app/api/webhooks/ghl/route.ts
// Source: Next.js Route Handlers official docs + ARCHITECTURE.md
import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { GHLWebhookSchema } from '@/lib/validations/webhook'

export async function POST(request: NextRequest) {
  // Use request.text() not request.json() — preserves raw body for future HMAC verification
  const raw = await request.text()
  let body: unknown

  try {
    body = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = GHLWebhookSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const payload = result.data
  const supabase = createServerClient()
  const token = crypto.randomUUID()

  const { data: broker, error } = await supabase
    .from('brokers')
    .upsert(
      {
        ghl_contact_id: payload.ghl_contact_id,
        token,
        first_name: toTitleCase(payload.first_name),
        last_name: toTitleCase(payload.last_name),
        email: payload.email.toLowerCase(),
        phone: payload.phone ?? null,
        company_name: payload.company_name ?? null,
        state: payload.state ?? null,
        primary_vertical: payload.primary_vertical ?? null,
        secondary_vertical: payload.secondary_vertical ?? null,
        batch_size: payload.batch_size,
        deal_amount: payload.deal_amount,
        status: 'not_started',
      },
      { onConflict: 'ghl_contact_id', ignoreDuplicates: false }
    )
    .select('token, first_name, status')
    .single()

  if (error) {
    console.error('Supabase upsert error:', error)
    return Response.json({ error: 'Database error' }, { status: 500 })
  }

  const isNew = broker.token === token
  const onboarding_url = `${process.env.NEXT_PUBLIC_BASE_URL}/onboard/${broker.token}`

  return Response.json({
    onboarding_url,
    broker_name: broker.first_name,
    status: isNew ? 'created' : 'exists',
  })
}
```

**Critical note on upsert token preservation:** When a duplicate fires, the upsert with `ignoreDuplicates: false` will overwrite the `token` column with a new UUID, breaking the existing broker's link. The correct approach is to use `ignoreDuplicates: true` OR use a conditional approach: attempt insert, on conflict do nothing, then select the existing row. See Anti-Patterns below for the correct implementation.

### Pattern 2: Idempotent Upsert with Token Preservation

**What:** On duplicate `ghl_contact_id`, return the EXISTING token (not a new one) so the broker's original onboarding link stays valid.

**When to use:** Every time a webhook handler needs to be idempotent while preserving an existing unique identifier.

**Example:**
```typescript
// Source: Supabase upsert docs + ARCHITECTURE.md
// Strategy: INSERT on conflict do nothing, then SELECT the existing row
const { data: existing } = await supabase
  .from('brokers')
  .select('token, first_name')
  .eq('ghl_contact_id', payload.ghl_contact_id)
  .single()

if (existing) {
  // Duplicate — return existing token
  return Response.json({
    onboarding_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboard/${existing.token}`,
    broker_name: existing.first_name,
    status: 'exists',
  })
}

// New broker — insert fresh row
const newToken = crypto.randomUUID()
const { data: broker, error } = await supabase
  .from('brokers')
  .insert({ ghl_contact_id: payload.ghl_contact_id, token: newToken, ...normalizedData })
  .select('token, first_name')
  .single()
```

Note: This select-then-insert has a theoretical race condition under simultaneous duplicate webhooks. The DB-level UNIQUE constraint is the ultimate safety net — the second INSERT will fail with a unique violation error, which can be caught and handled by re-querying for the existing row.

### Pattern 3: Supabase Server Client (Route Handlers)

**What:** Route Handlers (webhook endpoints) use the service role key, not the anon key. No RLS needed — the webhook handler is a server-side trusted context.

**When to use:** All Route Handlers. Never use the browser client in Route Handlers.

**Example:**
```typescript
// lib/supabase/server.ts
// Source: Supabase SSR official docs
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerClient() {
  const cookieStore = cookies()
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // NOT anon key for server-side
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

### Pattern 4: Zod Webhook Schema

**What:** The Zod schema for the GHL payload is the single source of truth. It defines required vs optional fields, numeric coercion (GHL may send numbers as strings), and provides TypeScript types via `z.infer<>`.

**When to use:** Define once in `lib/validations/webhook.ts`, import everywhere.

**Example:**
```typescript
// lib/validations/webhook.ts
// Source: Zod 4.x docs
import { z } from 'zod'

export const GHLWebhookSchema = z.object({
  ghl_contact_id: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  state: z.string().optional(),
  primary_vertical: z.string().optional(),
  secondary_vertical: z.string().optional(),
  batch_size: z.coerce.number().int().positive(),
  deal_amount: z.coerce.number().positive(),
})

export type GHLWebhookPayload = z.infer<typeof GHLWebhookSchema>
```

### Pattern 5: Health Endpoint for Keepalive

**What:** A GET endpoint that performs a lightweight Supabase query and returns 200. The external cron (cron-job.org) pings this URL every 3 days to prevent Supabase free-tier auto-pause.

**When to use:** Any Supabase free-tier project that may have periods of no organic traffic.

**Example:**
```typescript
// app/api/health/route.ts
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServerClient()
    // Lightweight query — just verifies DB is reachable
    await supabase.from('brokers').select('id').limit(1)
    return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (error) {
    return Response.json({ status: 'error' }, { status: 503 })
  }
}
```

### Anti-Patterns to Avoid

- **`ignoreDuplicates: false` upsert on a row with a pre-generated token:** This overwrites the existing token UUID on the second webhook, invalidating the broker's original link. Use select-then-insert or `ignoreDuplicates: true`.
- **`request.json()` as the first operation in a webhook handler:** Consumes the body stream; you cannot later read the raw body for HMAC signature verification. Use `request.text()` then `JSON.parse()`.
- **Returning 5xx on processing errors:** GHL does not retry on 5xx responses. If the handler errors, that broker onboarding link is lost. Return 200 for idempotent cases; log errors internally; only return 4xx for validation failures.
- **Calling secondary external APIs inside the webhook handler:** Adds latency toward the 10-second timeout. The inbound handler must only do: validate → upsert → return 200.
- **Using `NEXT_PUBLIC_` prefix on `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_PASSWORD`:** These are server-only secrets. `NEXT_PUBLIC_` leaks them to the client browser bundle.
- **`middleware.ts` in Next.js 16:** The file is renamed to `proxy.ts`. Creating `middleware.ts` is deprecated.

---

## Database Schema

### `brokers` Table (create in Supabase SQL editor)

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

  -- Broker-supplied during onboarding (populated in Phase 2)
  delivery_method text,                           -- 'sms' | 'email' | 'crm_webhook'
  delivery_email  text,
  delivery_phone  text,
  crm_webhook_url text,
  contact_hours   text,
  weekend_pause   boolean DEFAULT false,

  -- Step persistence (populated in Phase 2)
  current_step    integer DEFAULT 1,
  step_data       jsonb,

  -- Status tracking
  status          text NOT NULL DEFAULT 'not_started',  -- 'not_started' | 'in_progress' | 'completed'
  created_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

-- Indexes
CREATE INDEX brokers_status_idx ON brokers(status);
CREATE INDEX brokers_created_at_idx ON brokers(created_at DESC);
```

**Schema design decisions:**
- `token` is separate from `id` — internal PK never appears in URLs
- `ghl_contact_id` UNIQUE constraint is the idempotency guarantee at the DB level
- `current_step` and `step_data` columns are created now even though Phase 2 populates them — avoids a schema migration mid-build
- Status values are `not_started | in_progress | completed` (HOOK-06 requirement specifies these three states)
- `delivery_*` columns are nullable — populated only after Phase 2 onboarding completion

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payload validation | Custom field-by-field checks | Zod 4.3.6 with `safeParse()` | Zod handles type coercion (string→number), nested validation, and produces structured error objects for 400 responses |
| UUID generation | `Math.random()` hex strings | `crypto.randomUUID()` (built-in) | Cryptographically secure, no dependency, correct UUID v4 format |
| Duplicate prevention | Application-level SELECT-before-INSERT | DB UNIQUE constraint + `.upsert()` | DB constraint is atomic; application check has race conditions |
| Supabase client setup | Raw `fetch()` to Supabase REST API | `@supabase/supabase-js` + `@supabase/ssr` | Handles connection pooling, serialization, error types, cookie adapter for SSR |

**Key insight:** The UNIQUE constraint + upsert combination is the only race-safe idempotency pattern. Application-level duplicate checks (SELECT then INSERT) have a window where two simultaneous webhooks both pass the check and both insert, creating duplicates despite the check.

---

## Environment Variables

All must be configured in Vercel dashboard before first deployment.

| Variable | Value Source | Exposure |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard > Settings > API | Client-safe (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard > Settings > API | Client-safe (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard > Settings > API | Server-only — NEVER expose |
| `NEXT_PUBLIC_BASE_URL` | Production domain (e.g., `https://ppl-onboarding.vercel.app`) | Client-safe (public) |
| `ADMIN_PASSWORD` | `BadAaa$2026` | Server-only — NEVER expose |

**Critical:** `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` must NEVER have the `NEXT_PUBLIC_` prefix. Verify with `next build` output — if they appear in the client bundle, the build config is wrong.

---

## Common Pitfalls

### Pitfall 1: Upsert Overwrites Existing Token

**What goes wrong:** `supabase.upsert({ token: newUUID, ... }, { onConflict: 'ghl_contact_id' })` with `ignoreDuplicates: false` replaces the existing broker's token on the second webhook. The original onboarding link becomes a 404.

**Why it happens:** The upsert `UPDATE` path runs all columns including `token`, replacing the original with the newly generated UUID.

**How to avoid:** Use select-then-insert pattern: check if `ghl_contact_id` exists first, return existing token if so, insert new row only if not. The DB UNIQUE constraint is the ultimate backstop.

**Warning signs:** Same broker has two different tokens in the DB over time, or their link stops working after the second GHL webhook fires.

### Pitfall 2: GHL Does Not Retry on 5xx

**What goes wrong:** The webhook handler returns 500 on a Supabase connection error. GHL logs the delivery as failed. No retry occurs. The broker's onboarding link is never generated.

**Why it happens:** Developers assume 5xx triggers retry behavior. GHL's retry mechanism only fires on specific conditions (network timeout, 429 rate limit responses) — not on 5xx application errors.

**How to avoid:** Return 200 for all cases the handler can recover from. Only return 4xx for clear client errors (malformed payload). Log errors internally. If Supabase is down, the 200 with error details is better than a 500 that silently kills the onboarding link.

**Warning signs:** GHL webhook delivery logs showing 500 responses with no subsequent retries.

### Pitfall 3: Supabase Auto-Pause Kills a Deal-Won Webhook

**What goes wrong:** No deals close for 8 days. Supabase free tier auto-pauses the project. The next GHL webhook fires, hits a paused database, returns a 5xx, and the broker's onboarding link is never generated.

**Why it happens:** Supabase free tier pauses projects after 7 days of zero database activity. The keepalive must be active before go-live, not after the first outage.

**How to avoid:** Set up cron-job.org (free) to ping `/api/health` every 72 hours (3 days — safely within the 7-day window). Verify the cron is running after setup by checking Supabase logs for the keepalive query.

**Warning signs:** Supabase dashboard shows project status as "Paused"; no new rows in `brokers` table despite deals closing in GHL.

### Pitfall 4: GHL Webhook Field Names Unconfirmed

**What goes wrong:** The Zod schema is built against assumed field names (e.g., `ghl_contact_id`, `deal_amount`, `batch_size`). The actual GHL "Deal Won" webhook uses different field names (e.g., `contactId`, `opportunityValue`). All webhook payloads fail Zod validation and return 400. No broker records are created until the schema is updated.

**Why it happens:** GHL webhook payload field names vary by workflow type, trigger configuration, and GHL version. The field names listed in research are based on the project specification, not a verified GHL test trigger.

**How to avoid:** Before writing the Zod schema, fire a test GHL "Deal Won" webhook to a request logger (like webhook.site or requestbin.com). Inspect the actual field names. Map them in the schema. This is flagged as a known blocker in STATE.md.

**Warning signs:** All webhook requests returning 400 with validation errors referencing unexpected field names.

### Pitfall 5: Vercel Function Timeout on Cold Start

**What goes wrong:** Cold-start latency (2-3 seconds) + Supabase connection establishment (~200ms) + any chained awaits pushes the webhook handler over 10 seconds. Vercel returns 504 to GHL. GHL does not retry.

**Why it happens:** The Vercel Hobby plan (and the first 10 seconds of Pro) hard-enforces a function timeout. Cold starts are worst-case when the function hasn't received traffic in a few minutes.

**How to avoid:** Keep the handler to exactly 3 operations: (1) parse + Zod validate, (2) Supabase upsert, (3) return 200. No other awaits. Use Supabase transaction mode pooler (port 6543) connection string to minimize connection overhead.

**Warning signs:** Vercel function logs showing execution times approaching 8-9 seconds; GHL delivery logs showing 504 responses.

---

## Code Examples

### Zod Schema with Coercion (Verified Pattern)

```typescript
// lib/validations/webhook.ts
// Source: Zod 4.x official docs — https://zod.dev
import { z } from 'zod'

export const GHLWebhookSchema = z.object({
  // CRITICAL: Field names must be verified against actual GHL test trigger
  // before this schema is locked. See STATE.md blocker.
  ghl_contact_id: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  primary_vertical: z.string().optional().nullable(),
  secondary_vertical: z.string().optional().nullable(),
  // z.coerce handles GHL sending numbers as strings
  batch_size: z.coerce.number().int().positive(),
  deal_amount: z.coerce.number().positive(),
})

export type GHLWebhookPayload = z.infer<typeof GHLWebhookSchema>
```

### Supabase Server Client Setup (Verified Pattern)

```typescript
// lib/supabase/server.ts
// Source: Supabase SSR official docs — https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types'

export function createServerClient() {
  const cookieStore = cookies()
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

```typescript
// lib/supabase/client.ts
// Source: Supabase SSR official docs
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### GET Broker by Token (HOOK-06)

```typescript
// app/api/brokers/[token]/route.ts
import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createServerClient()

  const { data: broker, error } = await supabase
    .from('brokers')
    .select('first_name, last_name, email, phone, company_name, state, primary_vertical, secondary_vertical, batch_size, deal_amount, status, current_step, created_at')
    .eq('token', token)
    .single()

  if (error || !broker) {
    return Response.json({ error: 'Broker not found' }, { status: 404 })
  }

  return Response.json(broker)
}
```

### Data Normalization Utilities

```typescript
// lib/utils/normalize.ts
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function formatPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return phone // return as-is if format unrecognized
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16 | Using `middleware.ts` is deprecated — file is silently ignored |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` with `createServerClient` / `createBrowserClient` | Supabase 2024 | Mixing both in the same project causes auth conflicts and duplicate cookie handling |
| `tailwindcss-animate` | `tw-animate-css` (auto-installed by `shadcn init`) | shadcn 4.x / Tailwind v4 | `tailwindcss-animate` no longer works with Tailwind v4 |
| Vercel Hobby plan | Vercel Pro required | Always (clarified enforcement 2025) | Hobby plan explicitly prohibits commercial use; this app is a commercial onboarding tool |
| Pages Router (`pages/`) | App Router (`app/`) | Next.js 13+ | Route Handlers (needed for webhook endpoint) are App Router only |
| `framer-motion` import | `motion/react` import | Motion 11+ rebrand | Both work but `framer-motion` is the legacy path |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated, replaced by `@supabase/ssr`. Do not install.
- `tailwindcss-animate`: Incompatible with Tailwind v4. `shadcn init` installs `tw-animate-css` instead.
- `process.env` serverRuntimeConfig / publicRuntimeConfig: Removed in Next.js 16. Use `process.env.VAR` directly.

---

## Open Questions

1. **GHL Webhook Payload Field Names (BLOCKER for HOOK-01, HOOK-02)**
   - What we know: Research lists expected field names (`ghl_contact_id`, `deal_amount`, `batch_size`, `primary_vertical`, `secondary_vertical`) but these are based on the project specification, not a verified GHL test trigger.
   - What's unclear: Whether GHL sends `ghl_contact_id` or `contactId`, `deal_amount` or `opportunityValue`, `batch_size` or a custom field name configured in the GHL workflow.
   - Recommendation: Fire a test webhook to webhook.site before writing the Zod schema. Lock field names against real payload. This is the highest-risk open question in Phase 1 — a mismatch here requires renaming all schema columns and the Zod schema.

2. **Vercel Plan (BLOCKER for INFR-01)**
   - What we know: Hobby plan prohibits commercial use (verified against official Vercel docs). The project is a commercial onboarding tool for a revenue-generating referral business.
   - What's unclear: Whether the account is already on Pro or needs upgrading. Whether there's a billing owner who needs to approve.
   - Recommendation: Confirm Vercel Pro before creating the project. Using Hobby risks account suspension with no warning period.

3. **cron-job.org Setup Details**
   - What we know: cron-job.org is free, supports HTTP pings, can run every 72 hours. The approach is confirmed as correct per project decisions.
   - What's unclear: The exact production domain URL isn't known until the Vercel project is created. The cron cannot be configured until the project is deployed.
   - Recommendation: Deploy to Vercel first, get the production URL, then configure cron-job.org to ping `https://[domain]/api/health` every 72 hours. Do this before announcing the webhook URL to GHL.

---

## Sources

### Primary (HIGH confidence)
- Next.js 16.1.6 Route Handlers official docs — https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js 16.1.6 route.ts API reference — https://nextjs.org/docs/app/api-reference/file-conventions/route
- Supabase SSR docs (createServerClient / createBrowserClient) — https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase upsert with onConflict — https://supabase.com/docs/reference/javascript/upsert
- Vercel Hobby plan commercial use restriction — https://vercel.com/docs/plans/hobby
- Vercel Functions Limitations (10s timeout) — https://vercel.com/docs/functions/limitations
- CVE-2025-29927 Next.js Middleware Bypass — https://projectdiscovery.io/blog/nextjs-middleware-authorization-bypass
- GoHighLevel Webhook Integration Guide — https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html
- GoHighLevel Automated Webhook Retries — https://help.gohighlevel.com/support/solutions/articles/155000007071-automated-webhook-retries
- Project ARCHITECTURE.md (verified 2026-03-11) — database schema, component responsibilities, build order
- Project STACK.md (verified 2026-03-11) — all npm versions verified against npm registry
- Project PITFALLS.md (verified 2026-03-11) — pitfalls cross-referenced with official docs

### Secondary (MEDIUM confidence)
- Supabase free tier auto-pause prevention — https://shadhujan.medium.com/how-to-keep-supabase-free-tier-projects-active-d60fd4a17263 (community; Supabase auto-pause behavior confirmed in official pricing docs)
- Vercel fire-and-forget / waitUntil — https://community.vercel.com/t/fire-and-forget-next-js-api-route/15865 (community; Vercel team confirmed `waitUntil`)
- Next.js App Router raw body handling — https://dev.to/thekarlesi/how-to-handle-stripe-and-paystack-webhooks-in-nextjs-the-app-router-way-5bgi (verified: `request.text()` behavior is documented Next.js App Router behavior)

### Tertiary (LOW confidence)
- GHL field naming conventions: Based on project specification and STATE.md. Not verified against a live GHL "Deal Won" test trigger. Must be confirmed before schema is locked.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions npm-verified on 2026-03-11; official docs consulted for Next.js 16, Supabase SSR
- Architecture: HIGH — verified against Next.js 16.1.6 official docs + Supabase official docs; build order follows data dependencies
- Pitfalls: HIGH — GHL retry behavior, Vercel timeout, Supabase auto-pause, CVE-2025-29927 all verified with official sources
- GHL field names: LOW — not verified against live test trigger; flagged as blocker

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (30 days; stack is stable, Supabase and Next.js versions unlikely to change within window)
