import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "jobs" ALTER COLUMN "search_vector" ADD GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || description)) STORED;`);
  console.log("Added expression");
}
main().catch(console.error).finally(() => prisma.$disconnect());
