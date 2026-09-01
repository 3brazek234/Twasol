import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { paginate, paginationQuerySchema } from '../../common/schemas/pagination.schema';
import { z } from 'zod';

const getAuditLogsQuerySchema = paginationQuerySchema.extend({
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
});

export class AuditLogsController {
  static async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, entityType, entityId, actorId } = getAuditLogsQuerySchema.parse(req.query);

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

      res.json(paginate(items, total, page, limit));
    } catch (error) {
      next(error);
    }
  }
}
