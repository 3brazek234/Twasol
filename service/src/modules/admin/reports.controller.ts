import { Request, Response, NextFunction } from 'express';
import { AdminReportsService } from './admin-reports.service';
import { paginationQuerySchema } from '../../common/schemas/pagination.schema';
import { z } from 'zod';

const listReportsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']).optional(),
});

const updateReportStatusSchema = z.object({
  status: z.enum(['INVESTIGATING', 'RESOLVED', 'DISMISSED']),
  resolutionNotes: z.string().optional(),
});

export class AdminReportsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listReportsQuerySchema.parse(req.query);
      const result = await AdminReportsService.list(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, resolutionNotes } = updateReportStatusSchema.parse(req.body);
      const report = await AdminReportsService.updateStatus({ id: req.params.id, status, resolutionNotes });
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }
}
