import './instrument';
import { scheduleExpirationCheck } from './workers/job-expiration.worker';
import './env'; // validate env vars first (fail fast)
import server from './server';
import { env } from './env';
import { logger } from './common/utils/logger';
import { setupRepeatableJobs } from './common/utils/queue';

server.listen(env.PORT, '0.0.0.0', async () => {
  setupRepeatableJobs().catch(err => logger.error('Failed to setup repeatable jobs', err));
  scheduleExpirationCheck().catch(err => logger.error('Failed to schedule expiration check', err));
  logger.info({ port: env.PORT, env: env.NODE_ENV }, '🚀 Server started (0.0.0.0)');
});
