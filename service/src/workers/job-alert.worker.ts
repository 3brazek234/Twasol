import { Worker, Job } from 'bullmq';
import { prisma } from '../prisma';
import { redisConnection } from '../common/utils/queue';
import { NotificationType, Prisma } from '@prisma/client';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { logger } from '../common/utils/logger';

export const jobAlertWorker = new Worker('job-alert', async (job: Job) => {
  const { jobId } = job.data;
  const jobEntity = await prisma.job.findUnique({
    where: { id: jobId }
  });

  if (!jobEntity) return;
  if (jobEntity.status !== 'OPEN') return; // Just in case it closed extremely fast

  // Skip direct invites
  if (jobEntity.invitedLawyerId) return;

  // Build query to find matching saved searches
  // We want saved searches where:
  // (courtId is null OR courtId matches) AND (taskType is null OR taskType matches)
  const matchingSearches = await prisma.savedSearch.findMany({
    where: {
      userId: { not: jobEntity.postedByUserId },
      AND: [
        {
          OR: [
            { courtId: null },
            { courtId: jobEntity.courtId }
          ]
        },
        {
          OR: [
            { taskType: null },
            { taskType: jobEntity.taskType }
          ]
        }
      ]
    },
    select: { userId: true }
  });

  if (matchingSearches.length > 0) {
    const uniqueLawyerIds = Array.from(new Set(matchingSearches.map(s => s.userId)));
    
    await NotificationsService.notifyManyUsers(
      uniqueLawyerIds,
      {
        type: NotificationType.NEW_JOB_ALERT,
        titleAr: 'تنبيه بحث محفوظ 🔔',
        messageAr: `تم نشر مهمة جديدة تطابق بحثك: ${jobEntity.title}`,
        data: { jobId: jobEntity.id },
      }
    );

    logger.info({ jobId, matches: uniqueLawyerIds.length }, 'Job alert fanout completed');
  }
}, { 
  connection: redisConnection,
  concurrency: 5
});

jobAlertWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Job alert fanout failed');
});
