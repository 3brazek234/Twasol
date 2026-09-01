import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { paginate } from '../../common/schemas/pagination.schema';
import { ReviewsService } from '../reviews/reviews.service';
import { JobsService } from '../jobs/jobs.service';

export class LawyersService {
  static async search({
    courtId,
    minRating,
    q,
    page,
    pageSize
  }: {
    courtId?: string;
    minRating?: number;
    q?: string;
    page: number;
    pageSize: number;
  }) {
    const where: any = {
      role: 'LAWYER',
      verificationStatus: 'APPROVED'
    };

    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (courtId) {
      where.courts = { some: { courtId } };
    }


    const skip = (page - 1) * pageSize;

    const [lawyers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        select: {
          id: true,
          fullName: true,
          barNumber: true,
          isOnline: true,
          courts: { include: { court: true } },
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    const lawyersWithStats = await Promise.all(
      lawyers.map(async (lawyer) => {
        const stats = await ReviewsService.getUserStats(lawyer.id);
        return {
          ...lawyer,
          ...stats
        };
      })
    );

    // Filter by minRating if provided (done in-memory since Prisma aggregate filtering is complex)
    let filteredLawyers = lawyersWithStats;
    if (minRating) {
      filteredLawyers = filteredLawyers.filter(l => l.averageRating && l.averageRating >= minRating);
    }

    return paginate(filteredLawyers, total, page, pageSize);
  }

  static async getProfile(id: string) {
    const lawyer = await prisma.user.findFirst({
      where: {
        id,
        role: 'LAWYER',
        verificationStatus: 'APPROVED'
      },
      select: {
        id: true,
        fullName: true,
        barNumber: true,
        isOnline: true,
        bio: true,
        courts: { include: { court: true } },
        createdAt: true
      }
    });

    if (!lawyer) {
      throw AppError.notFound('Lawyer');
    }

    const stats = await ReviewsService.getUserStats(id);
    const jobs = await JobsService.getJobsByLawyerId(id);
    return {
      ...lawyer,
      ...stats,
      jobs: jobs.map(job => ({
        id: job.id,
        title: job.title,
        status: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }))
    };
  }
}
