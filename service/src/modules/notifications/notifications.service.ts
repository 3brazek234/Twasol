import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { NotificationType } from '@prisma/client';

export class NotificationsService {
  static async create(userId: string, type: NotificationType, payload: any) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        payload
      }
    });
  }

  static async createMany(userIds: string[], type: NotificationType, payload: any) {
    const data = userIds.map(userId => ({
      userId,
      type,
      payload
    }));
    return prisma.notification.createMany({
      data
    });
  }

  static async list(userId: string, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where: { userId } })
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== userId) {
      throw AppError.notFound('Notification');
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  }
}
