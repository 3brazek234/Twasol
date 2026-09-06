import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { NotificationType } from '@prisma/client';
import { NotificationPayload, buildNotification } from './notification-payload';
import { PushNotificationService } from './push.service';

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

  static async notifyManyUsers(userIds: string[], payload: Omit<NotificationPayload, 'userId'>) {
    if (userIds.length === 0) return;

    // Bulk insert for DB history — fast, single query
    await prisma.notification.createMany({
      data: userIds.map(userId => buildNotification({ ...payload, userId })),
    });

    // Explicitly trigger push for each recipient
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, pushTokens: true },
    });

    const tokens = users
      .flatMap(u => u.pushTokens || [])
      .filter((t): t is string => Boolean(t));

    if (tokens.length > 0) {
      await PushNotificationService.sendPushToTokens(
        tokens,
        payload.titleAr,
        payload.messageAr,
        payload.data ?? {}
      );
    }
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
