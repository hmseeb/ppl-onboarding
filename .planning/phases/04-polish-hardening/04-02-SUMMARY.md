---
phase: 04-polish-hardening
plan: 02
subsystem: infra
tags: [ios, safari, viewport, dvh, mobile, keyboard]

requires:
  - phase: 02-onboarding-flow
    provides: OnboardingStepper and onboarding page components
provides:
  - iOS Safari viewport configuration with interactive-widget hint
  - dvh-based min-height on all broker-facing pages
affects: []

tech-stack:
  added: []
  patterns:
    - "Next.js Viewport export for viewport meta configuration"
    - "min-h-dvh over min-h-screen for iOS Safari keyboard handling"

key-files:
  created: []
  modified:
    - app/layout.tsx
    - components/onboarding/OnboardingStepper.tsx
    - app/onboard/[token]/complete/page.tsx
    - app/error/page.tsx

key-decisions:
  - "Only changed broker-facing pages to min-h-dvh; admin and landing pages left with min-h-screen"
  - "No custom CSS utility needed — Tailwind v4 supports min-h-dvh natively"

patterns-established:
  - "Viewport: export viewport config separately from metadata per Next.js 14+ API"
  - "iOS Safari: use min-h-dvh + interactiveWidget: resizes-content for keyboard-safe layouts"

requirements-completed: [INFR-04]

duration: 2min
completed: 2026-03-11
---

# Phase 04 Plan 02: iOS Safari dvh Viewport Handling Summary

**Next.js viewport export with interactiveWidget: 'resizes-content' and dvh-based heights on all broker-facing pages for iOS Safari keyboard handling**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-11T14:20:53Z
- **Completed:** 2026-03-11T14:22:35Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added Viewport export to layout.tsx with interactiveWidget: 'resizes-content' and maximumScale: 1
- Replaced min-h-screen with min-h-dvh in 3 broker-facing pages
- iOS Safari virtual keyboard no longer obscures onboarding form inputs

## Task Commits

Each task was committed atomically:

1. **Task 1: Add viewport configuration and dvh CSS utility** - `55a15ba` (feat)
2. **Task 2: Replace min-h-screen with min-h-dvh on onboarding pages** - `e37ead0` (feat)

## Files Created/Modified
- `app/layout.tsx` - Added Viewport type import and viewport export with interactive-widget config
- `components/onboarding/OnboardingStepper.tsx` - min-h-screen -> min-h-dvh
- `app/onboard/[token]/complete/page.tsx` - min-h-screen -> min-h-dvh
- `app/error/page.tsx` - min-h-screen -> min-h-dvh

## Decisions Made
- Only changed broker-facing pages (OnboardingStepper, complete, error) — admin and landing pages left unchanged since they are desktop-focused with no form inputs on mobile
- No custom CSS utility needed in globals.css — Tailwind v4 supports min-h-dvh natively

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase complete, ready for transition

---
*Phase: 04-polish-hardening*
*Completed: 2026-03-11*
