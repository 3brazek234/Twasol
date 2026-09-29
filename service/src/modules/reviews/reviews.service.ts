import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { paginate } from '../../common/schemas/pagination.schema';

export class ReviewsService {
  static async create(jobId: string, reviewerId: string, data: { rating: number; comment?: string }) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw AppError.notFound('Job');
    }

    if (job.status !== 'COMPLETED') {
      throw AppError.badRequest('Job must be completed to leave a review');
    }

    if (job.postedByUserId !== reviewerId && job.assignedLawyerId !== reviewerId) {
      throw AppError.forbidden('Only job participants can leave a review');
    }

    const revieweeId = reviewerId === job.postedByUserId ? job.assignedLawyerId : job.postedByUserId;

    if (!revieweeId) {
      throw AppError.badRequest('No valid reviewee found for this job');
    }

    // Check for existing review — handle gracefully with a 409, not a raw Prisma constraint error
    const existingReview = await prisma.review.findUnique({
      where: { jobId_reviewerId: { jobId, reviewerId } }
    });

    if (existingReview) {
      throw AppError.conflict('لقد قمت بتقييم هذه المهمة مسبقاً');
    }

    try {
      const review = await prisma.review.create({
        data: {
          jobId,
          reviewerId,
          revieweeId,
          rating: data.rating,
          comment: data.comment
        },
        include: {
          job: { select: { title: true } },
          reviewer: { select: { fullName: true } },
          reviewee: { select: { fullName: true } }
        }
      });

      return review;
    } catch (err: any) {
      // Catch race-condition duplicate (P2002 = unique constraint violation)
      if (err?.code === 'P2002') {
        throw AppError.conflict('لقد قمت بتقييم هذه المهمة مسبقاً');
      }
      throw err;
    }
  }

  static async getUserReviews(userId: string, { page, limit }: { page: number; limit: number }) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: userId },
        skip,
        take: limit,
        include: {
          job: { select: { id: true, title: true } },
          reviewer: { select: { id: true, fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.review.count({ where: { revieweeId: userId } })
    ]);

    return paginate(reviews, total, page, limit);
  }

  static async getUserStats(userId: string) {
    const agg = await prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: { rating: true }
    });

    const jobStats = await prisma.job.groupBy({
      by: ['status'],
      where: {
        assignedLawyerId: userId,
        status: { in: ['COMPLETED', 'EXPIRED'] }
      },
      _count: true
    });

    let completedJobs = 0;
    let totalResolvedJobs = 0;

    for (const stat of jobStats) {
      totalResolvedJobs += stat._count;
      if (stat.status === 'COMPLETED') {
        completedJobs = stat._count;
      }
    }

    const completionRate = totalResolvedJobs > 0 
      ? (completedJobs / totalResolvedJobs) * 100 
      : null;

    return {
      averageRating: agg._avg.rating,
      reviewCount: agg._count.rating,
      completionRate
    };
  }
}
