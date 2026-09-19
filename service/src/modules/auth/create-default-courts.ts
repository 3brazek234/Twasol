import { prisma } from '../../prisma';

/**
 * Creates default court mappings for a user based on their governorate.
 * Shared by both email/password registration and Google profile completion.
 *
 * Maps the user to:
 *  - All Partial/Primary courts in their governorate
 *  - The mapped Appeal court (via appealCourtMapping)
 */
export async function createDefaultCourts(userId: string, governorateId: string): Promise<void> {
  const { appealCourtMapping } = require('../jobs/appealCourtsMap');

  const gov = await prisma.governorate.findUnique({ where: { id: governorateId } });
  if (!gov) return;

  const courtIds: string[] = [];

  // Add all Partial/Primary courts in this governorate
  const localCourts = await prisma.court.findMany({
    where: { governorateId: gov.id, type: { in: ['PRIMARY', 'PARTIAL'] } },
    select: { id: true },
  });
  courtIds.push(...localCourts.map(c => c.id));

  // Add mapped Appeal court
  const appealName = appealCourtMapping[gov.nameEn];
  if (appealName) {
    const appealCourt = await prisma.court.findFirst({
      where: { nameEn: appealName, type: 'APPEAL' },
      select: { id: true },
    });
    if (appealCourt) {
      courtIds.push(appealCourt.id);
    }
  }

  if (courtIds.length > 0) {
    await prisma.lawyerCourt.createMany({
      data: courtIds.map(courtId => ({
        userId,
        courtId,
        isActive: true,
      })),
      skipDuplicates: true,
    });
  }
}
