import http from 'http';
import app from './app';
import { initializeSocket } from './socket';
import { env } from './env';
import { logger } from './common/utils/logger';

const server = http.createServer(app);
const io = initializeSocket(server);

// Make io accessible for services that need to emit events
export { io };

// Initialize background workers
import './workers/notification-fanout.worker';
import './workers/push-notification.worker';
import './workers/job-expiration.worker';
import './workers/cleanup.worker';

export default server;
