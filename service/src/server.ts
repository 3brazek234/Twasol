import http from 'http';
import app from './app';
import { env } from './env';
import { logger } from './common/utils/logger';

const server = http.createServer(app);

// Initialize background workers
import './workers/notification-fanout.worker';
import './workers/push-notification.worker';
import './workers/job-alert.worker';
import './workers/job-expiration.worker';
import { scheduleExpirationCheck } from './workers/job-expiration.worker';
import './workers/cleanup.worker';

export default server;
