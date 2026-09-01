CREATE TABLE "conflict_declarations" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "lawyer_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "declared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conflict_declarations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conflict_declarations_job_id_lawyer_id_key" ON "conflict_declarations"("job_id", "lawyer_id");

ALTER TABLE "conflict_declarations" ADD CONSTRAINT "conflict_declarations_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conflict_declarations" ADD CONSTRAINT "conflict_declarations_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
