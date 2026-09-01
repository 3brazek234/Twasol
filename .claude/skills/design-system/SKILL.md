---
name: design-system
description: Visual design tokens, UI copy voice, and the Offer Card's signature treatment for this app. Use whenever styling any component, writing UI copy or microcopy (buttons, empty states, errors), or reviewing visual consistency across screens.
---

# Design System

## Tokens
Use only these named tokens — never a raw hex value or ad hoc color in component styles:
- `ink` — primary text (deep navy, not black)
- `paper` — background (warm off-white)
- `signal` — primary action / positive / agreed state (teal, not generic SaaS blue)
- `docket` — attention/pending state (amber) — **never use red for this.** Red means something is broken. A pending verification, a new job alert, or an unread badge is not an error state, and using red there undermines trust on first impression.
- `line` — borders/dividers (warm gray)
- `muted` — secondary text, timestamps, metadata

All spacing uses the `xs/sm/md/lg/xl/xxl` scale — grep for hardcoded pixel values before considering a screen done.

## Copy Voice
- Name things by what the user controls, not backend structure ("Manage your courts," never "Configure court associations").
- Buttons and their resulting confirmation use identical vocabulary end to end (`Send offer` → toast says `Offer sent`, not `Submitted successfully`).
- Empty states and errors give **direction, not apology** — state what happened and what to do next in plain declarative sentences. No "Oops!"

## The Offer Card
This is the app's one signature, novel interaction (two lawyers agreeing on a fee inside a live chat) — it's the single place that earns a bold visual treatment. Keep everything else (lists, chat text, notifications) disciplined and quiet around it, don't let other elements compete for attention.
- Distinct card, not a chat bubble — mono-numeral amount, status pill (`signal`/`docket`/`muted` per state), full-width Accept/Decline.
- Accept/Decline only render for the message **recipient**, never the sender.
- On a conflict (someone else already accepted), show it in-thread as a factual system message — no apology, no generic error toast.

## List Rows / Cards
- Any repeated list item (jobs, notifications, lawyers) gets an actual bounded card — a `line`-colored border and `radius.lg` corners — never floating text relying on whitespace alone to separate items. Disconnected metadata (a date/price line with no visible container) reads as belonging to the wrong item.
- Any horizontally scrolling row (filter chips, etc.) needs explicit `paddingHorizontal` on the scroll container itself, not just its children — first/last items clip at the screen edge otherwise. This has been a recurring bug; check for it specifically.

## Headers
- One header per screen. Before adding a new header element (a toggle, an indicator, an icon), check whether an existing header already renders something equivalent — duplicated headers from separately-built features is a recurring failure mode in this project.
