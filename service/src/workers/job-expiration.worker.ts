import { Worker, Job as BullJob } from 'bullmq';
import { redisConnection } from '../common/utils/queue';
import { prisma } from '../prisma';
import { logger } from '../common/utils/logger';
import { JobStatus } from '@prisma/client';

export const jobExpirationWorker = new Worker(
  'job-expiration',
  async (job: BullJob) => {
    const { jobId } = job.data;
    
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
      
      const result = await prisma.$transaction(async (tx) => {
        // Case A & B: Uncompleted jobs expire permanently
        const updateResult = await tx.job.updateMany({
          where: { 
            id: jobId, 
            status: dbJob.status,
            version: dbJob.version 
          },
          data: { 
            status: 'EXPIRED', 
            expiredAt: new Date(),
            version: { increment: 1 }
          }
        });

        if (updateResult.count === 0) {
          throw new Error('Concurrency conflict or state changed during expiration');
        }
        
        return tx.job.findUnique({
          where: { id: jobId },
          include: { court: true }
        });
      });

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
