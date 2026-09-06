import { Request, Response, NextFunction } from 'express';
import { AuditLogsService } from './audit-logs.service';
import { paginationQuerySchema } from '../../common/schemas/pagination.schema';
import { z } from 'zod';

const getAuditLogsQuerySchema = paginationQuerySchema.extend({
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
});

export class AuditLogsController {
  static async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getAuditLogsQuerySchema.parse(req.query);
      const result = await AuditLogsService.list(query);
      res.json(result); // paginate() wraps in { success: true, data: ..., meta: ... }
    } catch (error) {
      next(error);
    }
  }
}
