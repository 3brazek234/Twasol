# Deployment Guide — Wakeel Backend

## Current Setup

The backend is deployed to **Railway** using Railway's native GitHub integration (Option A).

### How it works

- Railway's GitHub App is connected to this repository
- **Every push to `main`** that changes files under `service/` triggers an automatic redeploy
- Railway builds the Docker image from `service/Dockerfile` and deploys it
- The Railway service is configured with **Root Directory: `service/`** (required because this is a monorepo)

### Important: Deploys are NOT gated on CI

> **This is a deliberate tradeoff, not an oversight.**

Railway deploys immediately on push to `main`, regardless of whether the `Backend CI` GitHub Actions workflow passes or fails. This means:

- A failing test suite does **not** block a deploy
- The `backend-ci.yml` workflow reports pass/fail on every push and PR for visibility, but has no enforcement power over Railway deploys
- Contributors should check the CI status badge before merging PRs to `main`

### Why not CI-gated deploys?

This repo is **public**. CI-gated deploys (Option B) would require storing a `RAILWAY_TOKEN` as a GitHub Actions secret. While GitHub isolates secrets from fork PRs by default, keeping zero deploy-related secrets in GitHub Actions is the more conservative posture for a public repo.

## Environment Variables

All secrets are configured in the **Railway Dashboard** under the backend service's Variables tab. They are never stored in this repository.

Required variables:
- `DATABASE_URL` — PostgreSQL connection string (use Railway's internal `.railway.internal` URL)
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — Authentication secrets
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — File upload service
- `SENTRY_DSN` — Error reporting
- `GOOGLE_WEB_CLIENT_ID` / `GOOGLE_IOS_CLIENT_ID` / `GOOGLE_ANDROID_CLIENT_ID` — OAuth (optional)
- `FREE_JOBS_LIMIT` — Free trial job application allowance per lawyer (optional, defaults to `3`)

See `service/.env.example` for the full list with placeholder values.

## Database Migrations & Deploy Order (Required)

### Required Deploy Sequence
1. **Migrations (Railway Pre-Deploy Command):** Runs `20261006000000_require_subscriptions_for_lawyers` (0-row no-op on prod), `20261107000000_add_user_suspended_at`, and `20261107000001_seed_suspended_at` (seeds `suspended_at` for 2 admin-deactivated accounts) **before** the new container starts.
2. **New Code Boot:** The server runs `assertDatabaseSchemaReady()` (`service/src/common/utils/startup-assert.ts`) before `server.listen()` and then serves traffic using `canUseApp(user)` (`deletedAt == null && suspendedAt == null`) and the free-trial allowance (`FREE_JOBS_LIMIT`).
3. **One-Time Cosmetic `is_active` Backfill (C4):** Aligns legacy `is_active = false` rows for approved, non-suspended, non-deleted lawyers (`UPDATE 1` on production today).
4. **Post-Deploy Read-Only Verification Queries:** Confirms `suspended_at IS NOT NULL` equals `2` and approved non-suspended active lawyers equals `1`.

### 1. Railway Pre-Deploy Command (Primary Mechanism)

To guarantee that Prisma migrations (such as `20261107000000_add_user_suspended_at` and `20261107000001_seed_suspended_at`) run **before** the new application container starts serving requests, configure Railway's **Pre-Deploy Command** on the backend service:

1. Open **Railway Dashboard** → Backend Service → **Settings** → **Deploy**
2. Set **Pre-Deploy Command** to:
   ```bash
   npm run prisma:migrate:prod
   ```
3. **Manual Verification on Deploy**: During the deploy, inspect the Railway deployment logs and confirm that the Pre-Deploy step prints:
   ```text
   All migrations have been successfully applied.
   ```
   before the new container boots.

### 2. Startup Schema Assertion (Safety Net)

On startup (`service/src/index.ts` → `service/src/common/utils/startup-assert.ts`), the server verifies that `users.suspended_at` exists in `information_schema.columns` and that `20261107000001_seed_suspended_at` has a non-null `finished_at` timestamp in `_prisma_migrations`. If the Pre-Deploy migration has not run, the process logs a fatal error and exits (`process.exit(1)`) rather than serving requests against an unmigrated schema.

*(Note: This startup assertion checks schema and migration completion status only; it does not validate the row-level data output of the seed query.)*

### 3. Post-Deploy Cosmetic Backfill (C4) & Read-Only Verification Queries

> **Note on `is_active` backfill urgency:** The `is_active` backfill below is **cosmetic**. No runtime access check reads `User.isActive` anymore (`canUseApp` and `hasSubscriptionAccess` check `deletedAt` and `suspendedAt` only), so a delayed or missed backfill **does not block any user**. However, do not skip it silently—running it keeps `is_active` consistent with `suspended_at IS NULL` in admin listings and database inspection.

1. **One-Time Cosmetic Backfill (Expected on Production: `UPDATE 1`):**
   ```sql
   UPDATE users
   SET is_active = true
   WHERE is_active = false
     AND deleted_at IS NULL
     AND suspended_at IS NULL
     AND verification_status = 'APPROVED';
   ```

2. **Post-Deploy Read-Only Verification Queries:**
   ```sql
   -- Verify suspended count (Expected on production: 2)
   SELECT COUNT(*) AS suspended_count
   FROM users
   WHERE suspended_at IS NOT NULL;

   -- Verify active, non-suspended, non-deleted, approved lawyers (Expected on production: 1)
   SELECT COUNT(*) AS active_approved_lawyers
   FROM users
   WHERE is_active = true
     AND suspended_at IS NULL
     AND deleted_at IS NULL
     AND verification_status = 'APPROVED';
   ```

### 4. Running Migrations Manually Against Production

If you ever need to inspect or apply migrations manually from a shell inside Railway:

```bash
railway ssh -- npx prisma migrate deploy
```

Or from your local machine if a public TCP proxy URL (`DATABASE_PUBLIC_URL`) is enabled:

```bash
DATABASE_URL="<PUBLIC_DATABASE_URL>" npm run prisma:migrate:prod
```
