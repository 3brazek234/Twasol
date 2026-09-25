-- CreateEnum
CREATE TYPE "JobTaskType" AS ENUM ('ATTEND_SESSION', 'OBTAIN_DOCUMENT', 'FILE_PLEADING', 'REGISTER_PROPERTY', 'REVIEW_DOCKET', 'OTHER');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "circuit_name" TEXT,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "expired_at" TIMESTAMP(3),
ADD COLUMN     "negotiating_since" TIMESTAMP(3),
ADD COLUMN     "court_id" TEXT,
ADD COLUMN     "session_date" TIMESTAMP(3),
ADD COLUMN     "task_type" "JobTaskType";


-- Enable trigram extension for Arabic fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram indexes for FTS
CREATE INDEX idx_jobs_title_trgm ON "jobs" USING gin (title gin_trgm_ops);
CREATE INDEX idx_jobs_description_trgm ON "jobs" USING gin (description gin_trgm_ops);

-- Partial composite indexes for the OPEN status hot path
-- Used for generic "newest first" sorting
CREATE INDEX idx_jobs_open_court_created
  ON "jobs" ("court_id", "created_at" DESC)
  WHERE status = 'OPEN';

-- Used for "highest fee" sorting (using salary_max)
CREATE INDEX idx_jobs_open_court_fee
  ON "jobs" ("court_id", "salary_max" DESC)
  WHERE status = 'OPEN';
  
-- Used for "nearest deadline" sorting (using expires_at)
CREATE INDEX idx_jobs_open_court_deadline
  ON "jobs" ("court_id", "expires_at" ASC)
  WHERE status = 'OPEN';

-- Backfill legacy jobs missing a task type
UPDATE "jobs" SET task_type = 'OTHER' WHERE task_type IS NULL;

