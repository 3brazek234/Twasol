import { prisma } from '../../prisma';

export class AnalyticsService {
  static async getOverview() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalUsers, activeLast30d, pendingVerifications, postedLast7d, completedLast7d] =
      await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { deletedAt: null, updatedAt: { gte: thirtyDaysAgo } } }),
        prisma.verificationDocument.count({ where: { status: 'PENDING' } }),
        prisma.job.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.job.count({ where: { status: 'COMPLETED', updatedAt: { gte: sevenDaysAgo } } }),
      ]);

    return {
      users: { total: totalUsers, activeLast30d },
      verifications: { pending: pendingVerifications },
      jobs: { postedLast7d, completedLast7d },
      reports: { open: 0 },
    };
  }

  static async getBadges() {
    const [pendingVerifications, openReports, unresolvedSupport, pendingSubscriptions] =
      await Promise.all([
        prisma.verificationDocument.count({ where: { status: 'PENDING' } }),
        prisma.report.count({ where: { status: 'OPEN' } }),
        prisma.conversation.count({ where: { type: 'SUPPORT', supportStatus: 'OPEN' } }),
        prisma.subscriptionPayment.count({ where: { status: 'PENDING' } }),
      ]);

    return {
      verification: pendingVerifications,
      reports: openReports,
      support: unresolvedSupport,
      subscriptions: pendingSubscriptions,
    };
  }
}
