import { buildNotification } from "../modules/notifications/notification-payload";
import { NotificationsService } from "../modules/notifications/notifications.service";

import { Worker, Job } from 'bullmq';
import { prisma } from '../prisma';
import { redisConnection, pushNotificationQueue } from '../common/utils/queue';
import { NotificationType, VerificationStatus } from '@prisma/client';
import { logger } from '../common/utils/logger';

export function buildMatchingQuery(
  courtIds: string[],
  postedByUserId: string
) {
  return {
    courtId: { in: courtIds },
    isActive: true,
    user: {
      isActive: true,
      verificationStatus: VerificationStatus.APPROVED,
      id: { not: postedByUserId },
    }
  };
}

export const notificationFanoutWorker = new Worker('notification-fanout', async (job: Job) => {
  const { jobId } = job.data;
  const jobEntity = await prisma.job.findUnique({
    where: { id: jobId }
  });

  if (!jobEntity) return;

  // If this is a direct invite, only notify the invited lawyer and skip fanout
  if (jobEntity.invitedLawyerId) {
    await prisma.notification.create({
      data: buildNotification({
        userId: jobEntity.invitedLawyerId,
        type: NotificationType.JOB_INVITE,
        titleAr: 'دعوة جديدة 📨',
        messageAr: `تمت دعوتك للتقديم على مهمة: ${jobEntity.title}`,
        data: { jobId: jobEntity.id },
      })
    });

    logger.info({ jobId, invitedLawyerId: jobEntity.invitedLawyerId }, 'Direct invite notification sent');
    return;
  }

  const courtIds = jobEntity.courtId ? [jobEntity.courtId] : [];
  if (courtIds.length === 0) return;

  const whereClause = buildMatchingQuery(courtIds, jobEntity.postedByUserId);

  const lawyers = await prisma.lawyerCourt.findMany({
    where: whereClause
  });

  if (lawyers.length > 0) {
    const uniqueLawyerIds = Array.from(new Set(lawyers.map(l => l.userId)));
    
    await NotificationsService.notifyManyUsers(
      uniqueLawyerIds,
      {
        type: NotificationType.NEW_JOB,
        titleAr: 'مهمة جديدة متاحة 💼',
        messageAr: `تم نشر مهمة جديدة في المحكمة: ${jobEntity.title}`,
        data: { jobId: jobEntity.id },
      }
    );
  }

  logger.info({ jobId, matches: lawyers.length }, 'Notification fanout completed');
}, { 
  connection: redisConnection,
  concurrency: 5
});

notificationFanoutWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Notification fanout failed');
});
