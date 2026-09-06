import { prisma } from '../../prisma';
import { paginate } from '../../common/schemas/pagination.schema';
import { AppError } from '../../common/errors/AppError';

export interface ListReportsOptions {
  page: number;
  limit: number;
  status?: string;
}

export interface UpdateReportStatusOptions {
  id: string;
  status: 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  resolutionNotes?: string;
}

export class AdminReportsService {
  static async list(options: ListReportsOptions) {
    const { page, limit, status } = options;
    const where: any = {};
    if (status) where.status = status;

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

    return paginate(reports, total, page, limit);
  }

  static async updateStatus(options: UpdateReportStatusOptions) {
    const { id, status, resolutionNotes } = options;
    try {
      return await prisma.report.update({
        where: { id },
        data: { status, resolutionNotes },
      });
    } catch (err: any) {
      if (err.code === 'P2025') throw AppError.notFound('Report');
      throw err;
    }
  }
}
