import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { paginate, paginationQuerySchema } from '../../common/schemas/pagination.schema';
import { z } from 'zod';
import { AppError } from '../../common/errors/AppError';

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
      const { page, limit, status } = listReportsQuerySchema.parse(req.query);

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [total, reports] = await Promise.all([
        prisma.report.count({ where }),
        prisma.report.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: { select: { id: true, fullName: true, email: true } },
            reportedUser: { select: { id: true, fullName: true, email: true } },
            reportedJob: { select: { id: true, title: true } },
          },
        }),
      ]);

      res.json(paginate(reports, total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, resolutionNotes } = updateReportStatusSchema.parse(req.body);
      const report = await prisma.report.update({
        where: { id: req.params.id },
        data: { status, resolutionNotes },
      });
      res.json(report);
    } catch (error) {
      if ((error as any).code === 'P2025') {
        next(AppError.notFound('Report'));
      } else {
        next(error);
      }
    }
  }
}
