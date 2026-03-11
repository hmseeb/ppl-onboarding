# PPL Onboarding

## What This Is

A multi-step onboarding web app for BadAAAS/QuietFunding's pay-per-lead referral network. When a broker purchases exclusive referrals and gets moved to "Deal Won" in GoHighLevel (GHL), a webhook fires and creates a personalized onboarding link. The broker clicks it, sees all their pre-filled info, sets delivery preferences, learns how the network works, and gets ready to close deals. Built on Next.js + Supabase, deployed on Vercel — all free tier.

## Core Value

Every broker who buys referrals completes onboarding fast, feels like we already know them, understands how the network works, and is set up to receive and close leads immediately.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Webhook endpoint receives GHL payload, stores broker data, generates unique token, returns personalized onboarding URL
- [ ] Personalized 7-step onboarding flow pre-filled with broker's webhook data
- [ ] Step 1: Welcome screen with pre-filled summary card, inline editing capability
- [ ] Step 2: Referral delivery preferences (SMS, email, CRM webhook with URL field, hours, weekend pause)
- [ ] Step 3: How Referrals Work education screen (visual timeline/cards)
- [ ] Step 4: Setting Expectations with personalized ROI calculator using actual deal_amount/batch_size
- [ ] Step 5: Best Practices for Closing (numbered cards)
- [ ] Step 6: Referral Replacement Policy with checkbox acknowledgment
- [ ] Step 7: Confirmation screen with combined summary, CTA to badaaas.com
- [ ] Progress bar showing current step (1-7)
- [ ] Completion webhook fires back to GHL with broker status, delivery preferences, ghl_contact_id
- [ ] Admin panel at /admin (password-protected) showing all brokers, statuses, dates, delivery prefs, copyable links
- [ ] GET endpoint returns broker data and onboarding status by token
- [ ] Already-completed links show "You're already onboarded" screen
- [ ] Invalid tokens show clean error page with Daniel's contact info
- [ ] Duplicate webhook handling (idempotent on ghl_contact_id)
- [ ] Mobile-first responsive design
- [ ] Dark theme with red accent color, premium feel
- [ ] Smooth step transitions with subtle animations
- [ ] BadAAAS logo placeholder on every screen
- [ ] Daniel's contact: +1 (702) 412-9233

### Out of Scope

- Broker dashboard — v2 (link to badaaas.com for now)
- Authentication/login for brokers — they use unique token links, no accounts
- Syncing broker edits back to GHL — edits stored locally in Supabase only
- Link expiration — links stay valid forever, completed ones show "already onboarded"
- Rate limiting — v2 (low risk given GHL is only webhook source)
- Real-time notifications — not needed for onboarding flow
- Multi-language support — English only
- Payment processing — handled externally in GHL

## Context

- **Business**: BadAAAS/QuietFunding runs a pay-per-lead referral network for MCA, SBA, equipment finance, working capital, and lines of credit brokers
- **Audience**: Sales professionals (brokers), not tech people. They'll open this on their phone right after the sales call
- **CRM**: GoHighLevel (GHL) is the source of truth. Webhook fires on "Deal Won" status change
- **Tone**: Direct, confident, money-motivated. Talk like a closer talks to another closer. No corporate fluff
- **ROI Math**: Price per referral = deal_amount / batch_size (dynamic, not hardcoded). This future-proofs for promos, volume discounts, and vertical-specific pricing
- **Contact**: Daniel at +1 (702) 412-9233 for broker support
- **Verticals**: MCA, SBA, Equipment Finance, Working Capital, Lines of Credit, Other

## Constraints

- **Tech Stack**: Next.js + Supabase + Vercel — all free tier
- **Budget**: $0/month — must stay within free tier limits (Vercel 100GB bandwidth, Supabase 500MB DB)
- **Design**: Dark theme, red accent (#EF4444 or similar), mobile-first, premium feel
- **Admin Auth**: Simple password protection using env variable ADMIN_PASSWORD (value: BadAaa$2026)
- **No Accounts**: Brokers access via unique token URLs only, no registration/login
- **Webhook Format**: GHL sends: first_name, last_name, email, phone, company_name, state, primary_vertical, secondary_vertical, batch_size, deal_amount, ghl_contact_id

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + Supabase + Vercel | Free tier handles volume, proper API routes, one codebase, scales properly | — Pending |
| Dynamic price per referral (deal_amount/batch_size) | Future-proofs for promos, volume discounts, vertical pricing changes | — Pending |
| No link expiration | Simpler UX, completed links show "already onboarded" screen instead | — Pending |
| Edits stored locally only | Reduces webhook complexity, GHL remains source of truth for original data | — Pending |
| Completion webhook back to GHL | Enables downstream automation (tagging, referral delivery triggers) | — Pending |
| Token-based access, no auth | Brokers are sales pros, not tech people — zero friction access | — Pending |
| Admin password via env var | Simple for v1, upgradeable to proper auth later | — Pending |

---
*Last updated: 2026-03-11 after initialization*
