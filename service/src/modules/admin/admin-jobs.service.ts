import { prisma } from '../../prisma';
import { paginate } from '../../common/schemas/pagination.schema';

export interface ListAdminJobsOptions {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

export class AdminJobsService {
  static async list(options: ListAdminJobsOptions) {
    const { page, limit, status, search } = options;
    const where: any = {};
    if (status) where.status = status;
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

    return paginate(jobs, total, page, limit);
  }
}
