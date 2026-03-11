# Stack Research

**Domain:** Webhook-driven multi-step onboarding web app (SaaS/internal tooling)
**Researched:** 2026-03-11
**Confidence:** HIGH (all versions verified against npm registry and official docs)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.1.6 | Full-stack React framework | App Router is the current standard. Server Components, Route Handlers for webhooks, and proxy.ts for admin auth all colocate in one codebase. Vercel-native — zero config deploy. |
| React | 19.2 | UI runtime | Ships with Next.js 16. React Compiler (stable in v16) auto-memoizes components, eliminating manual useMemo/useCallback for form step state. |
| TypeScript | 5.x (min 5.1) | Type safety | Required by Next.js 16. Zod schemas give you validated types end-to-end from webhook payload to DB to UI. |
| Supabase | DB: ^2.99.1, SSR: ^0.9.0 | Database + realtime + storage | Free tier (500MB DB) is sufficient for broker records (a few thousand rows max). Direct SQL access via `@supabase/supabase-js`. No separate ORM needed. `@supabase/ssr` handles cookie-based sessions for App Router. |
| Tailwind CSS | 4.2.1 | Styling | v4 is CSS-first — no `tailwind.config.js` needed. Works natively with shadcn 4.x. The dark red premium aesthetic (`#EF4444` accent on dark bg) is 5 CSS variables. |
| Vercel | — | Deployment | Zero-config deploy for Next.js. Webhook endpoints work as Vercel Functions. **CRITICAL: Hobby plan is non-commercial only. This project (revenue-generating referral business) must use Vercel Pro ($20/mo/seat).** Free tier function timeout is 10s max — sufficient for webhook processing. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | 4.0.2 (CLI) | Accessible component primitives | Use for all UI: buttons, cards, inputs, dialog, progress. Copy-paste model — no runtime library overhead. Dark mode + custom CSS vars for the red accent theme. |
| next-themes | 0.4.6 | Theme provider for dark mode | Wrap root layout. Set `defaultTheme="dark"` and `forcedTheme="dark"` since this app is dark-only. Prevents hydration mismatch. |
| motion | 12.35.2 | Step transition animations | Use for the 7-step onboarding flow slide transitions, progress bar animations, and card fade-ins. Import from `"motion/react"` (new package name). Requires `"use client"` — wrap animated sections in client components. |
| react-hook-form | 7.71.2 | Form state management | Use for Step 2 (delivery preferences form with CRM URL field) and Step 1 (inline broker info editing). Zero uncontrolled-component re-renders matters on mobile. |
| @hookform/resolvers | 5.2.2 | Zod adapter for react-hook-form | Use alongside react-hook-form. `zodResolver` bridges schema validation to RHF's `register` API. Required to use Zod with RHF. |
| zod | 4.3.6 | Schema validation | Use for: (1) validating GHL webhook payload before inserting to DB, (2) delivery preference form schema, (3) broker data type inference. Single source of truth for data shape. |
| uuid | 13.0.0 | Token generation | Generate unique broker onboarding tokens. UUID v4 is sufficient (no need for CUID2 for this volume). Available server-side in Route Handlers. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript strict mode | Type safety enforcement | Enable `"strict": true` in tsconfig. Catches null/undefined bugs in webhook processing paths. |
| ESLint (flat config) | Code linting | Next.js 16 requires ESLint Flat Config format (`.eslintrc` deprecated). `next lint` command removed — run ESLint CLI directly. |
| Turbopack (built-in) | Dev build speed | Enabled by default in Next.js 16 `next dev`. No config needed. Replaces Webpack for dev and build. |

---

## Installation

```bash
# Bootstrap Next.js 16 with App Router + TypeScript + Tailwind v4
npx create-next-app@latest ppl-onboarding \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias "@/*"

# Initialize shadcn/ui (installs Tailwind v4, tw-animate-css, etc.)
npx shadcn@latest init

# Core Supabase
npm install @supabase/supabase-js @supabase/ssr

# Form handling
npm install react-hook-form @hookform/resolvers zod

# Animation
npm install motion

# Theme + utilities
npm install next-themes uuid

# Types for uuid
npm install -D @types/uuid
```

```bash
# Add shadcn components needed for the onboarding flow
npx shadcn@latest add button card input label progress
npx shadcn@latest add checkbox textarea badge separator
npx shadcn@latest add dialog alert
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| shadcn/ui | Radix UI (raw) | Only if you need full custom design system with zero shadcn opinions. More setup, same accessibility primitives. |
| shadcn/ui | Mantine | If you need a full-featured component library with charts and date pickers out of the box. Overkill for a 7-screen onboarding flow. |
| motion (framer-motion) | CSS transitions | For simple enter/exit. CSS transitions lack orchestration (staggered step reveals, drag gestures). Motion is correct for multi-step UX. |
| motion | GSAP | GSAP has larger bundle and licensing complexity (paid for commercial features). Motion is MIT, React-native. |
| react-hook-form + zod | Formik + Yup | RHF + Zod is the current standard. Formik has known performance issues with large forms. Yup is less TypeScript-native than Zod v4. |
| Supabase | PlanetScale / Neon | Supabase free tier is specified in project constraints. It also handles the broker token lookup via simple row query — no need for edge DB. |
| uuid v13 | nanoid | nanoid produces shorter IDs but uuid v4 is more universally recognizable as a token format. Either works; uuid is already a well-maintained v1 dep of many tools. |
| Vercel Pro | Railway / Render | Project is specified for Vercel. Railway/Render are viable alternatives if cost is a hard blocker, but Vercel's Next.js integration is deepest. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `middleware.ts` (Next.js 15 pattern) | Renamed to `proxy.ts` in Next.js 16. Using `middleware.ts` is deprecated and will be removed in a future version. | `proxy.ts` at the root of the project |
| `@supabase/auth-helpers-nextjs` | Deprecated in favor of `@supabase/ssr`. Using both in the same project causes auth conflicts. | `@supabase/ssr` with `createBrowserClient` / `createServerClient` |
| Pages Router (`pages/` directory) | App Router is the current standard in Next.js 13+. Pages Router lacks Server Components and native Route Handlers. Project is greenfield — no migration cost to avoid. | App Router (`app/` directory) |
| `process.env` serverRuntimeConfig / publicRuntimeConfig | Removed in Next.js 16. | `process.env.VAR` directly in Server Components, `NEXT_PUBLIC_VAR` for client-exposed values |
| `tailwindcss-animate` | Deprecated in Tailwind v4 / shadcn 4.x. New projects default to `tw-animate-css` instead. | `tw-animate-css` (installed automatically by `shadcn init`) |
| `framer-motion` import path | Not broken, but `"framer-motion"` is the legacy import. New projects should use the canonical package. | `import { motion } from "motion/react"` |
| Vercel Hobby plan for this project | **Hobby plan explicitly prohibits commercial use** (fair use guidelines). This app is an onboarding tool for a revenue-generating referral business. Using Hobby violates ToS and risks account suspension. | Vercel Pro ($20/mo/seat) |
| JWT libraries for admin auth | Overkill for a single-password admin panel. Adds key management complexity. | Simple cookie-based approach: POST `/api/admin/login`, check against `ADMIN_PASSWORD` env var, set signed cookie, verify in `proxy.ts` |
| Server Actions for webhook processing | Server Actions are designed for form mutations triggered by users. Webhooks from GHL are external POST requests — Route Handlers are the correct primitive. | `app/api/webhooks/ghl/route.ts` with `export async function POST(request: Request)` |

---

## Stack Patterns by Variant

**For the webhook ingestion endpoint (`/api/webhooks/ghl`):**
- Use Route Handler (`app/api/webhooks/ghl/route.ts`)
- Read raw body with `request.json()` (no bodyParser needed in App Router)
- Validate payload shape with Zod before touching the DB
- Use Supabase server client (not browser client) — no cookies needed for webhook routes
- Return `Response.json({ success: true }, { status: 200 })` immediately; GHL expects fast ACK

**For the onboarding flow pages (`/onboard/[token]`):**
- Dynamic segment: `app/onboard/[token]/page.tsx` — fetch broker data server-side using `params.token`
- Render steps as client components with `"use client"` for motion animations and form state
- Keep data-fetching in the server page component, pass data as props to the client step renderer
- Use `motion.div` with `AnimatePresence` for step transition — wrap in a client component

**For admin panel (`/admin`):**
- Protect via `proxy.ts` — check for `admin_session` cookie, redirect to `/admin/login` if missing
- Admin login: `app/admin/login/page.tsx` (client component with react-hook-form)
- Login action: `app/api/admin/login/route.ts` POST handler — compare `ADMIN_PASSWORD` env var, set httpOnly cookie
- Admin data table: server component — fetch all brokers directly from Supabase

**If animated transitions cause hydration issues:**
- Wrap motion components in `<Suspense>` with a non-animated fallback
- Use `LazyMotion` from `"motion/react"` to tree-shake animation features from the bundle

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 16.1.6 | React 19.2, TypeScript 5.1+ | Node.js 20.9+ required. React 18 no longer supported. |
| @supabase/ssr 0.9.0 | @supabase/supabase-js ^2.x | Do NOT mix with `@supabase/auth-helpers-nextjs` in the same project. |
| shadcn 4.0.2 (CLI) | Tailwind CSS 4.x, React 19 | Uses `tw-animate-css` not `tailwindcss-animate`. No `tailwind.config.js` — CSS-first config. |
| motion 12.35.2 | React 18+, React 19 | Import from `"motion/react"` for new projects. All motion components require `"use client"`. |
| react-hook-form 7.71.2 | @hookform/resolvers 5.2.2, zod 4.x | Must use `@hookform/resolvers` v5 for zod v4 compatibility. |
| zod 4.3.6 | @hookform/resolvers 5.x | Zod 4 has breaking changes from v3. Verify resolver version if upgrading. |

---

## Sources

- Next.js 16.1.6 official docs (route handlers, proxy.ts, version 16 upgrade guide) — https://nextjs.org/docs/app/api-reference/file-conventions/route, https://nextjs.org/docs/app/guides/upgrading/version-16 — HIGH confidence
- Supabase SSR docs (createBrowserClient / createServerClient pattern) — https://supabase.com/docs/guides/auth/server-side/creating-a-client — HIGH confidence
- npm registry version verification (all packages verified 2026-03-11): next@16.1.6, @supabase/supabase-js@2.99.1, @supabase/ssr@0.9.0, motion@12.35.2, react-hook-form@7.71.2, @hookform/resolvers@5.2.2, zod@4.3.6, tailwindcss@4.2.1, next-themes@0.4.6, uuid@13.0.0, shadcn@4.0.2 — HIGH confidence
- shadcn/ui official docs (Next.js installation, Tailwind v4 migration) — https://ui.shadcn.com/docs/installation/next, https://ui.shadcn.com/docs/tailwind-v4 — HIGH confidence
- Vercel Hobby plan docs (commercial use restriction confirmed) — https://vercel.com/docs/plans/hobby — HIGH confidence
- WebSearch: Supabase free tier limits (500MB DB, 50K MAU, projects pause after 7 days inactivity) — MEDIUM confidence (verify at https://supabase.com/pricing)
- WebSearch: Motion/framer-motion rebrand and Next.js 16 compatibility — MEDIUM confidence (verified version at npm registry)

---

*Stack research for: PPL Onboarding — webhook-driven multi-step broker onboarding app*
*Researched: 2026-03-11*
