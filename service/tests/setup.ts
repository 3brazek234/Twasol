import { execSync } from 'child_process';
import { prisma } from '../src/prisma';

beforeAll(async () => {
  // Use a specific test DB url to ensure we don't drop dev
  // In CI or docker-compose, this should be mapped to the test DB
  if (!process.env.DATABASE_URL?.includes('job_test_db')) {
    process.env.DATABASE_URL = 'postgresql://testuser:testpassword@localhost:5433/job_test_db?schema=public';
  }

  try {
    // Run migrations before tests
    execSync('npx prisma migrate deploy', { stdio: 'ignore' });
  } catch (error) {
    console.error('Failed to run migrations', error);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
