import { Request, Response, NextFunction } from 'express';
import { AdminJobsService } from './admin-jobs.service';
import { paginationQuerySchema } from '../../common/schemas/pagination.schema';
import { z } from 'zod';

const listJobsAdminQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['OPEN', 'NEGOTIATING', 'AGREED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED']).optional(),
  search: z.string().optional(),
});

export class AdminJobsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listJobsAdminQuerySchema.parse(req.query);
      const result = await AdminJobsService.list(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
