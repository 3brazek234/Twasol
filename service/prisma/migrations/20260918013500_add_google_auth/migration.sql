-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'GOOGLE_ACCOUNT_LINKED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "google_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

