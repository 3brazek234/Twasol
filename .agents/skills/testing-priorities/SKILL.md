---
name: testing-priorities
description: Test coverage priorities and patterns for this project's backend and frontend. Use whenever writing unit/integration tests, reviewing test coverage, or deciding what to test first for a new feature.
---

# Testing Priorities

## Priority Order (test in this order, not by file/module convenience)
1. **Offer accept/reject race condition** — the compare-and-swap logic on offer acceptance is the highest-risk path in the system (real money, real conflict potential). Test concurrent accept attempts explicitly; exactly one should succeed, the other gets a clean conflict response, never corrupted state.
2. **Job status state machine** — every valid transition succeeds, every invalid one is rejected. Test the guard function in isolation, no DB needed.
3. **Court/practice-area matching logic** — extract as a pure function where possible; test against known seed data for correct inclusion/exclusion, not just "it returns something."
4. **Verification gating** — unverified users blocked from acting (apply/post), never from browsing. Test both the block and the explicit non-block.
5. Everything else (auth, CRUD, notifications) — standard coverage, lower relative priority than the above.

## What Unit/Integration Tests Do NOT Cover
Visual/layout bugs (clipped text, duplicated headers, misaligned cards) are **not** caught by this test suite — they need visual regression tooling or manual/screenshot QA. Don't treat a green test suite as proof the UI looks correct; these are different failure modes.

## Backend Patterns
- Pure logic (state machine guards, matching selection logic) → unit tests, no DB, fast, run on every save.
- API-level behavior → Supertest against a dedicated test Postgres DB, migrated fresh, truncated between suites.
- Mock BullMQ/Redis in unit tests; use real test instances only in integration tests specifically validating queue behavior.

## Frontend Patterns
- Optimistic-update mutations (`onMutate`/`onError`) — test the rollback path explicitly, not just the happy path. A stuck optimistic UI state on failure is a real, easy-to-miss bug.
- `OfferCard` — test sender vs. recipient button visibility as two explicit cases, and the `409`-conflict UI state.
- Respect-reduced-motion assertions — verify the animation code path is actually skipped, not just visually assumed to be.
