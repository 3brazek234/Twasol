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

See `service/.env.example` for the full list with placeholder values.

## Running Migrations Against Production

To push schema changes to the production database from your local machine:

```bash
DATABASE_URL="<PUBLIC_DATABASE_URL>" npm run prisma:migrate:prod
```

Use the **`DATABASE_PUBLIC_URL`** from Railway's PostgreSQL service Variables tab (the `.internal` URL is not reachable from your local machine).
