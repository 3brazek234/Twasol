import { Worker, Job } from 'bullmq';
import { redisConnection } from '../common/utils/queue';
import { logger } from '../common/utils/logger';

export const pushNotificationWorker = new Worker('push-notification', async (job: Job) => {
  if (job.name === 'push-batch') {
    const { userIds, payload } = job.data;
    // TODO: Expo Push API integration for batch
    // e.g., const tickets = await expo.sendPushNotificationsAsync(messages);
    logger.info({ userCount: userIds.length, payload }, 'Push notification batch simulated');
  } else {
    const { userId, notificationId } = job.data;
    logger.info({ userId, notificationId }, 'Single push notification simulated');
  }
}, { 
  connection: redisConnection, 
  concurrency: 5,
  limiter: {
    max: 10,       // Max 10 jobs (chunks of 100 = 1000 users)
    duration: 1000 // per second
  }
});

pushNotificationWorker.on('failed', (job, err) => {
  logger.error({ userId: job?.data.userId, err }, 'Push notification failed');
});
