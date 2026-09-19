import { prisma } from '../../prisma';
import { getCached } from '../../common/utils/cache';

export class AnalyticsService {
  static async getUserFunnel() {
    const [totalUsers, verifiedUsers, activeSubscriptions] = await Promise.all([
      prisma.user.count({ where: { role: 'LAWYER', deletedAt: null } }),
      prisma.user.count({ where: { role: 'LAWYER', verificationStatus: 'APPROVED', deletedAt: null } }),
      prisma.user.count({ where: { role: 'LAWYER', subscriptionStatus: 'ACTIVE', deletedAt: null } }),
    ]);

    return {
      totalRegistered: totalUsers,
      totalVerified: verifiedUsers,
      totalActiveSubscriptions: activeSubscriptions,
      verificationRate: totalUsers > 0 ? verifiedUsers / totalUsers : 0,
      subscriptionRate: verifiedUsers > 0 ? activeSubscriptions / verifiedUsers : 0,
    };
  }

  static async getRevenueMetrics() {
    // Calculates normalized Monthly Recurring Revenue (MRR)
    // using only the most recent successful payment of currently ACTIVE users.
    const activeUsers = await prisma.user.findMany({
      where: { 
        subscriptionStatus: 'ACTIVE', 
        subscriptionExpiresAt: { gt: new Date() } 
      },
      select: {
        subscriptionPayments: {
          where: { status: 'SUCCESS' },
          orderBy: { processedAt: 'desc' },
          take: 1,
          select: { amountPiasters: true, durationMonths: true }
        }
      }
    });

    let mrr = 0;
    for (const u of activeUsers) {
      if (u.subscriptionPayments.length > 0) {
        const p = u.subscriptionPayments[0];
        mrr += (p.amountPiasters / Math.max(1, p.durationMonths));
      }
    }

    return { mrr };
  }

  static async getFillRate(windowDays: number = 30) {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - windowDays);

    const [completedCount, otherTerminalCount] = await Promise.all([
      prisma.job.count({
        where: { completedAt: { gte: windowStart } }
      }),
      prisma.job.count({
        where: { 
          OR: [
            { expiredAt: { gte: windowStart } },
            { cancelledAt: { gte: windowStart } }
          ]
        }
      })
    ]);

    const terminalCount = completedCount + otherTerminalCount;
    const fillRate = terminalCount > 0 ? completedCount / terminalCount : 0;

    return { completedCount, terminalCount, fillRate, windowDays };
  }

  static async getVerificationThroughput() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Throughput: Total approvals/rejections made in the last 7 days
    const decisionsCount = await prisma.auditLog.count({
      where: {
        action: { in: ['VERIFICATION_APPROVED', 'VERIFICATION_REJECTED'] },
        createdAt: { gte: sevenDaysAgo }
      }
    });

    // Latency: Average age of currently pending requests
    const pendingDocs = await prisma.verificationDocument.findMany({
      where: { status: 'PENDING' },
      select: { submittedAt: true }
    });

    let averageWaitTimeMs = 0;
    if (pendingDocs.length > 0) {
      const now = Date.now();
      const totalAge = pendingDocs.reduce((sum, doc) => sum + (now - doc.submittedAt.getTime()), 0);
      averageWaitTimeMs = totalAge / pendingDocs.length;
    }

    return { 
      decisionsLast7Days: decisionsCount,
      averageWaitTimeHours: pendingDocs.length > 0 ? averageWaitTimeMs / (1000 * 60 * 60) : 0 
    };
  }

  static async getPendingQueueCounts() {
    const [pendingVerifications, pendingPayments] = await Promise.all([
      prisma.verificationDocument.count({ where: { status: 'PENDING' } }),
      prisma.subscriptionPayment.count({ where: { status: 'PENDING' } }),
    ]);
    return { pendingVerifications, pendingPayments };
  }

  static async getOverview() {
    const cacheKey = 'analytics:overview:aggregates';
    
    // Always fetch live queue counts (volatile)
    const queues = await AnalyticsService.getPendingQueueCounts();

    // Try to fetch heavy aggregates from cache
    let aggregates = await getCached(cacheKey, async () => {
      const [funnel, revenue, fillRate, throughput] = await Promise.all([
        AnalyticsService.getUserFunnel(),
        AnalyticsService.getRevenueMetrics(),
        AnalyticsService.getFillRate(30),
        AnalyticsService.getVerificationThroughput(),
      ]);
      return { funnel, revenue, fillRate, throughput };
    }, 5 * 60); // 5 minutes TTL

    return { ...aggregates, queues };
  }

  // Preserve getBadges for other potential consumers
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
