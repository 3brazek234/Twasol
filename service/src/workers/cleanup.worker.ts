import { Worker } from 'bullmq';
import { prisma } from '../prisma';
import { env } from '../env';
import { logger } from '../common/utils/logger';
import { deleteFromR2 } from '../common/utils/r2';
import { redisConnection } from '../common/utils/queue';

export const cleanupWorker = new Worker(
  'cleanup-queue',
  async () => {
    logger.info('Running cleanup job for PENDING_UPLOAD documents...');
    
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const staleDocs = await prisma.verificationDocument.findMany({
      where: {
        status: 'PENDING_UPLOAD',
        submittedAt: { lt: cutoff },
      },
      select: { id: true, fileKey: true },
    });

    if (staleDocs.length === 0) {
      logger.info('No stale documents to clean up.');
      return;
    }

    let deletedCount = 0;
    for (const doc of staleDocs) {
      try {
        await deleteFromR2(doc.fileKey);
      } catch (err: any) {
        // If file doesn't exist in R2, it's fine, we still want to delete the DB row
        logger.warn({ docId: doc.id, err: err.message }, 'Failed to delete file from R2 during cleanup');
      }

      await prisma.verificationDocument.delete({ where: { id: doc.id } });
      deletedCount++;
    }

    logger.info(`Cleaned up ${deletedCount} stale PENDING_UPLOAD documents.`);
  },
  {
    connection: redisConnection,
  }
);

cleanupWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Cleanup job failed');
});
