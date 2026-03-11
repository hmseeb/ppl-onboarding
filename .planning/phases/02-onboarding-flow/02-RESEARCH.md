# Phase 2: Onboarding Flow - Research

**Researched:** 2026-03-11
**Domain:** Next.js multi-step onboarding UI + Supabase persistence + GHL completion webhook
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ONBD-01 | Personalized onboarding URL (/onboard/[token]) loads broker data server-side and renders pre-filled experience | Server Component + dynamic route pattern; token lookup in page.tsx before any HTML sent; broker data as prop to OnboardingStepper |
| ONBD-02 | Progress bar at top shows current step (1-7) throughout entire flow | shadcn Progress component; value = (currentStep / 7) * 100; lives in OnboardingStepper passed to each step |
| ONBD-03 | Step 1 (Welcome) displays personalized headline, pre-filled summary card, inline editing on all pre-filled fields | react-hook-form with defaultValues from broker prop; conditional edit mode toggle per field |
| ONBD-04 | Step 2 (Delivery Preferences) — SMS, email, CRM webhook with conditional URL field, hours dropdown, weekend pause toggle | react-hook-form + zodResolver; conditional rendering via watch('delivery_method') for CRM URL field |
| ONBD-05 | Step 3 (How Referrals Work) — visual timeline/cards showing 5-step referral process | Static content component; no form state needed; shadcn Card components |
| ONBD-06 | Step 4 (Setting Expectations) — education sections with personalized ROI calculator using actual deal_amount/batch_size | Dynamic calculation: price_per_referral = deal_amount / batch_size; null guards required; broker data passed as prop |
| ONBD-07 | Step 5 (Best Practices) — 5 numbered cards with closing advice | Static content; numbered card layout with shadcn Card |
| ONBD-08 | Step 6 (Replacement Policy) — checkbox acknowledgment that gates progression to step 7 | shadcn Checkbox; disabled "Next" until checked; state in OnboardingStepper |
| ONBD-09 | Step 7 (Confirmation) — combined summary, CTA to badaaas.com, secondary link to text Daniel | Final assembled summary from collected formData; no form inputs; CTA links |
| ONBD-10 | On step 7 completion, broker status → "completed" with all delivery preferences and edits stored | POST /api/brokers/[token]/complete; Supabase UPDATE; called from OnboardingStepper on step 7 submit |
| ONBD-11 | On step 7 completion, completion webhook fires to GHL with ghl_contact_id, onboarding_status, delivery_preferences, updated_fields | waitUntil(notifyGHL(broker)) from @vercel/functions; already installed in Phase 1; GHL URL from env var |
| ONBD-12 | Step 1 load updates broker status to "in_progress" in database | POST /api/brokers/[token]/start OR update in Server Component before render; simplest: update on client mount in OnboardingStepper |
| ONBD-13 | Current step persisted to database so brokers can resume where they left off | current_step column exists in schema (Phase 1); PATCH /api/brokers/[token]/step on each step advance; load initial step from broker.current_step prop |
| GARD-01 | Visiting completed onboarding link shows "already onboarded" screen with dashboard link and Daniel's contact info | Redirect in Server Component: if broker.status === 'completed' → redirect to /onboard/[token]/complete; separate page |
| GARD-02 | Visiting invalid/non-existent token shows clean error page with Daniel's contact info | Redirect in Server Component: if !broker → redirect to /error or render NotFound; separate page at app/not-found.tsx or app/error/page.tsx |
| DSGN-01 | Dark theme with light text and red accent color (#EF4444) for CTAs and key numbers | globals.css CSS variables for dark theme; Tailwind v4 custom color via --color-red-accent: #EF4444 in @theme inline; shadcn button variant uses accent |
| DSGN-02 | Mobile-first responsive design with touch-friendly targets (min 44px) | Tailwind responsive prefixes (sm:, md:); min-h-[44px] on interactive elements; tested on mobile viewport |
| DSGN-03 | BadAAAS logo placeholder displayed at top of every onboarding screen | Shared header component with logo placeholder; rendered inside OnboardingStepper above progress bar |
| DSGN-05 | All copy uses direct, confident, money-motivated tone — no corporate fluff | Copy comes from PPL Onboarding Prompt.md verbatim; no changes to tone |
| DSGN-06 | ROI graphic on step 4 is visually impactful with personalized numbers that pop | Large text with red accent for dollar figures; calculation logic described in ONBD-06 |
</phase_requirements>

---

## Summary

Phase 2 builds the complete broker-facing product: the 7-step onboarding flow, guard pages, and GHL completion webhook. All infrastructure from Phase 1 is in place — the `brokers` table has all needed columns (`current_step`, `step_data`, `delivery_method`, `delivery_email`, `delivery_phone`, `crm_webhook_url`, `contact_hours`, `weekend_pause`, `status`, `completed_at`), and `@vercel/functions` is already installed for `waitUntil`. The phase introduces exactly three new dependencies not yet in the project: `motion` (step animations), `react-hook-form` + `@hookform/resolvers` (form state for steps 1-2), and `shadcn/ui` components (UI primitives). The `globals.css` needs to be extended with the dark theme CSS variables — the current file only has a minimal light/dark media query setup without the full design token system.

The core architectural decision for this phase is the Server Component + Client Component split: `app/onboard/[token]/page.tsx` is a Server Component that validates the token, fetches the broker, handles guard redirects, and passes the broker object as a prop to `OnboardingStepper` (Client Component). This means brokers see their personalized data on the very first HTML response — no loading spinner, no flash of empty fields. `OnboardingStepper` owns all step navigation state (`currentStep`, `formData`, `policyAccepted`) in `useState`. Step persistence to Supabase happens via a small API route (`PATCH /api/brokers/[token]/step`) called on each step advance.

The biggest practical risk is the **GHL completion webhook URL being unconfirmed** (flagged in STATE.md). The `lib/ghl.ts` module needs a configurable endpoint URL from Daniel before step 7 can be wired up. A secondary risk is the **schema column naming discrepancy**: the additional context references column names from the original spec (`delivery_sms`, `preferred_hours`, `pause_weekends`) that differ from what Phase 1 actually built (`delivery_method`, `contact_hours`, `weekend_pause`). All Phase 2 code must use the actual Phase 1 column names.

**Primary recommendation:** Build in strict order — token routing + guard pages first, then OnboardingStepper shell + progress bar, then steps 1-7 sequentially, then completion API + GHL webhook, then styling pass. Steps 3, 5, 7 are static content with no form state — build them fast. Steps 1 and 2 contain all the form complexity — allocate most implementation time there.

---

## What Exists From Phase 1

This is critical context — Phase 2 builds ON TOP of these, not from scratch:

| Asset | Location | Phase 2 Usage |
|-------|----------|---------------|
| Broker type | `lib/types.ts` | Import for all TypeScript typing in step components |
| createServiceClient | `lib/supabase/server.ts` | Use in new API routes (complete, step-update) |
| createServerClient (async) | `lib/supabase/server.ts` | Use in app/onboard/[token]/page.tsx (Server Component) |
| Broker GET endpoint | `app/api/brokers/[token]/route.ts` | Already exists; Phase 2 adds sibling routes |
| GHL webhook endpoint | `app/api/webhooks/ghl/route.ts` | Untouched in Phase 2 |
| toTitleCase, formatPhone | `lib/utils/normalize.ts` | Use in step 1 display |
| GHLWebhookSchema | `lib/validations/webhook.ts` | No changes needed |
| ThemeProvider (dark) | `app/layout.tsx` | Already configured; forcedTheme="dark" |
| @vercel/functions | `package.json` | Already installed; use waitUntil in completion route |
| Supabase schema | `supabase/schema.sql` | Has current_step, step_data, delivery_method, etc. |

**Not yet installed (Phase 2 must install):**
- `motion` — step transition animations
- `react-hook-form` + `@hookform/resolvers` — form state for steps 1-2
- `shadcn/ui` components — UI primitives (button, card, input, progress, checkbox, label, badge)
- `zod` delivery preference schema (zod is installed; just add new schema file)

---

## Schema Column Name Truth

The additional context lists column names from the original spec that differ from what Phase 1 actually built. Use the Phase 1 schema — the actual column names in `supabase/schema.sql` and `lib/types.ts`:

| Original Spec Name | Actual Column Name | Notes |
|--------------------|--------------------|-------|
| `delivery_sms` (boolean) | `delivery_method` (text) | Single field: 'sms' \| 'email' \| 'crm_webhook' |
| `delivery_email` (boolean) | — | Covered by delivery_method; `delivery_email` is the email address |
| `delivery_crm_webhook` (boolean) | — | Covered by delivery_method |
| `preferred_hours` | `contact_hours` | Text field for hours preference |
| `pause_weekends` | `weekend_pause` | Boolean toggle |
| `replacement_policy_accepted` | Not in schema | Do NOT add — track in `step_data` JSONB or client-only |
| `ghl_contact_id` | `ghl_contact_id` | Confirmed match |

**Important:** `delivery_method` is a single text field holding one value. The spec says "checkboxes, can select multiple" but the DB schema only supports one delivery method. Step 2 UI should use radio buttons (single select) or the schema needs a migration to support array. Recommend: radio buttons matching the schema — no schema migration needed.

---

## Standard Stack

### Core (Phase 2 additions to Phase 1 stack)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | 12.35.2 | Step transition animations | Import from "motion/react"; AnimatePresence for enter/exit; requires "use client" |
| react-hook-form | 7.71.2 | Form state for steps 1 and 2 | Zero re-renders on keypress; uncontrolled pattern; best mobile performance |
| @hookform/resolvers | 5.2.2 | Zod adapter for react-hook-form | v5 required for Zod 4 compatibility (breaking change from v3) |
| shadcn/ui (CLI) | 4.0.2 | Accessible component primitives | Copy-paste model; dark theme + CSS var support; no runtime bundle |

### shadcn Components Needed

```bash
npx shadcn@latest add button card input label progress checkbox badge separator
```

| Component | Used In |
|-----------|---------|
| button | All CTAs, Next/Back navigation |
| card | Step cards, summary card, referral timeline cards |
| input | Step 1 inline editing, step 2 CRM webhook URL field |
| label | Step 2 form labels |
| progress | Progress bar (ONBD-02) |
| checkbox | Step 6 replacement policy acknowledgment (ONBD-08) |
| badge | Vertical tags on step 1 summary, step 7 summary |
| separator | Visual dividers between sections |

### Supporting (already in project)

| Library | Version | Purpose |
|---------|---------|---------|
| zod | 4.3.6 | Delivery preference form schema (new schema file needed) |
| @vercel/functions | 3.4.3 | waitUntil for GHL completion webhook — already installed |
| next-themes | 0.4.6 | ThemeProvider — already configured in layout.tsx |
| @supabase/supabase-js | 2.99.1 | Supabase queries in new API routes |
| @supabase/ssr | 0.9.0 | Server Component Supabase client |

### Installation (Phase 2 additions)

```bash
# Step/form libraries
npm install motion react-hook-form @hookform/resolvers

# shadcn init (if not done in Phase 1 — check for components.json)
npx shadcn@latest init

# Add needed components
npx shadcn@latest add button card input label progress checkbox badge separator
```

---

## Architecture Patterns

### Recommended File Structure (Phase 2 additions)

```
app/
├── onboard/
│   └── [token]/
│       ├── page.tsx                    # Server Component: validate token → guard → render stepper
│       └── complete/
│           └── page.tsx                # "Already onboarded" guard page (GARD-01)
├── error/
│   └── page.tsx                        # Invalid token error page (GARD-02)
├── api/
│   └── brokers/
│       └── [token]/
│           ├── route.ts                # Existing GET (untouched)
│           ├── start/
│           │   └── route.ts            # POST — update status → in_progress (ONBD-12)
│           ├── step/
│           │   └── route.ts            # PATCH — update current_step (ONBD-13)
│           └── complete/
│               └── route.ts            # POST — status → completed + GHL webhook (ONBD-10, ONBD-11)
components/
├── onboarding/
│   ├── OnboardingStepper.tsx           # Client Component: step state machine
│   ├── ProgressBar.tsx                 # Thin wrapper around shadcn Progress
│   ├── OnboardingHeader.tsx            # Logo + progress bar, shown on every step
│   └── steps/
│       ├── Step1Welcome.tsx            # Pre-filled summary + inline edit
│       ├── Step2Delivery.tsx           # Delivery prefs form
│       ├── Step3HowItWorks.tsx         # Static referral process timeline
│       ├── Step4ROI.tsx                # ROI calculator + setting expectations
│       ├── Step5BestPractices.tsx      # 5 numbered best practice cards
│       ├── Step6Policy.tsx             # Replacement policy + checkbox
│       └── Step7Confirm.tsx            # Final summary + CTAs
lib/
├── ghl.ts                              # GHL completion webhook caller (NEW)
├── validations/
│   ├── webhook.ts                      # Existing (untouched)
│   └── delivery.ts                     # NEW: Zod schema for step 2 delivery preferences
```

### Pattern 1: Server Component Token Guard

**What:** The page Server Component handles all guard logic before any HTML is sent. No client-side loading states.

**When to use:** Any token-gated page where status determines which view to render.

```typescript
// app/onboard/[token]/page.tsx
// Source: Next.js App Router Server Components docs
import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper'

export default async function OnboardPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createServerClient()

  const { data: broker } = await supabase
    .from('brokers')
    .select('*')
    .eq('token', token)
    .single()

  // GARD-02: invalid token
  if (!broker) {
    redirect('/error')
  }

  // GARD-01: already completed
  if (broker.status === 'completed') {
    redirect(`/onboard/${token}/complete`)
  }

  // Pass pre-fetched broker to Client Component (no loading spinner)
  return <OnboardingStepper broker={broker} token={token} />
}
```

**Note:** `createServerClient()` in `lib/supabase/server.ts` is async (awaits cookies()). Always `await` it in Server Components.

### Pattern 2: OnboardingStepper State Machine

**What:** A single Client Component owns all step navigation state. Child step components receive callbacks and data as props — they never touch Supabase directly.

**When to use:** Linear multi-step flows where steps share accumulated state.

```typescript
// components/onboarding/OnboardingStepper.tsx
'use client'

import { useState, useCallback } from 'react'
import type { Broker } from '@/lib/types'

interface StepperProps {
  broker: Broker
  token: string
}

export function OnboardingStepper({ broker, token }: StepperProps) {
  const [currentStep, setCurrentStep] = useState(broker.current_step ?? 1)
  const [formData, setFormData] = useState<Partial<OnboardingFormData>>({})
  const [policyAccepted, setPolicyAccepted] = useState(false)

  const goToStep = useCallback(async (step: number) => {
    setCurrentStep(step)
    // Persist step to Supabase (ONBD-13)
    await fetch(`/api/brokers/${token}/step`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    })
  }, [token])

  const handleNext = useCallback((stepData?: Partial<OnboardingFormData>) => {
    if (stepData) {
      setFormData(prev => ({ ...prev, ...stepData }))
    }
    goToStep(Math.min(currentStep + 1, 7))
  }, [currentStep, goToStep])

  const handleBack = useCallback(() => {
    goToStep(Math.max(currentStep - 1, 1))
  }, [currentStep, goToStep])

  const handleComplete = useCallback(async () => {
    await fetch(`/api/brokers/${token}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData }),
    })
  }, [token, formData])

  // Render current step component
  return (
    <div className="min-h-screen bg-background">
      <OnboardingHeader step={currentStep} totalSteps={7} />
      {/* AnimatePresence + motion.div wraps step content */}
      {currentStep === 1 && (
        <Step1Welcome broker={broker} onNext={handleNext} />
      )}
      {/* ... steps 2-7 */}
    </div>
  )
}
```

### Pattern 3: Step 1 Inline Editing Pattern

**What:** Fields display as read-only text by default. An "Edit" button per field (or one global edit toggle) reveals `<Input>` components with the current value as the default.

**When to use:** Pre-filled forms where read-only is the primary state but editing is needed.

```typescript
// components/onboarding/steps/Step1Welcome.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Broker } from '@/lib/types'

const Step1Schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable(),
  company_name: z.string().nullable(),
})

export function Step1Welcome({ broker, onNext }: { broker: Broker; onNext: (data: z.infer<typeof Step1Schema>) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(Step1Schema),
    defaultValues: {
      first_name: broker.first_name,
      last_name: broker.last_name,
      email: broker.email,
      phone: broker.phone ?? '',
      company_name: broker.company_name ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onNext)}>
      {/* ... fields */}
    </form>
  )
}
```

### Pattern 4: Step 2 Delivery Prefs with Conditional CRM URL

**What:** A radio group for delivery method (sms/email/crm_webhook). The CRM webhook URL input shows only when `crm_webhook` is selected. Use `watch` from react-hook-form to drive conditional visibility.

**When to use:** Progressive disclosure in forms — show advanced fields only when relevant selection is made.

```typescript
// components/onboarding/steps/Step2Delivery.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DeliveryPrefsSchema } from '@/lib/validations/delivery'

export function Step2Delivery({ broker, onNext }: StepProps) {
  const { register, handleSubmit, watch } = useForm({
    resolver: zodResolver(DeliveryPrefsSchema),
    defaultValues: {
      delivery_method: broker.delivery_method ?? 'sms',
      delivery_email: broker.delivery_email ?? broker.email,
      delivery_phone: broker.delivery_phone ?? broker.phone ?? '',
      crm_webhook_url: broker.crm_webhook_url ?? '',
      contact_hours: broker.contact_hours ?? 'business_hours',
      weekend_pause: broker.weekend_pause ?? false,
    },
  })

  const deliveryMethod = watch('delivery_method')

  return (
    <form onSubmit={handleSubmit(onNext)}>
      {/* Radio group: sms / email / crm_webhook */}
      {deliveryMethod === 'crm_webhook' && (
        <Input
          {...register('crm_webhook_url')}
          placeholder="https://hooks.example.com/..."
        />
      )}
      {/* ... */}
    </form>
  )
}
```

### Pattern 5: Completion API with waitUntil

**What:** POST /api/brokers/[token]/complete updates Supabase status to 'completed', stores delivery prefs and edits, then fires the GHL webhook without blocking the response.

**When to use:** Any background work that must complete but shouldn't delay the user response.

```typescript
// app/api/brokers/[token]/complete/route.ts
import { waitUntil } from '@vercel/functions'
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { notifyGHL } from '@/lib/ghl'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { formData } = await request.json()
  const supabase = createServiceClient()

  // Update Supabase — blocking (must succeed before responding)
  const { data: broker, error } = await supabase
    .from('brokers')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      // Step 1 edits (broker info)
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      company_name: formData.company_name,
      // Step 2 delivery prefs
      delivery_method: formData.delivery_method,
      delivery_email: formData.delivery_email,
      delivery_phone: formData.delivery_phone,
      crm_webhook_url: formData.crm_webhook_url,
      contact_hours: formData.contact_hours,
      weekend_pause: formData.weekend_pause,
    })
    .eq('token', token)
    .select()
    .single()

  if (error || !broker) {
    return Response.json({ error: 'Update failed' }, { status: 500 })
  }

  // Fire GHL webhook without blocking response (ONBD-11)
  // Only fires if GHL_COMPLETION_WEBHOOK_URL env var is configured
  if (process.env.GHL_COMPLETION_WEBHOOK_URL) {
    waitUntil(notifyGHL(broker))
  }

  return Response.json({ success: true })
}
```

### Pattern 6: GHL Completion Webhook Caller (lib/ghl.ts)

**What:** A simple fetch wrapper that posts the broker's completion data to the configured GHL webhook URL.

**When to use:** Only called via waitUntil in the completion route handler.

```typescript
// lib/ghl.ts
import type { Broker } from '@/lib/types'

export async function notifyGHL(broker: Broker): Promise<void> {
  const url = process.env.GHL_COMPLETION_WEBHOOK_URL
  if (!url) {
    console.warn('[ghl] GHL_COMPLETION_WEBHOOK_URL not configured — skipping notification')
    return
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ghl_contact_id: broker.ghl_contact_id,
        onboarding_status: 'completed',
        delivery_preferences: {
          delivery_method: broker.delivery_method,
          delivery_email: broker.delivery_email,
          delivery_phone: broker.delivery_phone,
          crm_webhook_url: broker.crm_webhook_url,
          contact_hours: broker.contact_hours,
          weekend_pause: broker.weekend_pause,
        },
        updated_fields: {
          first_name: broker.first_name,
          last_name: broker.last_name,
          email: broker.email,
          phone: broker.phone,
          company_name: broker.company_name,
        },
      }),
    })

    if (!response.ok) {
      console.error('[ghl] Completion webhook failed:', response.status, await response.text())
    }
  } catch (error) {
    console.error('[ghl] Completion webhook error:', error)
  }
}
```

### Pattern 7: ROI Calculator (Step 4)

**What:** Dynamic calculation using `deal_amount` and `batch_size` from the broker object. Guards against null and divide-by-zero.

```typescript
// In Step4ROI.tsx
function calculateROI(dealAmount: number, batchSize: number) {
  if (!dealAmount || !batchSize || batchSize === 0) return null

  const pricePerReferral = dealAmount / batchSize
  const closedAt5Pct = Math.floor(batchSize * 0.05)
  const closedAt10Pct = Math.floor(batchSize * 0.10)
  const closedAt15Pct = Math.floor(batchSize * 0.15)
  const avgCommissionLow = 3000
  const avgCommissionHigh = 5000
  const roiLow = (closedAt5Pct * avgCommissionLow) / dealAmount
  const roiHigh = (closedAt15Pct * avgCommissionHigh) / dealAmount

  return {
    pricePerReferral: pricePerReferral.toFixed(0),
    closedRange: `${closedAt5Pct}–${closedAt15Pct}`,
    roiRange: `${roiLow.toFixed(1)}x–${roiHigh.toFixed(1)}x`,
  }
}

// Usage:
const roi = calculateROI(broker.deal_amount, broker.batch_size)
if (!roi) {
  return <p>Contact Daniel for your personalized ROI breakdown.</p>
}
```

### Anti-Patterns to Avoid

- **Fetching broker data client-side in OnboardingStepper:** Causes loading spinner on entry, breaks "feels like we know you" first impression. Always fetch in the Server Component page.tsx and pass as prop.
- **Using useState-only for step progress:** Step loss on refresh. Use Supabase `current_step` persistence via the step PATCH endpoint.
- **Calling the GHL completion webhook without waitUntil:** On Vercel, bare unresolved promises terminate with the function. Use `waitUntil(notifyGHL(broker))`.
- **Multiple delivery method columns instead of single `delivery_method` text field:** The schema uses a single text column. Match it — radio buttons for delivery method, not checkboxes for multiple.
- **Validating inline edits only on final submit:** Validate each step before allowing "Next" using react-hook-form's `handleSubmit`. Step-level validation prevents the broker reaching step 7 with a broken email address.
- **Using framer-motion import path:** Import from `"motion/react"`, not `"framer-motion"`. Both work but the latter is the legacy path.
- **Triggering the status → in_progress update inside the Server Component:** Server Components run during SSR and should not have side effects. Trigger the status update client-side on mount in OnboardingStepper via a small fetch to `/api/brokers/[token]/start`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state + validation | Custom onChange handlers + manual error tracking | react-hook-form + zodResolver | Handles uncontrolled inputs, touched/dirty state, error display, submission; no re-renders on keypress — critical on mobile |
| Step transition animations | CSS keyframes or custom JS | motion AnimatePresence + motion.div | Handles enter/exit synchronization, prevents layout jumps during transitions |
| UI components (button, card, input, progress) | Styled divs | shadcn/ui | Dark theme CSS var support, accessible by default, already matches design system |
| Type-safe form data | Manual interface declarations | Zod schema + z.infer<> | Single source of truth; schema validates at runtime AND provides TypeScript types |
| Fire-and-forget async on Vercel | `fetch(url).catch(console.error)` (no await) | `waitUntil(promise)` from @vercel/functions | Bare promises are garbage-collected before resolution in serverless; waitUntil registers with the runtime |

**Key insight:** The form complexity in steps 1 and 2 is the implementation risk in this phase. react-hook-form's defaultValues pattern is the correct way to pre-fill forms with broker data while tracking what the user has changed — it distinguishes "unchanged from webhook" vs "user-edited" which matters for the completion payload's `updated_fields`.

---

## Common Pitfalls

### Pitfall 1: Schema Column Name Mismatch

**What goes wrong:** Code references column names from the original spec (`delivery_sms`, `preferred_hours`, `pause_weekends`) that don't exist in the actual DB schema.
**Why it happens:** The additional context and original spec used different names than what Phase 1 implemented. See the Schema Column Name Truth table above.
**How to avoid:** Always reference `lib/types.ts` and `supabase/schema.sql` for actual column names. Use `delivery_method`, `contact_hours`, `weekend_pause`.
**Warning signs:** Supabase returning "column does not exist" errors; TypeScript type errors on Broker property access.

### Pitfall 2: createServerClient is Async in This Project

**What goes wrong:** `createServerClient()` called without `await` returns a Promise, not the Supabase client.
**Why it happens:** In Next.js 16, `cookies()` returns a Promise, so the server client factory is also async. The Phase 1 implementation reflects this correctly.
**How to avoid:** Always `const supabase = await createServerClient()` in Server Components. Use `createServiceClient()` (sync, no cookies) in Route Handlers.
**Warning signs:** Supabase queries returning `.from is not a function` errors.

### Pitfall 3: Step State Lost on Browser Refresh

**What goes wrong:** Broker refreshes at step 5; React state resets; they restart from step 1.
**Why it happens:** `useState` is ephemeral. The Server Component initializes `broker.current_step` but if it's only used as initial useState value, refreshing re-runs the Server Component with the DB value — which is only updated if the PATCH step endpoint was called.
**How to avoid:** Call `PATCH /api/brokers/[token]/step` on every step advance (not just on completion). On page reload, the Server Component fetches the updated `current_step` from Supabase and passes the correct step as the initial useState value.
**Warning signs:** Testing refresh at step 3 drops back to step 1.

### Pitfall 4: Status "in_progress" Update Timing

**What goes wrong:** ONBD-12 requires status → "in_progress" on step 1 load. Doing this in the Server Component causes a side effect during SSR. Doing it too late (step 7) misses the "in progress" signal for admin monitoring.
**How to avoid:** Trigger in `useEffect` on mount in OnboardingStepper, with a guard to only fire if status is still 'not_started'. A POST to `/api/brokers/[token]/start` handles this.
**Warning signs:** Admin panel shows brokers stuck at 'not_started' who have been actively progressing through steps.

### Pitfall 5: ROI Calculator with Null/Zero Values

**What goes wrong:** `deal_amount / batch_size` produces NaN or Infinity if either is null or zero. This renders as "NaNx ROI" in the broker's face on step 4.
**Why it happens:** The Zod webhook schema marks `deal_amount` and `batch_size` as required, but the actual GHL payload might not match exactly. Numbers coerced from invalid strings produce NaN.
**How to avoid:** Always guard: `if (!broker.deal_amount || !broker.batch_size || broker.batch_size === 0)` before any division. Show a "Contact Daniel" fallback if calculation is impossible.
**Warning signs:** Testing with a broker record where deal_amount or batch_size is 0 shows NaN on step 4.

### Pitfall 6: GHL Completion Webhook URL Not Configured

**What goes wrong:** `lib/ghl.ts` is called with `process.env.GHL_COMPLETION_WEBHOOK_URL` undefined. The completion webhook silently never fires.
**Why it happens:** Daniel hasn't confirmed the GHL webhook URL yet (flagged as blocker in STATE.md). The env var may not be set in Vercel.
**How to avoid:** Guard in `lib/ghl.ts` with a null check and console warning. Include `GHL_COMPLETION_WEBHOOK_URL` in the env var documentation. The completion still saves to Supabase even if GHL notification is skipped.
**Warning signs:** Step 7 completes, broker status in Supabase → completed, but GHL contact is not tagged as onboarded.

### Pitfall 7: motion Components Causing Hydration Mismatches

**What goes wrong:** `motion.div` renders differently on server vs client, causing React hydration errors.
**Why it happens:** All motion components require `"use client"`. If a motion component is inside a Server Component, it breaks.
**How to avoid:** Ensure `OnboardingStepper` (and any component using motion) has `"use client"` at the top. Use `AnimatePresence` only inside Client Components.
**Warning signs:** Browser console shows "Hydration failed because the server rendered HTML didn't match the client".

---

## Exact Copy for Each Step

The PPL Onboarding Prompt.md contains the exact copy for each step. Key extracts:

### Step 1 - Welcome
- Headline: `"Welcome to the BadAAAS Network, {first_name}."`
- Subtext: `"You're locked in with {batch_size} exclusive referrals. Let's get you set up so they start hitting your phone."`
- Below card: `"Everything look right? If anything needs updating, tap to edit."`
- CTA: `"Looks Good — Let's Go"`

### Step 2 - Delivery Preferences
- Headline: `"How do you want to receive referrals, {first_name}?"`
- Options: SMS, Email, CRM webhook (with URL field if selected)
- Hours dropdown options: business hours only, anytime, custom time window
- Toggle: "Pause referrals on weekends?"
- CTA: "Next"

### Step 3 - How Referrals Work
- Headline: `"Here's How This Works"`
- 5 timeline items (exact copy in Prompt.md)
- Callout: `"Every referral is someone who actively requested funding. Your job is to reach them, build the relationship, and close the deal."`
- CTA: "Next"

### Step 4 - Setting Expectations
- Headline: `"Let's Set You Up for Success"`
- 4 sections: How Referrals Work, Your Close Rate, Not Every Referral Will Pick Up, This Is a Numbers Game
- ROI visual: `{batch_size} referrals × $65 = {deal_amount}` → `At 5% close rate = [calculated] funded deal(s)` → `Average commission = $3,000-$5,000` → `ROI: [calculated]x`
- Note: The "$65 per referral" figure is used in the close rate section copy; the ROI visual uses the actual `deal_amount / batch_size` for price per referral
- CTA: "Next"

### Step 5 - Best Practices
- Headline: `"Brokers Who Close Follow These Rules"`
- 5 numbered cards (exact copy in Prompt.md)
- CTA: "Next"

### Step 6 - Replacement Policy
- Headline: `"Our Guarantee"`
- Policy text (exact copy in Prompt.md)
- Checkbox: `"I understand the referral replacement policy"`
- "Next" CTA disabled until checkbox is checked

### Step 7 - Confirmation
- Headline: `"You're All Set, {first_name}. Go Fund Some Deals."`
- Subtext: `"Your {batch_size} referrals are on the way. Watch your [display their selected delivery method] — and remember, speed to lead wins."`
- Primary CTA: `"Go to Dashboard"` → links to `https://badaaas.com`
- Secondary link: `"Questions? Text Daniel at +1 (702) 412-9233"`

### Guard Pages

**GARD-01 (already onboarded):**
- Copy: `"You're already onboarded."` with link to badaaas.com and Daniel's contact info (+1 (702) 412-9233)

**GARD-02 (invalid token):**
- Copy: `"This link isn't valid. Text Daniel at +1 (702) 412-9233 if you need help."`

---

## Design System for Phase 2

The current `globals.css` has only a minimal media query setup. Phase 2 needs the full dark theme CSS variable system.

### Required globals.css Extension

```css
/* globals.css — extend the existing file */
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-accent: #EF4444;       /* Red accent for CTAs, key numbers (DSGN-01) */
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

/* Dark theme variables (forced — no light mode in this app) */
:root {
  --background: #0a0a0a;
  --foreground: #ededed;
  --card: #111111;
  --card-foreground: #ededed;
  --muted: #1a1a1a;
  --muted-foreground: #888888;
  --border: #222222;
}
```

The `next-themes` ThemeProvider in `layout.tsx` already has `forcedTheme="dark"` so no light mode styles are needed.

### Mobile-First Sizing Rules (DSGN-02)

- All buttons: `min-h-[44px]` (touch target minimum)
- Container: `max-w-lg mx-auto px-4` — centered, readable on mobile, not too wide on desktop
- Step content: `pb-24` bottom padding to prevent CTA buttons overlapping scroll content
- Progress bar: `h-2` on mobile, visible at top of screen

---

## New Environment Variables for Phase 2

| Variable | Value | Exposure |
|----------|-------|----------|
| `GHL_COMPLETION_WEBHOOK_URL` | Provided by Daniel — GHL webhook URL for completion notification | Server-only (no NEXT_PUBLIC_ prefix) |

This is the one known blocker: Daniel must provide this URL before `lib/ghl.ts` can be wired up. The completion flow should be built with a null guard so the rest of step 7 works even before this URL is configured.

---

## Code Examples

### Delivery Preferences Zod Schema

```typescript
// lib/validations/delivery.ts
import { z } from 'zod'

export const DeliveryPrefsSchema = z.object({
  delivery_method: z.enum(['sms', 'email', 'crm_webhook']),
  delivery_email: z.string().email().optional().or(z.literal('')),
  delivery_phone: z.string().optional(),
  crm_webhook_url: z.string().url().optional().or(z.literal('')),
  contact_hours: z.enum(['business_hours', 'anytime', 'custom']),
  weekend_pause: z.boolean(),
})

export type DeliveryPrefs = z.infer<typeof DeliveryPrefsSchema>
```

### Step Progress PATCH Route

```typescript
// app/api/brokers/[token]/step/route.ts
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { step } = await request.json()
  const supabase = createServiceClient()

  await supabase
    .from('brokers')
    .update({ current_step: step })
    .eq('token', token)

  return Response.json({ success: true })
}
```

### Status Start Route

```typescript
// app/api/brokers/[token]/start/route.ts
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createServiceClient()

  // Only update if currently not_started (idempotent)
  await supabase
    .from('brokers')
    .update({ status: 'in_progress' })
    .eq('token', token)
    .eq('status', 'not_started')

  return Response.json({ success: true })
}
```

### motion Step Transition Wrapper

```typescript
// components/onboarding/StepTransition.tsx
'use client'
import { motion, AnimatePresence } from 'motion/react'

interface StepTransitionProps {
  stepKey: number
  children: React.ReactNode
}

export function StepTransition({ stepKey, children }: StepTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `framer-motion` import | `motion/react` import (Motion 11+ rebrand) | Both work but use "motion/react" for new code |
| `@hookform/resolvers` v3 + Zod 3 | `@hookform/resolvers` v5 + Zod 4 | Breaking change — must use matching versions |
| `tailwindcss-animate` | `tw-animate-css` (auto by shadcn init) | v4 incompatible with old package |
| Vercel bare unresolved promises | `waitUntil()` from `@vercel/functions` | Bare promises may be GC'd before resolution in serverless |

**Deprecated/outdated:**
- `framer-motion` package name for imports: Not broken, but "motion/react" is canonical
- `@hookform/resolvers` v3 with Zod: Must use v5 for Zod 4 schema compatibility

---

## Open Questions

1. **GHL Completion Webhook URL (BLOCKER for ONBD-11)**
   - What we know: Daniel must provide the GHL webhook URL that receives the completion notification. The payload format is defined (see lib/ghl.ts pattern above).
   - What's unclear: The exact GHL webhook URL and whether any authentication headers are required.
   - Recommendation: Build completion flow with null guard on `GHL_COMPLETION_WEBHOOK_URL`. Supabase update works without it. Wire up GHL notification when URL is confirmed.

2. **delivery_method Single vs Multiple Selection**
   - What we know: The DB schema has `delivery_method` as a single text column. The original spec says "checkboxes, can select multiple." These are incompatible.
   - What's unclear: Whether Daniel wants to allow multiple delivery methods (requiring a schema change to array type or separate boolean columns).
   - Recommendation: Use radio buttons (single select) matching the existing schema. If multiple selection is required, add `delivery_sms boolean DEFAULT false` + `delivery_email_opt boolean DEFAULT false` + `delivery_crm_webhook boolean DEFAULT false` columns via migration. Do NOT migrate without explicit confirmation.

3. **shadcn/ui Initialization Status**
   - What we know: No `components/` directory exists; no `components.json` in project root. shadcn was not initialized in Phase 1.
   - What's unclear: Whether Phase 1 PLAN.md tasks included `npx shadcn init` or whether it's a Phase 2 task.
   - Recommendation: Phase 2 Wave 0 task must run `npx shadcn@latest init` before adding components. This writes `components.json`, updates `globals.css`, and adds base CSS variables.

---

## Sources

### Primary (HIGH confidence)
- Phase 1 source files verified directly: `lib/types.ts`, `lib/supabase/server.ts`, `supabase/schema.sql`, `package.json`, `app/layout.tsx`, `app/globals.css` — confirm actual column names, installed packages, and existing patterns
- Project STACK.md (2026-03-11) — all npm versions verified against npm registry on research date
- Project ARCHITECTURE.md (2026-03-11) — component responsibilities, data flow patterns
- Project PITFALLS.md (2026-03-11) — pitfalls verified against official docs
- Next.js 16.1.6 Server Components + dynamic routes — https://nextjs.org/docs/app/getting-started/server-components
- Supabase JS update/select patterns — https://supabase.com/docs/reference/javascript/update

### Secondary (MEDIUM confidence)
- react-hook-form defaultValues pattern for pre-filled forms — https://react-hook-form.com/docs/useform#defaultValues (verified against react-hook-form 7.x docs)
- motion/react AnimatePresence API — verified against Motion 12.x npm package; "motion/react" is the canonical import
- @hookform/resolvers v5 breaking change for Zod 4 — confirmed in STACK.md npm version verification

### Tertiary (LOW confidence)
- GHL completion webhook payload format — based on project spec only; actual GHL workflow URL and auth requirements unconfirmed by Daniel
- delivery_method single-select interpretation — inferred from schema design; original spec says multi-select checkboxes which conflicts with single text column

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Phase 1 package.json confirmed installed deps; Phase 2 additions (motion, react-hook-form) are version-verified from STACK.md research
- Architecture: HIGH — Server Component + Client Component pattern verified in Phase 1 code; completion webhook waitUntil pattern verified in ARCHITECTURE.md
- Copy/content: HIGH — verbatim from PPL Onboarding Prompt.md
- Pitfalls: HIGH — schema column names verified against actual Phase 1 source files; GHL webhook blocker documented with clear workaround
- GHL completion URL: LOW — unconfirmed blocker; mitigation in code pattern provided

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (stack is stable; Next.js 16.1.6 and motion 12.x unlikely to change within window)
