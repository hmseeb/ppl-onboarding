---
phase: 02-onboarding-flow
plan: 03
subsystem: ui
tags: [onboarding, roi-calculator, timeline, content-steps]

requires:
  - phase: 02-onboarding-flow
    provides: OnboardingStepper shell, broker types, shadcn components
provides:
  - Step 3 How Referrals Work timeline
  - Step 4 Personalized ROI calculator
  - Step 5 Best Practices cards
affects: [02-onboarding-flow]

tech-stack:
  added: []
  patterns: [dynamic ROI calculation from broker data, content steps with no form state]

key-files:
  created:
    - components/onboarding/steps/Step3HowItWorks.tsx
    - components/onboarding/steps/Step4ROI.tsx
    - components/onboarding/steps/Step5BestPractices.tsx
  modified:
    - components/onboarding/OnboardingStepper.tsx

key-decisions:
  - "closedAt5Pct minimum of 1 to avoid showing 0 funded deals for small batches"
  - "ROI calculation uses deal_amount/batch_size (never hardcoded $65)"

patterns-established:
  - "Content steps receive only onNext/onBack (no form data needed)"
  - "ROI null guard with fallback to Daniel's contact"

requirements-completed: [ONBD-05, ONBD-06, ONBD-07, DSGN-05, DSGN-06]

duration: 3min
completed: 2026-03-11
---

# Phase 02 Plan 03: Steps 3-5 Summary

**Step 3 referral timeline, Step 4 personalized ROI calculator with red-accented numbers, Step 5 best practices cards**

## Performance

- **Duration:** 3 min
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Step 3 displays 5-step referral process timeline with vertical connector and callout box
- Step 4 shows personalized ROI calculator using actual broker deal_amount and batch_size
- Step 4 ROI visual uses large text (3xl/4xl) with red accent for dollar amounts
- Step 5 shows 5 numbered best practices cards with bold titles
- All copy matches original spec verbatim

## Task Commits

1. **Task 1: Step 3 and Step 5** - `a9e081b` (feat)
2. **Task 2: Step 4 ROI and wire Steps 3-5** - `7a32458` (feat)

## Decisions Made
- closedAt5Pct uses Math.max(floor, 1) to ensure at least 1 funded deal shows for small batches
- ROI calculation is purely dynamic: deal_amount / batch_size (no hardcoded $65)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Next Phase Readiness
- Steps 1-5 complete, ready for Steps 6-7 (Plan 04)

---
*Phase: 02-onboarding-flow*
*Completed: 2026-03-11*
