import { PrismaClient } from '@prisma/client';
import { AuthService } from './service/src/modules/auth/auth.service';

const prisma = new PrismaClient();

async function runTest() {
  const email = `test-${Date.now()}@example.com`;
  
  console.log(`Registering user ${email}...`);
  const result = await AuthService.register({
    email,
    password: 'password123!',
    fullName: 'Test User',
    barNumber: `TEST-${Date.now()}`
  });

  console.log('Registration complete. Checking DB for notifications...');

  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
  });

  const notifications = await prisma.notification.findMany({
    where: {
      type: 'NEW_USER_SIGNUP',
      userId: { in: admins.map(a => a.id) }
    },
    orderBy: { createdAt: 'desc' },
    take: admins.length
  });

  console.log(`Found ${admins.length} admins.`);
  console.log(`Found ${notifications.length} recent NEW_USER_SIGNUP notifications.`);
  console.log(notifications);
}

runTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
