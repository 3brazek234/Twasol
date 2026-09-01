---
name: backend-conventions
description: Core backend architecture, safety, and data-handling conventions for this Node/Express/Prisma/Zod lawyer marketplace API. Use whenever writing or reviewing backend code, API endpoints, Prisma schema changes, service logic, or database migrations for this project — even if not explicitly asked to "follow conventions."
---

# Backend Conventions

## Architecture
- Feature-based folders under `src/modules/<feature>/`, each with `routes.ts → controller.ts → service.ts → schema.ts`. Never put business logic in controllers or routes.
- Every route validates `req.body`/`req.params`/`req.query` through a Zod schema via a shared `validate(schema)` middleware, before controller logic runs.
- Environment variables are Zod-parsed at startup in `env.ts` — fail fast on missing/invalid vars, never read `process.env` directly elsewhere.
- Infer TypeScript types from Zod schemas with `z.infer<>` — never hand-write a duplicate interface alongside a schema.

## Money & Precision
- Any monetary field (salary, offers, fees) is Prisma `Decimal`, never `Float`. Floats lose precision on comparison/arithmetic and this is a marketplace with real financial agreements.

## State Changes — Compare-and-Swap, Not Read-Then-Write
- Any state transition where two actors could race (offer acceptance, job status changes) must use a conditional update, not a read-check-then-write:
  ```ts
  const result = await prisma.job.updateMany({
    where: { id: jobId, status: 'NEGOTIATING' }, // expected prior state
    data: { status: 'AGREED', ... }
  });
  if (result.count === 0) throw new AppError('CONFLICT', '...');
  ```
- Wrap the related updates (e.g., message offer status + job status) in a single `prisma.$transaction` — they commit together or not at all.

## Audit Logging
- State-changing actions worth a compliance trail (job status changes, offer accept/reject, verification review, role changes) write an `AuditLog` row **in the same transaction** as the change itself — never as a separate, unguarded write, and never via the async queue (audit writes need transactional consistency, async is for side effects like notifications).
- The `audit_logs` table is append-only at the database permission level (the app's DB role has `INSERT`/`SELECT` only, no `UPDATE`/`DELETE`) — don't rely on application-code discipline alone.

## Async Work
- Anything that fans out to many recipients or calls a third-party API (notification fan-out, push dispatch, email) goes through the BullMQ queue, never inline in a request handler that needs to return quickly.
- Batch third-party dispatches (e.g., Expo push accepts arrays up to 100) rather than one job per recipient.

## Soft Deletes
- Users are never hard-deleted given the audit trail and job/message history dependencies — use `deletedAt` + `isActive = false`.

## Bilingual Content (EN/AR)
- Platform-controlled content (courts, practice areas, notification templates) uses dedicated paired columns (`nameEn`/`nameAr`) or `i18next` template resources — never a single free-text field assumed to be one language.
- User-generated content (job titles/descriptions, chat messages) is stored as-authored, tagged with a `contentLocale` field, never force-translated or stored bilingually.
- API responses resolve to a single localized value server-side based on `req.locale`, not left for the client to pick between language variants.

## File Storage
- Anything sensitive (verification documents, ID photos) is stored in a **private** bucket, never a public URL. Generate short-lived signed URLs only at the moment of authorized access, and audit-log every access.
- Uploads use presigned PUT/POST directly from client to storage — never proxy file bytes through the API server.

## Search
- Full-text search on user content must account for both `english` and `arabic` Postgres text-search configs, selected per-row based on `contentLocale` — a single hardcoded config will silently fail to match the other language.
