import { Router } from 'express';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { notificationFanoutQueue, pushNotificationQueue, emailDigestQueue, cleanupQueue, redisConnection } from '../../common/utils/queue';
import { authorize } from '../../common/middleware/authorize';
import { authenticate } from '../../common/middleware/authenticate';
import { env } from '../../env';

const router = Router();

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(notificationFanoutQueue),
    new BullMQAdapter(pushNotificationQueue),
    new BullMQAdapter(emailDigestQueue),
    new BullMQAdapter(cleanupQueue),
  ],
  serverAdapter,
});

// Use authentication and authorization only in production
if (env.NODE_ENV === 'production') {
  router.use('/', authenticate, authorize('ADMIN'), serverAdapter.getRouter());
} else {
  router.use('/', serverAdapter.getRouter());
}

export default router;

export const checkQueueHealth = async (req: any, res: any) => {
  try {
    const isReady = redisConnection.status === 'ready';
    if (!isReady) throw new Error('Redis not ready');
    
    const count = await notificationFanoutQueue.getWaitingCount();
    const workers = await notificationFanoutQueue.getWorkers();
    
    if (workers.length === 0) {
      throw new Error('No workers attached to notificationFanoutQueue');
    }

    res.json({ status: 'ok', waitingJobs: count, activeWorkers: workers.length });
  } catch (err: any) {
    res.status(503).json({ status: 'error', message: err.message });
  }
};
