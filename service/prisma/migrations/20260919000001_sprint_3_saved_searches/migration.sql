-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'NEW_JOB_ALERT';

-- CreateIndex
CREATE INDEX "saved_searches_court_id_task_type_idx" ON "saved_searches"("court_id", "task_type");

