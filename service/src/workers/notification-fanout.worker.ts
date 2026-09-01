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
    where: { id: jobId },
    include: { courts: true }
  });

  if (!jobEntity) return;

  // If this is a direct invite, only notify the invited lawyer and skip fanout
  if (jobEntity.invitedLawyerId) {
    await prisma.notification.create({
      data: {
        userId: jobEntity.invitedLawyerId,
        type: NotificationType.JOB_INVITE,
        payload: { jobId: jobEntity.id, title: jobEntity.title },
      }
    });

    await pushNotificationQueue.add('push-batch', {
      userIds: [jobEntity.invitedLawyerId],
      payload: { jobId: jobEntity.id, title: jobEntity.title }
    });

    logger.info({ jobId, invitedLawyerId: jobEntity.invitedLawyerId }, 'Direct invite notification sent');
    return;
  }

  const courtIds = jobEntity.courts.map(c => c.courtId);
  if (courtIds.length === 0) return;

  const whereClause = buildMatchingQuery(courtIds, jobEntity.postedByUserId);

  const lawyers = await prisma.lawyerCourt.findMany({
    where: whereClause
  });

  if (lawyers.length > 0) {
    const uniqueLawyerIds = Array.from(new Set(lawyers.map(l => l.userId)));
    
    // Batch insert notifications
    const notifications = uniqueLawyerIds.map(uid => ({
      userId: uid,
      type: NotificationType.NEW_JOB,
      payload: { jobId: jobEntity.id, title: jobEntity.title },
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    // Chunk into 100 for push notifications
    const CHUNK_SIZE = 100;
    const chunks = [];
    for (let i = 0; i < uniqueLawyerIds.length; i += CHUNK_SIZE) {
      chunks.push(uniqueLawyerIds.slice(i, i + CHUNK_SIZE));
    }

    const pushJobs = chunks.map(chunk => ({
      name: 'push-batch',
      data: { userIds: chunk, payload: { jobId: jobEntity.id, title: jobEntity.title } }
    }));

    if (pushJobs.length > 0) {
      await pushNotificationQueue.addBulk(pushJobs);
    }
  }

  logger.info({ jobId, matches: lawyers.length }, 'Notification fanout completed');
}, { 
  connection: redisConnection,
  concurrency: 5
});

notificationFanoutWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Notification fanout failed');
});
