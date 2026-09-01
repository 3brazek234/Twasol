import { Queue } from 'bullmq';
import { env } from '../../env';
import IORedis from 'ioredis';

export const redisConnection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const notificationFanoutQueue = new Queue('notification-fanout', { 
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  }
});

export const pushNotificationQueue = new Queue('push-notification', { 
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  }
});

export const emailDigestQueue = new Queue('email-digest', { connection: redisConnection });
export const cleanupQueue = new Queue('cleanup-queue', { connection: redisConnection });
export const jobExpirationQueue = new Queue('job-expiration', { connection: redisConnection });

// Set up repeatable jobs
export async function setupRepeatableJobs() {
  await emailDigestQueue.add('daily-digest', {}, {
    // @ts-ignore
    repeat: { pattern: '0 8 * * *' } // 8 AM daily
  });

  await cleanupQueue.add('cleanup-stale-uploads', {}, {
    // @ts-ignore
    repeat: { pattern: '0 * * * *' } // Every hour
  });
}
