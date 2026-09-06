import { prisma } from '../../prisma';
import { paginate } from '../../common/schemas/pagination.schema';

export interface ListAuditLogsOptions {
  page: number;
  limit: number;
  entityType?: string;
  entityId?: string;
  actorId?: string;
}

export class AuditLogsService {
  static async list(options: ListAuditLogsOptions) {
    const { page, limit, entityType, entityId, actorId } = options;
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (actorId) where.actorId = actorId;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }
}
