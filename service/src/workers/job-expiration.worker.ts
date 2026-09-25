import { JobsLifecycleService } from "../modules/jobs/jobs.lifecycle.service";

import { Worker, Job as BullJob, Queue } from 'bullmq';
import { redisConnection } from '../common/utils/queue';
import { prisma } from '../prisma';
import { logger } from '../common/utils/logger';
import { JobStatus } from '@prisma/client';

export const jobExpirationWorker = new Worker(
  'job-expiration',
  async (job: BullJob) => {
    const { jobId } = job.data;
    
    if (!jobId) {
      if (job.name === "check-expired-jobs") {
        logger.info('Running recurring expiration sweep');
        const expiredJobs = await prisma.job.findMany({
          where: {
            expiresAt: { lt: new Date() },
            status: { in: ['OPEN', 'NEGOTIATING', 'AGREED', 'IN_PROGRESS'] }
          },
          select: { id: true }
        });
        
        logger.info({ count: expiredJobs.length }, 'Found expired jobs during sweep');
        for (const expired of expiredJobs) {
          // Re-queue them as individual targeted jobs so they get processed safely
          await (job as any).queue.add('expire-specific-job', { jobId: expired.id });
        }
        return;
      }
      logger.warn('Job received without jobId, skipping');
      return;
    }

    logger.info({ jobId }, 'Processing job expiration');

    try {
      const dbJob = await prisma.job.findUnique({
        where: { id: jobId }
      });

      if (!dbJob) {
        logger.info({ jobId }, 'Job not found, skipping expiration');
        return;
      }

      // Check if job is in an incomplete state
      if (!['OPEN', 'NEGOTIATING', 'AGREED', 'IN_PROGRESS'].includes(dbJob.status)) {
        logger.info({ jobId, status: dbJob.status }, 'Job is not in an incomplete state, skipping expiration');
        return;
      }

      const previousAssignedLawyerId = dbJob.assignedLawyerId || dbJob.invitedLawyerId;
      
      const result = await JobsLifecycleService.expireJob(jobId);

      if (result) {
        // Broadcast via Socket.IO using fanout
        const { notificationFanoutQueue, pushNotificationQueue } = await import('../common/utils/queue');
        
        if (previousAssignedLawyerId) {
          // Notify previous lawyer
          await pushNotificationQueue.add('push', {
            userId: previousAssignedLawyerId,
            type: 'JOB_EXPIRED_WITHDRAWN',
            payload: { jobId, message: 'The job assignment expired and has been withdrawn.' }
          });
        }
        
        // Re-broadcast availability
        await notificationFanoutQueue.add('fanout', { jobId: result.id });
      }

    } catch (error) {
      logger.error({ err: error, jobId }, 'Failed to process job expiration');
      throw error;
    }
  },
  { connection: redisConnection }
);

jobExpirationWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Job expiration worker failed');
});



export const expirationQueue = new Queue("job-expiration", { connection: redisConnection });

export async function scheduleExpirationCheck() {
  if (expirationQueue.upsertJobScheduler) {
    await expirationQueue.upsertJobScheduler(
      "expiration-check-recurring",
      { every: 15 * 60 * 1000 },
      {
        name: "check-expired-jobs",
        data: {}
      }
    );
  } else {
    // Fallback for older bullmq versions
    await expirationQueue.add(
      "check-expired-jobs",
      {},
      {
        repeat: { every: 15 * 60 * 1000 },
        jobId: "expiration-check-recurring",
      } as any
    );
  }
}
