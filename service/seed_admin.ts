import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tawasol.com' },
    update: {
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      verificationStatus: 'APPROVED'
    },
    create: {
      email: 'admin@tawasol.com',
      passwordHash,
      fullName: 'System Admin',
      role: 'ADMIN',
      isActive: true,
      verificationStatus: 'APPROVED'
    }
  });

  console.log('Admin account ready:', admin.email, 'password123');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
