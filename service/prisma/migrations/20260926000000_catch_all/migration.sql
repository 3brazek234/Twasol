-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'READ');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AccountMode" AS ENUM ('GIG', 'HIRING', 'BOTH');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('JOB', 'DIRECT_INQUIRY', 'SUPPORT');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "CourtType" AS ENUM ('PARTIAL', 'PRIMARY', 'APPEAL', 'CASSATION');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('NOT_REQUIRED', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MANUAL_BANK_TRANSFER', 'MANUAL_VODAFONE_CASH', 'MANUAL_CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('NEW_JOB', 'NEW_JOB_ALERT', 'JOB_INVITE', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'NEW_MESSAGE', 'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED', 'NEW_USER_SIGNUP', 'SUBSCRIPTION_PAYMENT_PENDING', 'SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_REJECTED', 'JOB_COMPLETED', 'JOB_CANCELLED', 'JOB_EXPIRED_WITHDRAWN', 'GOOGLE_ACCOUNT_LINKED');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "OfferStatus" ADD VALUE 'WITHDRAWN';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE "job_courts" DROP CONSTRAINT "job_courts_court_id_fkey";

-- DropForeignKey
ALTER TABLE "job_courts" DROP CONSTRAINT "job_courts_job_id_fkey";

-- DropForeignKey
ALTER TABLE "job_practice_areas" DROP CONSTRAINT "job_practice_areas_job_id_fkey";

-- DropForeignKey
ALTER TABLE "job_practice_areas" DROP CONSTRAINT "job_practice_areas_practice_area_id_fkey";

-- DropForeignKey
ALTER TABLE "user_practice_areas" DROP CONSTRAINT "user_practice_areas_practice_area_id_fkey";

-- DropForeignKey
ALTER TABLE "user_practice_areas" DROP CONSTRAINT "user_practice_areas_user_id_fkey";

-- DropIndex
DROP INDEX "idx_jobs_description_trgm";

-- DropIndex
DROP INDEX "idx_jobs_title_trgm";

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "assigned_admin_id" TEXT,
ADD COLUMN     "support_status" "SupportStatus",
ADD COLUMN     "type" "ConversationType" NOT NULL DEFAULT 'JOB',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "job_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "courts" DROP COLUMN "city_ar",
DROP COLUMN "city_en",
DROP COLUMN "country",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "state",
ADD COLUMN     "governorate_id" TEXT,
ADD COLUMN     "parent_court_id" TEXT,
ADD COLUMN     "type" "CourtType" NOT NULL,
ALTER COLUMN "name_ar" DROP DEFAULT;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "agreed_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "completed_at" TIMESTAMP(3),
ALTER COLUMN "currency" SET DEFAULT 'EGP';

-- AlterTable
ALTER TABLE "lawyer_courts" ADD COLUMN     "can_activate" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "attachment_name" TEXT,
ADD COLUMN     "attachment_size" INTEGER,
ADD COLUMN     "attachment_type" "AttachmentType",
ADD COLUMN     "attachment_url" TEXT,
ADD COLUMN     "reply_to_id" TEXT,
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'SENT';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "account_mode" "AccountMode" NOT NULL DEFAULT 'BOTH',
ADD COLUMN     "bar_id" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "can_activate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "governorate_id" TEXT,
ADD COLUMN     "push_tokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "subscription_expires_at" TIMESTAMP(3),
ADD COLUMN     "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT';

-- DropTable
DROP TABLE "job_courts";

-- DropTable
DROP TABLE "job_practice_areas";

-- DropTable
DROP TABLE "practice_areas";

-- DropTable
DROP TABLE "user_practice_areas";

-- CreateTable
CREATE TABLE "governorates" (
    "id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,

    CONSTRAINT "governorates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reported_user_id" TEXT,
    "reported_job_id" TEXT,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_piasters" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "payment_method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "duration_months" INTEGER NOT NULL DEFAULT 12,
    "receipt_file_key" TEXT,
    "sender_number" TEXT,
    "processed_at" TIMESTAMP(3),
    "processed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_reporter_id_idx" ON "reports"("reporter_id");

-- CreateIndex
CREATE INDEX "subscription_payments_user_id_status_idx" ON "subscription_payments"("user_id", "status");

-- CreateIndex
CREATE INDEX "subscription_payments_status_idx" ON "subscription_payments"("status");

-- CreateIndex
CREATE INDEX "jobs_court_id_idx" ON "jobs"("court_id");

-- CreateIndex
CREATE INDEX "saved_searches_user_id_idx" ON "saved_searches"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_bar_number_key" ON "users"("bar_number");

-- AddForeignKey
ALTER TABLE "courts" ADD CONSTRAINT "courts_governorate_id_fkey" FOREIGN KEY ("governorate_id") REFERENCES "governorates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courts" ADD CONSTRAINT "courts_parent_court_id_fkey" FOREIGN KEY ("parent_court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_governorate_id_fkey" FOREIGN KEY ("governorate_id") REFERENCES "governorates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_job_id_fkey" FOREIGN KEY ("reported_job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

