ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'JOB_INVITE';
ALTER TABLE "jobs" ADD COLUMN "invited_lawyer_id" TEXT;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_invited_lawyer_id_fkey" FOREIGN KEY ("invited_lawyer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
