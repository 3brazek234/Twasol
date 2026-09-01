import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';

export class AnalyticsController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [
        totalUsers,
        activeLast30d,
        pendingVerifications,
        postedLast7d,
        completedLast7d,
      ] = await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.count({ 
          where: { 
            deletedAt: null,
            updatedAt: { gte: thirtyDaysAgo } // simple proxy for activity
          } 
        }),
        prisma.verificationDocument.count({
          where: { status: 'PENDING' }
        }),
        prisma.job.count({
          where: { createdAt: { gte: sevenDaysAgo } }
        }),
        prisma.job.count({
          where: { 
            status: 'COMPLETED',
            updatedAt: { gte: sevenDaysAgo }
          }
        })
      ]);

      // Reports are mocked since the Report model doesn't exist yet
      const openReports = 0;

      res.json({
        users: {
          total: totalUsers,
          activeLast30d,
        },
        verifications: {
          pending: pendingVerifications,
        },
        jobs: {
          postedLast7d,
          completedLast7d,
        },
        reports: {
          open: openReports,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBadges(req: Request, res: Response, next: NextFunction) {
    try {
      const [pendingVerifications, openReports, unresolvedSupport, pendingSubscriptions] = await Promise.all([
        prisma.verificationDocument.count({
          where: { status: 'PENDING' }
        }),
        prisma.report.count({
          where: { status: 'OPEN' }
        }),
        prisma.conversation.count({
          where: { type: 'SUPPORT', supportStatus: 'OPEN' }
        }),
        prisma.subscriptionPayment.count({
          where: { status: 'PENDING' }
        }),
      ]);

      res.json({
        verification:   pendingVerifications,
        reports:        openReports,
        support:        unresolvedSupport,
        subscriptions:  pendingSubscriptions,  // طلبات اشتراك تنتظر المراجعة
      });
    } catch (error) {
      next(error);
    }
  }
}
