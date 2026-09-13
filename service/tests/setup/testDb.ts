import { prisma } from "../../src/prisma";

export async function resetTestDb() {
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.message.deleteMany(),
    prisma.application.deleteMany(),
    prisma.job.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
