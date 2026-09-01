import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { paginate, paginationQuerySchema } from '../../common/schemas/pagination.schema';
import { z } from 'zod';

const listJobsAdminQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['OPEN', 'NEGOTIATING', 'AGREED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED']).optional(),
  search: z.string().optional(),
});

export class AdminJobsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, search } = listJobsAdminQuerySchema.parse(req.query);

      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [total, jobs] = await Promise.all([
        prisma.job.count({ where }),
        prisma.job.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            postedBy: { select: { id: true, fullName: true, email: true } },
            assignedLawyer: { select: { id: true, fullName: true, email: true } },
          },
        }),
      ]);

      res.json(paginate(jobs, total, page, limit));
    } catch (error) {
      next(error);
    }
  }
}
