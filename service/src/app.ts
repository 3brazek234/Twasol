import express from 'express';
import { AppError } from './common/errors/AppError';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { generalLimiter } from './common/middleware/rateLimiter';
import { errorHandler } from './common/middleware/errorHandler';
import { requestId } from './common/middleware/requestId';
import { localeMiddleware } from './common/middleware/locale';
import authRoutes from './modules/auth/auth.routes';
import courtsRoutes from './modules/courts/courts.routes';
import jobsRoutes from './modules/jobs/jobs.routes';
import savedSearchesRoutes from './modules/saved-searches/saved-searches.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import verificationRoutes from './modules/verification/verification.routes';
import usersRoutes from './modules/users/users.routes';
import { lawyersRouter } from './modules/lawyers/lawyers.routes';
import { jobReviewsRouter, userReviewsRouter } from './modules/reviews/reviews.routes';
import { chatRouter } from './modules/chat/chat.routes';
import { supportRouter } from './modules/support/support.routes';
import { subscriptionRouter } from './modules/subscription/subscription.routes';
import { uploadsRouter } from './modules/uploads/uploads.routes';
import { prisma } from './prisma';
import { env } from './env';
import * as Sentry from '@sentry/node';

const app = express();

app.use(requestId);
app.use(cors({ origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(generalLimiter);
app.use(localeMiddleware);

// OpenAPI Documentation (non-production, non-test only)
if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test') {
  const swaggerUi = require('swagger-ui-express');
  const { generateOpenAPIDocument } = require('./common/docs/openapi');
  // Initialize registries (import for side-effects)
  require('./common/docs/registerSchemas');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(generateOpenAPIDocument()));
}

import queueRoutes, { checkQueueHealth } from './modules/admin/queues.routes';
import adminRoutes from './modules/admin/admin.routes';

// Health checks
app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } }));
app.get('/health/db', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, data: { status: 'ok', db: 'connected' } });
  } catch (err) {
    next(AppError.internal('Database disconnected'));
  }
});
app.get('/health/queue', checkQueueHealth);

// Admin routes
app.use('/api/admin', adminRoutes);
app.use('/admin/queues', queueRoutes);

app.get("/debug-sentry", function mainHandler(_req, _res) {
  // Send a log before throwing the error
  // @ts-ignore - Sentry.logger might not be exposed in the types, but we'll try to just throw the error
  Sentry.metrics?.increment('test_counter', 1);
  throw new Error("My first Sentry error!");
});

app.get("/debug-env", (_req, res) => {
  res.json({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "MISSING",
    has_api_key: !!process.env.CLOUDINARY_API_KEY,
    has_api_secret: !!process.env.CLOUDINARY_API_SECRET
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/courts', courtsRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/saved-searches', savedSearchesRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/lawyers', lawyersRouter);
app.use('/api/conversations', chatRouter);
app.use('/api/support', supportRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/uploads', uploadsRouter);

// Review routes (nested)
app.use('/api/jobs/:id/reviews', jobReviewsRouter);
app.use('/api/users/:id/reviews', userReviewsRouter);

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// Error handler (must be last)
app.use(errorHandler);

export default app;
