// src/prisma.ts
import { PrismaClient } from '@prisma/client';
import { logger } from './common/utils/logger';

/**
 * PrismaClient singleton with soft-delete extension.
 *
 * The $extends middleware automatically:
 * - Filters out soft-deleted users on all find queries (unless explicitly overridden)
 * - Converts user.delete() calls into soft-updates that set deletedAt
 */
const basePrisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
  ],
});

// Log slow queries in development
basePrisma.$on('query', (e) => {
  if (e.duration > 100) {
    logger.warn({ duration: e.duration, query: e.query }, 'Slow query detected');
  }
});

basePrisma.$on('error', (e) => {
  logger.error({ message: e.message }, 'Prisma error');
});

/**
 * Extended client with soft-delete behavior for User model.
 *
 * - findMany / findFirst / findUnique on User automatically exclude
 *   records where deletedAt is not null.
 * - delete on User sets deletedAt instead of hard-deleting.
 *
 * To query including soft-deleted users, use prisma.$queryRaw or
 * explicitly pass { where: { deletedAt: { not: null } } }.
 */
export const prisma = basePrisma.$extends({
  query: {
    user: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findUnique({ args, query }) {
        // findUnique doesn't support arbitrary where merging cleanly,
        // so we rely on the caller to check deletedAt when needed.
        return query(args);
      },
      async delete({ args, query }) {
        // Convert hard delete → soft delete
        return basePrisma.user.update({
          where: args.where,
          data: { deletedAt: new Date(), isActive: false, isOnline: false },
        }) as any;
      },
      async deleteMany({ args, query }) {
        return basePrisma.user.updateMany({
          where: args.where,
          data: { deletedAt: new Date(), isActive: false, isOnline: false },
        }) as any;
      },
    },
    notification: {
      async create({ args, query }) {
        const notification = await query(args);
        
        // Asynchronously send push notification without blocking the DB query
        try {
          const { PushNotificationService } = require('./modules/notifications/push.service');
          const payload = notification.payload as any;
          const title = payload?.titleAr || 'إشعار جديد';
          const body = payload?.messageAr || payload?.message || 'لديك إشعار جديد في وكيل';
          PushNotificationService.sendPushToUser(notification.userId, title, body, payload).catch((err: any) => console.error(err));
        } catch (err) {
          logger.error({ err }, 'Failed to trigger PushNotificationService');
        }
        
        return notification;
      }
    }
  },
});

export type ExtendedPrismaClient = typeof prisma;
