import { prisma } from '../src/prisma';

export async function truncateDb() {
  const [{ database }] = await prisma.$queryRaw<Array<{ database: string }>>`
    SELECT current_database() AS database
  `;

  if (database !== 'job_test_db') {
    throw new Error(`Refusing to truncate non-test database "${database}"`);
  }

  const tableNames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tableNames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  }
}
