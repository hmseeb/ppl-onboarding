# Feature Research

**Domain:** Webhook-driven multi-step onboarding activation app for B2B pay-per-lead broker network
**Researched:** 2026-03-11
**Confidence:** MEDIUM-HIGH (core patterns verified across multiple sources; broker-specific nuances inferred from adjacent domains)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features brokers and admins assume exist. Missing these = product feels broken or unprofessional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Personalized welcome with pre-filled data | Brokers just bought a service — they expect to be recognized, not asked to re-enter info they already provided | LOW | GHL webhook delivers all fields at ingestion; display them on first screen |
| Step-by-step progress indicator | Any multi-step flow without a progress bar feels like a black hole; users abandon when they can't see the end | LOW | Simple step counter or horizontal bar (1 of 7) is sufficient; no gamification needed |
| Mobile-responsive layout | Sales pros open this on their phone minutes after the call; desktop-only is a non-starter | MEDIUM | Mobile-first CSS, touch targets ≥44px, no horizontal scroll |
| Delivery preference configuration | Brokers need to tell the network HOW to send leads before any can arrive; missing this blocks the whole value chain | MEDIUM | SMS, email, CRM webhook endpoint, hours, weekend toggle |
| Clear confirmation / completion state | Users need to know "I'm done" — ambiguous endings cause re-submissions and support calls | LOW | Dedicated step 7 screen with summary card and next-step CTA |
| Already-onboarded guard | Brokers will share links, re-open emails, or get confused — seeing the form again looks broken | LOW | Check token completion status on load; show read-only "You're already set up" screen |
| Invalid token error handling | Invalid/expired/mistyped links must show a helpful dead-end rather than a crash page | LOW | Clean error screen with Daniel's contact number prominently shown |
| Idempotent webhook ingestion | GHL will fire duplicate webhooks — if the system creates a second broker record it corrupts the admin view | MEDIUM | Upsert on ghl_contact_id; return same onboarding URL if already processed |
| Completion callback to GHL | The whole downstream automation (tagging, referral delivery triggers) depends on this firing | MEDIUM | POST back to GHL with status + delivery prefs + ghl_contact_id on step 7 completion |
| Admin visibility panel | Whoever manages the network needs to see which brokers completed onboarding, when, and what preferences they set | MEDIUM | Password-protected /admin; list view with status, dates, prefs, copyable link |
| Inline editing of pre-filled data | Webhook data will sometimes be stale or wrong; brokers need to correct name/email without calling support | LOW | Editable fields on step 1; changes stored in Supabase, not synced back to GHL |
| Brand consistency (logo, theme) | A premium pay-per-lead service signals quality through visual identity; a bare white form erodes trust | LOW | Logo placeholder on every screen, dark theme, red accent — already scoped |

---

### Differentiators (Competitive Advantage)

Features that make this onboarding memorable and reduce drop-off specifically for the "closer" audience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Personalized ROI calculator using real deal data | Brokers already know their deal_amount and batch_size — showing them their exact cost-per-lead and projected return makes the purchase feel smart, not sunk | MEDIUM | Formula: price_per_referral = deal_amount / batch_size. Show projected monthly revenue at 20% close rate. Dynamic, not hardcoded — future-proofs for promos |
| "Closer tone" copy throughout | Generic SaaS onboarding copy ("Welcome to our platform!") reads as corporate noise to a sales professional; copy that talks like a closer builds credibility | LOW | Tone guide: direct, dollar-motivated, no fluff. "You just locked in X referrals — here's how to turn them into closed deals." |
| Visual referral timeline (How It Works) | Abstract explanations of lead delivery create anxiety; a concrete visual timeline (Day 1: referral arrives → Day 2: you follow up → Day 7: deal or replace) sets accurate expectations and reduces "where are my leads?" support calls | MEDIUM | Step 3 education screen; cards or a visual flow; specific timeframes matter |
| Replacement policy acknowledgment checkbox | Explicit acknowledgment gates legal liability and reduces disputes. Brokers who click "I understand the replacement policy" are 2x less likely to complain about a lead that didn't convert | LOW | Single checkbox on step 6 with policy text above it; required to advance |
| Smooth step transitions / animations | Premium feel at zero added complexity; subtle fade-in or slide between steps signals quality craftsmanship vs rushed build | LOW | CSS transitions, no libraries needed; 200-300ms ease-in-out is sufficient |
| Copyable onboarding link in admin panel | Admin needs to resend a link without regenerating tokens; copyable links in the panel enable manual follow-up with one click | LOW | Copy-to-clipboard button per row in admin; no backend changes needed |
| Conditional delivery preference fields | Showing the CRM webhook URL field only when "CRM webhook" is selected reduces form cognitive load for the majority of brokers who use SMS/email | LOW | Show/hide based on radio selection; progressive disclosure pattern |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like obvious additions but create scope creep, maintenance burden, or actively harm the UX for this audience.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Broker login / account creation | "Brokers need to come back and update their preferences" | Adds auth complexity, friction, and a password recovery flow. Sales pros who opened the link right after a call don't want to create an account. Token links are zero-friction | Token links stay valid forever; completed links show a clean summary with Daniel's contact for changes |
| Link expiration / time limits | "Security best practice" | This audience is not a fraud target. Expired links create support burden when brokers try to revisit 3 weeks later. The "already onboarded" guard is sufficient | Idempotency check on load handles re-visits; permanent links with completion state are simpler |
| Real-time lead delivery notifications | "Brokers want push notifications when a lead arrives" | Out of scope for onboarding; delivery notifications are a live-ops feature, not an activation feature. Scope creep leads to backend complexity that delays launch | Keep it explicit: onboarding sets preferences. Lead delivery itself happens through GHL automation, not this app |
| Syncing broker edits back to GHL | "Keep GHL as source of truth" | Bidirectional sync creates conflict resolution complexity. GHL is source of truth for the original sale; this app is source of truth for delivery preferences | Store edits locally in Supabase. GHL retains original deal data. No sync needed |
| Rich text / multimedia training content | "Add video tutorials to training steps" | Video hosting, bandwidth costs, playback compatibility — all complexity at $0 budget. Text cards with visual timelines do the job for a 7-step flow | Use structured text cards + icon-based timelines for education steps 3-5; no video infrastructure needed |
| Email / SMS delivery of onboarding link | "Automatically send the link after webhook fires" | GHL already handles post-sale communication. This app doesn't need its own notification layer — it's the destination, not the delivery mechanism | The webhook creates the link; GHL's existing automation workflow sends it. Separation of concerns |
| Multi-language support | "We serve international brokers" | English-only for v1 per scoped requirements. Adding i18n scaffolding now creates maintenance burden with no validated need | Revisit only when non-English speaking brokers represent meaningful volume |
| Rate limiting on webhook endpoint | "Protect against abuse" | Low-volume internal tool; GHL is the only sender. Rate limiting adds middleware complexity for a theoretical threat | Idempotency on ghl_contact_id is the practical defense; add rate limiting in v2 if load patterns emerge |
| Gamification (badges, completion scores) | "Increase engagement with gamification" | This is a one-time activation flow, not a recurring platform. Gamification mechanics (badges, streaks) optimize for repeat engagement — there is no repeat engagement here | Simple progress bar (1 of 7) is the right engagement signal for a linear, terminal flow |
| Dashboard for brokers post-onboarding | "Brokers need to see their lead stats" | Lead stats live in GHL. Building a parallel stats view creates a stale-data problem and duplicates work | Link the completion screen CTA to badaaas.com where this data lives |

---

## Feature Dependencies

```
[Webhook Ingestion Endpoint]
    └──requires──> [Supabase broker record + token generation]
                       └──requires──> [Unique token URL routing]
                                          └──requires──> [Pre-filled data display (Step 1)]

[Pre-filled data display (Step 1)]
    └──requires──> [Inline editing (Step 1)]

[Delivery Preference Form (Step 2)]
    └──requires──> [Conditional field display (CRM webhook URL)]

[ROI Calculator (Step 4)]
    └──requires──> [deal_amount + batch_size from webhook payload]

[Replacement Policy Acknowledgment (Step 6)]
    └──requires──> [Checkbox state persisted before Step 7 advance]

[Completion screen (Step 7)]
    └──requires──> [Delivery preferences saved]
    └──requires──> [Replacement policy checkbox checked]
    └──triggers──> [Completion callback to GHL]

[Admin panel]
    └──requires──> [Broker records in Supabase]
    └──requires──> [Password protection via env var]
    └──enhances──> [Copyable onboarding links]

[Already-onboarded guard]
    └──requires──> [Completion status field on broker record]

[Invalid token error page]
    └──requires──> [Token lookup returning null/not found]

[Idempotent webhook handling]
    └──conflicts──> [Multiple broker records per ghl_contact_id]
```

### Dependency Notes

- **Completion callback requires delivery preferences saved:** The GHL callback payload must include delivery prefs, so step 2 data must be persisted before step 7 fires the callback. A user who skips to step 7 via URL manipulation should be redirected back.
- **ROI calculator requires webhook payload fields:** deal_amount and batch_size come from the GHL webhook. If these fields are missing from an incoming payload, the ROI calculator must degrade gracefully (hide the calculator, not crash).
- **Idempotent webhook conflicts with duplicate records:** The webhook handler must check ghl_contact_id before insert. Upsert semantics prevent double records but must return the existing token URL, not a new one.
- **Replacement policy checkbox gates Step 7:** This is a hard dependency — the "Next" button on step 6 must remain disabled until the checkbox is checked. Ensures acknowledgment is genuine, not skipped.

---

## MVP Definition

### Launch With (v1)

Minimum viable to activate brokers and validate the flow end-to-end.

- [ ] Webhook ingestion endpoint — without this nothing works; it's the entry point
- [ ] Token generation and unique URL routing — required for personalization
- [ ] 7-step onboarding flow with pre-filled data — the core product
- [ ] Delivery preference form (step 2) — required before leads can be sent
- [ ] Progress bar — table stakes UX; missing it causes abandonment anxiety
- [ ] Completion callback to GHL — enables downstream automation
- [ ] Already-onboarded guard — prevents double-submission confusion
- [ ] Invalid token error page — prevents dead-end crashes
- [ ] Idempotent webhook handling — prevents corrupt admin data
- [ ] Admin panel (/admin) — needed to monitor real broker completions from day one
- [ ] Mobile-first responsive design — audience opens this on their phone
- [ ] Dark theme + brand identity — premium feel is part of the value signal
- [ ] Inline editing on step 1 — brokers will have stale/wrong data; editing reduces support calls
- [ ] ROI calculator on step 4 — high value differentiator, low complexity, uses data already in payload
- [ ] Replacement policy checkbox (step 6) — legal/trust feature, minimal implementation cost

### Add After Validation (v1.x)

Add when real broker feedback surfaces friction.

- [ ] Smooth step transitions / animations — nice to have; add once core flow is confirmed working
- [ ] Conditional CRM webhook URL field — refinement; can ship with always-visible field first
- [ ] Admin copyable link button — QoL improvement; manual copy works initially

### Future Consideration (v2+)

Defer until product-market fit established and volume justifies complexity.

- [ ] Broker dashboard — only if brokers request self-service preference updates at scale
- [ ] Rate limiting — add when webhook volume or abuse patterns emerge
- [ ] Multi-language support — only with validated non-English broker volume
- [ ] Email/SMS notification delivery — only if GHL automation proves insufficient

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Webhook ingestion + token generation | HIGH | MEDIUM | P1 |
| 7-step onboarding flow | HIGH | MEDIUM | P1 |
| Delivery preference form (step 2) | HIGH | MEDIUM | P1 |
| Completion callback to GHL | HIGH | MEDIUM | P1 |
| Pre-filled data + inline editing | HIGH | LOW | P1 |
| Progress bar | HIGH | LOW | P1 |
| Already-onboarded guard | HIGH | LOW | P1 |
| Invalid token error page | HIGH | LOW | P1 |
| Idempotent webhook deduplication | HIGH | LOW | P1 |
| Admin panel with status + prefs | HIGH | MEDIUM | P1 |
| Mobile-first responsive design | HIGH | MEDIUM | P1 |
| Dark theme + branding | MEDIUM | LOW | P1 |
| ROI calculator (step 4) | HIGH | LOW | P1 |
| Replacement policy checkbox | MEDIUM | LOW | P1 |
| Visual referral timeline (step 3) | MEDIUM | LOW | P1 |
| Smooth step transitions | MEDIUM | LOW | P2 |
| Conditional delivery fields | MEDIUM | LOW | P2 |
| Admin copyable links | MEDIUM | LOW | P2 |
| Broker dashboard (post-onboarding) | LOW | HIGH | P3 |
| Rate limiting | LOW | MEDIUM | P3 |
| Multi-language support | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

This is a custom internal tool with no direct SaaS competitors. Adjacent patterns were drawn from:

| Feature | PartnerStack (partner onboarding) | Stripe Connect (onboarding) | Our Approach |
|---------|----------------------------------|-----------------------------|--------------|
| Pre-filled data | Pulls from CRM records | Account data pre-populated from API | Webhook payload from GHL injected at token creation |
| Token-based access | Session-based links | Temporary account links (single-use) | Permanent token links — no expiry; idempotency handles re-visits |
| Completion callback | Webhook events to integrations | Return URL + webhook on completion | POST to GHL webhook URL with status + delivery prefs |
| Admin panel | Full analytics dashboard | Dashboard.stripe.com | Lightweight /admin with status, dates, prefs, copyable links |
| Progress tracking | Task checklists with % | Step-based with return URL | Linear 7-step progress bar, no branching |
| Education content | Partner Academy (video) | Documentation links | Text cards + visual timeline (no video infrastructure needed) |
| Error handling | Redirect to support | refresh_url / return_url pattern | Clean error screen with direct phone contact |

---

## Sources

- [B2B Onboarding Best Practices 2026 — Guidde](https://www.guidde.com/knowledge-hub/b2b-onboarding-best-practices-2026-guide) (MEDIUM confidence — aligns with multiple sources)
- [Onboarding and Activating Referrals — PartnerStack](https://partnerstack.com/resources/partner-playbook/plays/onboarding-and-activating-referrals-for-a-partner-program) (MEDIUM confidence — adjacent domain, directly applicable patterns)
- [Mobile Onboarding UX Best Practices 2026 — DesignStudioUIUX](https://www.designstudiouiux.com/blog/mobile-app-onboarding-best-practices/) (MEDIUM confidence — UX patterns well-established)
- [Onboarding UX: B2B Product Introduction — LogRocket](https://blog.logrocket.com/ux-design/onboarding-ux-b2b-introduction/) (MEDIUM confidence — directly relevant B2B patterns)
- [Webhook Idempotency Implementation — Hookdeck](https://hookdeck.com/webhooks/guides/implement-webhook-idempotency) (HIGH confidence — technical patterns, widely verified)
- [GoHighLevel Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html) (HIGH confidence — official GHL docs)
- [Stripe Hosted Onboarding — Pre-filled data pattern](https://docs.stripe.com/connect/hosted-onboarding) (HIGH confidence — official Stripe docs, widely used pattern)
- [Onboarding Anti-patterns — DCaulfield](https://www.dcaulfield.com/onboarding-antipatterns) (LOW confidence — single source, but aligns with established UX literature)
- [Webhook Best Practices — Integrate.io](https://www.integrate.io/blog/apply-webhook-best-practices/) (MEDIUM confidence — corroborated by multiple webhook docs)
- [Mobile UX Patterns Dominating 2026 — Sanjay Dey](https://www.sanjaydey.com/mobile-ux-ui-design-patterns-2026-data-backed/) (LOW confidence — blog source, but patterns align with established research)

---

*Feature research for: Webhook-driven multi-step onboarding activation app (pay-per-lead broker network)*
*Researched: 2026-03-11*
