---
name: frontend-conventions
description: React Native/Expo architecture, state management, and RTL/i18n conventions for this lawyer marketplace mobile app. Use whenever writing screens, components, hooks, or navigation for the mobile app — even if not explicitly asked to "follow conventions."
---

# Frontend Conventions

## State Management Split
- **Server state**: TanStack Query (React Query) for anything fetched from the API — jobs, conversations, notifications, profiles. Never duplicate this in Zustand.
- **Client/transient state**: Zustand for auth session, socket connection status, court-activity pulse, active conversation — state that isn't a cached server response.
- Every mutation that affects something visible immediately (applying to a job, accepting an offer, swiping a triage card) uses React Query's optimistic update (`onMutate`) with rollback (`onError`) — the UI should never wait on a round-trip for something the user expects to feel instant.

## Component Reuse — Check Before Building
Before creating a new component, check whether one of these already exists and should be reused instead of duplicated: `StarRating` (interactive + display modes), `FilterChipRow`, `OfferCard`, `EmptyState`, `SettingsRow`, `JobListRow`. Flag it explicitly if an existing component doesn't cleanly fit a new use case — don't silently fork a parallel version.

## Animation
- Anything performance-sensitive (Offer Card transitions, ambient pulse indicators, swipe gestures) runs on the UI thread via Reanimated shared values — never drive continuous/gesture-driven animation through React state.
- Always respect `useReducedMotion()` — provide a static/instant fallback, don't just skip the animation and leave the end state ambiguous.

## RTL & i18n (Arabic + English)
- All user-facing strings go through `t()` from `react-i18next` — no hardcoded string literals in JSX.
- Use RN's logical layout properties (`start`/`end`) instead of `left`/`right` — the latter does not flip correctly under RTL.
- Directional icons (chevrons, back arrows) need explicit mirroring under `I18nManager.isRTL` — they don't auto-flip.
- `I18nManager.forceRTL()` requires an app restart to take effect — any language-switching UI must communicate this explicitly, never leave the app in a silently-broken intermediate layout state.
- New screens must be verified under RTL before being considered complete, not just under the default LTR layout.

## Forms
- Multi-step forms use a single form-library instance (React Hook Form) spanning all steps, not separate per-step forms — back-navigation must preserve previously entered values.

## Sockets
- Socket connection only initiates after auth hydration completes (never connect on a not-yet-verified token).
- Reconnection must rejoin previously active rooms and deduplicate any replayed events (e.g., by message ID) — never assume a fresh connection starts from a clean slate.
