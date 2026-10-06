import { execSync } from 'child_process';
import 'dotenv/config';

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  'postgresql://testuser:testpassword@localhost:5433/job_test_db?schema=public';

if (new URL(testDatabaseUrl).pathname !== '/job_test_db') {
  throw new Error('Integration tests require a dedicated database named job_test_db');
}

process.env.DATABASE_URL = testDatabaseUrl;

beforeAll(async () => {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
});

afterAll(async () => {
  const { prisma } = await import('../src/prisma');
  await prisma.$disconnect();
});
