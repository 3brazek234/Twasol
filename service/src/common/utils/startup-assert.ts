import { prisma } from '../../prisma';

export const REQUIRED_MIGRATION = '20261107000001_seed_suspended_at';

/**
 * Startup safety assertion:
 * Verifies that `users.suspended_at` exists and the `20261107000001_seed_suspended_at`
 * migration has finished in `_prisma_migrations` before accepting HTTP traffic.
 * Note: This checks schema/migration application status only; it does not validate
 * the data output of the seed query.
 */
export async function assertDatabaseSchemaReady() {
  const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'suspended_at'
  `;

  if (columns.length === 0) {
    throw new Error(
      'Database schema check failed: column "users.suspended_at" is missing. Ensure "npm run prisma:migrate:prod" ran before startup.',
    );
  }

  const migrations = await prisma.$queryRaw<
    Array<{ migration_name: string; finished_at: Date | null }>
  >`
    SELECT migration_name, finished_at
    FROM _prisma_migrations
    WHERE migration_name = ${REQUIRED_MIGRATION}
      AND finished_at IS NOT NULL
      AND rolled_back_at IS NULL
  `;

  if (migrations.length === 0) {
    throw new Error(
      `Database migration check failed: required migration "${REQUIRED_MIGRATION}" has not finished in _prisma_migrations. Ensure Railway's Pre-Deploy Command is set to "npm run prisma:migrate:prod".`,
    );
  }
}
