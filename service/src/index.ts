import './env'; // validate env vars first (fail fast)
import server from './server';
import { env } from './env';
import { logger } from './common/utils/logger';
import { setupRepeatableJobs } from './common/utils/queue';

// Optional: Sentry initialization
if (env.SENTRY_DSN) {
  // require('@sentry/node').init({
  //   dsn: env.SENTRY_DSN,
  //   environment: env.NODE_ENV,
  // });
  logger.info('Sentry is configured.');
}

server.listen(env.PORT, async () => {
  await setupRepeatableJobs();
  logger.info({ port: env.PORT, env: env.NODE_ENV }, '🚀 Server started');
});
