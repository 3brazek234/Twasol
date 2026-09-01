import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma';
import { env } from '../../env';

export async function auditLog(
  tx: Prisma.TransactionClient,
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  before: any = null,
  after: any = null,
  metadata: any = null
) {
  // We use the provided transaction client to ensure the audit log is committed atomically
  // with the state change it is recording.
  await tx.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      before: before ? (before as any) : Prisma.JsonNull,
      after: after ? (after as any) : Prisma.JsonNull,
      metadata: metadata ? (metadata as any) : Prisma.JsonNull,
    }
  });
}
