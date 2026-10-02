# Lawyer Job Marketplace Backend

## Environment Setup

1. Copy `.env.example` to `.env`
2. Configure the required environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string. When running with multiple instances, ensure you use a connection pooler like PgBouncer and append `?pgbouncer=true&connection_limit=5`.
   - `REDIS_URL`: Your Redis connection string.
   - `JWT_SECRET` / `JWT_REFRESH_SECRET`: Secrets for authentication tokens.
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`: Cloudflare R2 bucket settings. **Important**: The credentials must be scoped ONLY to `GetObject` and `PutObject` for this specific bucket, as they are used to generate presigned URLs for client uploads and admin viewing.
   - `SENTRY_DSN`: Your Sentry project DSN for observability.

## Running the Application

```bash
npm install
npm run build
npm start
```

## Pre-commit Checks

Install the repository-level dependencies once with `npm install` from the repository root. Husky then runs `npm run precommit` before each commit. The gate runs the configured Admin linter, TypeScript checks for Service, Mobile, and Admin, and the Service unit tests. Run the same checks manually with:

```bash
npm run precommit
```
