-- CreateIndex
CREATE INDEX "jobs_status_court_id_idx" ON "jobs"("status", "court_id");

-- CreateIndex
CREATE INDEX "jobs_task_type_idx" ON "jobs"("task_type");

-- CreateIndex
CREATE INDEX "users_verification_status_idx" ON "users"("verification_status");

