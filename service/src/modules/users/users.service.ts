import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { getCached } from '../../common/utils/cache';
import { SAFE_USER_SELECT } from './user-safe-fields';

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
      select: SAFE_USER_SELECT,
    });
  }

  static async updateAccountMode(userId: string, mode: any) {
    const { invalidateCachePrefix } = await import('../../common/utils/cache');
    await invalidateCachePrefix(`user:profile:${userId}`);
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    let extraUpdates = {};

    if (user) {
      if (mode !== 'HIRING' && user.subscriptionStatus === 'NOT_REQUIRED') {
        // Upgrading to GIG or BOTH: must now pay subscription
        extraUpdates = {
          subscriptionStatus: 'PENDING_PAYMENT',
          isActive: false,
        };
      } else if (mode === 'HIRING' && user.verificationStatus === 'APPROVED' && user.subscriptionStatus !== 'NOT_REQUIRED') {
        // Switching TO HIRING: instantly grant active status since they don't need to pay
        extraUpdates = {
          subscriptionStatus: 'NOT_REQUIRED',
          isActive: true,
        };
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: { accountMode: mode, ...extraUpdates },
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
