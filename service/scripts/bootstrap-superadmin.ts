import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/common/utils/password';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  let password = args[1];

  if (!email) {
    console.error('Usage: npx tsx scripts/bootstrap-superadmin.ts <email> [password]');
    process.exit(1);
  }

  if (!password) {
    console.log('No password provided. A temporary one will be generated.');
    password = Math.random().toString(36).slice(-10) + 'A1!'; // Basic complex password
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log(`User ${email} found. Elevating to SUPER_ADMIN...`);
    await prisma.user.update({
      where: { email },
      data: { role: 'SUPER_ADMIN' }
    });
    console.log('Successfully elevated user to SUPER_ADMIN.');
  } else {
    console.log(`Creating new SUPER_ADMIN user: ${email}...`);
    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: 'Super Admin',
        role: 'SUPER_ADMIN',
        verificationStatus: 'APPROVED',
        accountMode: 'BOTH'
      }
    });
    console.log('Successfully created new SUPER_ADMIN.');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Please change this password immediately after logging in.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
