# Requirements: PPL Onboarding

**Defined:** 2026-03-11
**Core Value:** Every broker who buys referrals completes onboarding fast, feels recognized, understands the network, and is set up to receive and close leads immediately.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Webhook & Data Layer

- [x] **HOOK-01**: API endpoint (POST /api/webhooks/ghl) accepts GHL webhook payload with all required fields (first_name, last_name, email, phone, company_name, state, primary_vertical, secondary_vertical, batch_size, deal_amount, ghl_contact_id)
- [x] **HOOK-02**: Webhook payload is validated with Zod schema before database write; malformed payloads return 400 with error details
- [x] **HOOK-03**: Broker record is stored in Supabase with a generated UUID token on successful webhook
- [x] **HOOK-04**: Webhook response returns JSON with onboarding_url, broker_name, and status ("created" or "exists")
- [x] **HOOK-05**: Duplicate webhooks for same ghl_contact_id are handled idempotently (upsert, return existing token URL)
- [x] **HOOK-06**: GET endpoint (/api/brokers/[token]) returns broker data and onboarding status (not_started, in_progress, completed)

### Onboarding Flow

- [ ] **ONBD-01**: Personalized onboarding URL (/onboard/[token]) loads broker data server-side and renders pre-filled experience
- [ ] **ONBD-02**: Progress bar at top shows current step (1-7) throughout entire flow
- [ ] **ONBD-03**: Step 1 (Welcome) displays personalized headline with first_name, pre-filled summary card (name, company, email, phone, verticals, batch size), and inline editing on all pre-filled fields
- [ ] **ONBD-04**: Step 2 (Delivery Preferences) allows selecting SMS, email, CRM webhook (with URL field shown conditionally), preferred hours dropdown, and weekend pause toggle
- [ ] **ONBD-05**: Step 3 (How Referrals Work) displays visual timeline/cards showing the 5-step referral process with callout box
- [ ] **ONBD-06**: Step 4 (Setting Expectations) displays education sections with personalized ROI calculator using actual deal_amount/batch_size (dynamic price per referral, not hardcoded)
- [ ] **ONBD-07**: Step 5 (Best Practices) displays 5 numbered cards with closing advice
- [ ] **ONBD-08**: Step 6 (Replacement Policy) displays guarantee policy with required checkbox acknowledgment that gates progression to step 7
- [ ] **ONBD-09**: Step 7 (Confirmation) displays combined summary of webhook data + onboarding selections, CTA to badaaas.com, secondary link to text Daniel at +1 (702) 412-9233
- [ ] **ONBD-10**: On step 7 completion, broker status updates to "completed" in database with all delivery preferences and edits stored
- [ ] **ONBD-11**: On step 7 completion, completion webhook fires to configurable GHL URL with ghl_contact_id, onboarding_status, delivery_preferences, and updated_fields
- [ ] **ONBD-12**: Step 1 load updates broker status to "in_progress" in database
- [ ] **ONBD-13**: Current step is persisted to database so brokers can resume where they left off on page refresh

### Guard Pages

- [ ] **GARD-01**: Visiting a completed onboarding link shows "You're already onboarded" screen with dashboard link (badaaas.com) and Daniel's contact info
- [ ] **GARD-02**: Visiting an invalid/non-existent token shows clean error page with message and Daniel's contact info (+1 (702) 412-9233)

### Admin Panel

- [ ] **ADMN-01**: Admin panel at /admin is password-protected (env var ADMIN_PASSWORD)
- [ ] **ADMN-02**: Admin password check includes server-side verification (not middleware-only) to prevent CVE-2025-29927 bypass
- [ ] **ADMN-03**: Admin panel displays list of all brokers with: name, company, status (not_started/in_progress/completed), webhook received date, onboarding completed date, delivery preferences
- [ ] **ADMN-04**: Admin panel includes copy-to-clipboard button for each broker's onboarding link

### Design & UX

- [ ] **DSGN-01**: Dark theme with light text and red accent color for CTAs and key numbers
- [ ] **DSGN-02**: Mobile-first responsive design with touch-friendly targets (min 44px)
- [ ] **DSGN-03**: BadAAAS logo placeholder displayed at top of every onboarding screen
- [ ] **DSGN-04**: Smooth transitions between steps with subtle animations
- [ ] **DSGN-05**: All copy uses direct, confident, money-motivated tone — no corporate fluff
- [ ] **DSGN-06**: ROI graphic on step 4 is visually impactful with personalized numbers that pop

### Infrastructure

- [x] **INFR-01**: Next.js app deployed on Vercel with all environment variables configured
- [x] **INFR-02**: Supabase project with brokers table schema matching webhook payload + onboarding fields
- [x] **INFR-03**: Supabase keepalive mechanism (cron or scheduled ping) to prevent free-tier auto-pause
- [ ] **INFR-04**: iOS Safari viewport handling using dvh units to prevent keyboard overlap issues

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Broker Dashboard

- **DASH-01**: Broker can view their referral batch status, delivery preferences, and contact info post-onboarding
- **DASH-02**: Broker can update delivery preferences without re-doing onboarding

### Security & Scale

- **SECR-01**: Rate limiting on webhook endpoint to prevent spam
- **SECR-02**: GHL webhook signature/HMAC verification
- **SECR-03**: Admin panel with proper authentication (Supabase Auth or NextAuth)

### Analytics

- **ANLC-01**: Track step drop-off rates for sales follow-up
- **ANLC-02**: Onboarding completion rate dashboard

## Out of Scope

| Feature | Reason |
|---------|--------|
| Broker login / accounts | Token-in-URL is the credential; auth adds friction for sales pros |
| Link expiration | Permanent links with completion guard are simpler; idempotency handles re-visits |
| Syncing edits back to GHL | Bidirectional sync creates conflict resolution complexity; edits stored locally only |
| Email/SMS delivery of onboarding link | GHL handles post-sale communication; this app is the destination, not the delivery mechanism |
| Video training content | Storage/bandwidth costs at $0 budget; text cards + visual timelines are sufficient |
| Multi-language support | English-only; no validated non-English broker volume |
| Gamification / badges | One-time linear flow; engagement mechanics optimize for repeat visits that don't exist |
| Real-time notifications | Onboarding is activation, not live ops; notifications are a lead delivery feature |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOOK-01 | Phase 1 | Complete |
| HOOK-02 | Phase 1 | Complete |
| HOOK-03 | Phase 1 | Complete |
| HOOK-04 | Phase 1 | Complete |
| HOOK-05 | Phase 1 | Complete |
| HOOK-06 | Phase 1 | Complete |
| ONBD-01 | Phase 2 | Pending |
| ONBD-02 | Phase 2 | Pending |
| ONBD-03 | Phase 2 | Pending |
| ONBD-04 | Phase 2 | Pending |
| ONBD-05 | Phase 2 | Pending |
| ONBD-06 | Phase 2 | Pending |
| ONBD-07 | Phase 2 | Pending |
| ONBD-08 | Phase 2 | Pending |
| ONBD-09 | Phase 2 | Pending |
| ONBD-10 | Phase 2 | Pending |
| ONBD-11 | Phase 2 | Pending |
| ONBD-12 | Phase 2 | Pending |
| ONBD-13 | Phase 2 | Pending |
| GARD-01 | Phase 2 | Pending |
| GARD-02 | Phase 2 | Pending |
| ADMN-01 | Phase 3 | Pending |
| ADMN-02 | Phase 3 | Pending |
| ADMN-03 | Phase 3 | Pending |
| ADMN-04 | Phase 3 | Pending |
| DSGN-01 | Phase 2 | Pending |
| DSGN-02 | Phase 2 | Pending |
| DSGN-03 | Phase 2 | Pending |
| DSGN-04 | Phase 4 | Pending |
| DSGN-05 | Phase 2 | Pending |
| DSGN-06 | Phase 2 | Pending |
| INFR-01 | Phase 1 | Complete |
| INFR-02 | Phase 1 | Complete |
| INFR-03 | Phase 1 | Complete |
| INFR-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after roadmap creation*
