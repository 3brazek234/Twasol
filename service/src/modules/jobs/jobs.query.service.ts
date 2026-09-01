import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { Prisma } from '@prisma/client';
import { paginate } from '../../common/schemas/pagination.schema';

export class JobsQueryService {
  static async list({
    page,
    limit,
    status,
    courtId,
    search,
  }: {
    page: number;
    limit: number;
    status?: string;
    courtId?: string;
    search?: string;
  }) {
    const where: Prisma.JobWhereInput = {
      // By default, only list OPEN jobs for public feed unless filtering
      ...(status ? { status: status as any } : { status: "OPEN" }),
    };

    if (courtId) {
      where.courtId = courtId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          court: true,
        },
      }),
      prisma.job.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  static async getById(id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        court: true,
        applications: true,
      },
    });
    if (!job) throw AppError.notFound("Job");
    return job;
  }

  static async getMyJobs(userId: string) {
    const [posted, assigned] = await Promise.all([
      prisma.job.findMany({ where: { postedByUserId: userId } }),
      prisma.job.findMany({
        where: {
          applications: {
            some: {
              lawyerId: userId,
              status: "ACCEPTED",
            },
          },
        },
      }),
    ]);
    return { posted, assigned };
  }

  static async getJobsByLawyerId(lawyerId: string) {
    const jobs = await prisma.job.findMany({ where: { applications: { some: { lawyerId } } } });
    return jobs;
  }
}
