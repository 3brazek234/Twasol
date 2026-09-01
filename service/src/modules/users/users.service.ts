import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { getCached } from '../../common/utils/cache';

export class UsersService {
  static async getProfile(userId: string) {
    const cacheKey = `user:profile:${userId}`;
    return getCached(cacheKey, async () => {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          deletedAt: null
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          barNumber: true,
          isActive: true,
          isOnline: true,
          verificationStatus: true,
          bio: true,
          courts: { include: { court: true } },
          governorate: true,
          createdAt: true
        }
      });

      if (!user) {
        throw AppError.notFound('User');
      }

      const agg = await prisma.review.aggregate({
        where: { revieweeId: userId },
        _avg: { rating: true },
        _count: { rating: true }
      });

      return {
        ...user,
        averageRating: agg._avg.rating,
        reviewCount: agg._count.rating
      };
    }, 300); // 5 mins
  }

  static async updateProfile(userId: string, data: any) {
    const { invalidateCachePrefix } = await import('../../common/utils/cache');
    await invalidateCachePrefix(`user:profile:${userId}`);
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  static async updateAccountMode(userId: string, mode: any) {
    const { invalidateCachePrefix } = await import('../../common/utils/cache');
    await invalidateCachePrefix(`user:profile:${userId}`);
    return prisma.user.update({
      where: { id: userId },
      data: { accountMode: mode },
      select: { id: true, accountMode: true }
    });
  }

  static async savePushToken(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    
    if (!user.pushTokens.includes(token)) {
      await prisma.user.update({
        where: { id: userId },
        data: { pushTokens: { push: token } }
      });
    }
  }
}
