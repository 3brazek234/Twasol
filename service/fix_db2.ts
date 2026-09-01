import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "jobs" ALTER COLUMN "search_vector" DROP DEFAULT;`); // wait actually what is the generation?
}
main().catch(console.error).finally(() => prisma.$disconnect());
