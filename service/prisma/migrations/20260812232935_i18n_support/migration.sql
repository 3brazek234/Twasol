/*
  Warnings:

  - You are about to drop the column `city` on the `courts` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `courts` table. All the data in the column will be lost.
  - You are about to drop the column `file_url` on the `verification_documents` table. All the data in the column will be lost.
  - Added the required column `city_en` to the `courts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name_en` to the `courts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_key` to the `verification_documents` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('EN', 'AR');


-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'JOB_INVITE';


-- AlterEnum
ALTER TYPE "VerificationStatus" ADD VALUE 'PENDING_UPLOAD';




-- DropIndex
DROP INDEX "jobs_search_idx";

-- AlterTable
ALTER TABLE "courts" RENAME COLUMN "city" TO "city_en";
ALTER TABLE "courts" RENAME COLUMN "name" TO "name_en";
ALTER TABLE "courts" ADD COLUMN "city_ar" TEXT NOT NULL DEFAULT '';
ALTER TABLE "courts" ADD COLUMN "name_ar" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "content_locale" "Locale",
ADD COLUMN     "invited_lawyer_id" TEXT;
ALTER TABLE "jobs" ALTER COLUMN "search_vector" DROP EXPRESSION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferred_locale" "Locale" NOT NULL DEFAULT 'EN';

-- AlterTable
ALTER TABLE "verification_documents" DROP COLUMN "file_url",
ADD COLUMN     "file_key" TEXT NOT NULL;



ALTER TABLE "verification_documents" ALTER COLUMN "status" SET DEFAULT 'PENDING_UPLOAD';



-- CreateTable
CREATE TABLE "practice_areas" (
    "id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_practice_areas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "practice_area_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_practice_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_practice_areas" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "practice_area_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_practice_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conflict_declarations" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "lawyer_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "declared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conflict_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "practice_areas_name_en_key" ON "practice_areas"("name_en");

-- CreateIndex
CREATE INDEX "user_practice_areas_practice_area_id_idx" ON "user_practice_areas"("practice_area_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_practice_areas_user_id_practice_area_id_key" ON "user_practice_areas"("user_id", "practice_area_id");

-- CreateIndex
CREATE INDEX "job_practice_areas_practice_area_id_idx" ON "job_practice_areas"("practice_area_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_practice_areas_job_id_practice_area_id_key" ON "job_practice_areas"("job_id", "practice_area_id");

-- CreateIndex
CREATE UNIQUE INDEX "conflict_declarations_job_id_lawyer_id_key" ON "conflict_declarations"("job_id", "lawyer_id");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_invited_lawyer_id_fkey" FOREIGN KEY ("invited_lawyer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_practice_areas" ADD CONSTRAINT "user_practice_areas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_practice_areas" ADD CONSTRAINT "user_practice_areas_practice_area_id_fkey" FOREIGN KEY ("practice_area_id") REFERENCES "practice_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_practice_areas" ADD CONSTRAINT "job_practice_areas_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_practice_areas" ADD CONSTRAINT "job_practice_areas_practice_area_id_fkey" FOREIGN KEY ("practice_area_id") REFERENCES "practice_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_declarations" ADD CONSTRAINT "conflict_declarations_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_declarations" ADD CONSTRAINT "conflict_declarations_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
