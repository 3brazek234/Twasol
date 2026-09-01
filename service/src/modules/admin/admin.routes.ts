import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { AuditLogsController } from './audit-logs.controller';
import { AnalyticsController } from './analytics.controller';
import usersRoutes from './users.routes';
import adminsRoutes from './admins.routes';
import jobsRoutes from './jobs.routes';
import reportsRoutes from './reports.routes';
import supportRoutes from './support.routes';
import { adminSubscriptionRouter } from '../subscription/subscription.routes';

const router = Router();

router.get('/analytics/overview', authenticate, authorize('ADMIN'), AnalyticsController.getOverview);
router.get('/analytics/badges', authenticate, authorize('ADMIN'), AnalyticsController.getBadges);
router.get('/audit-logs', authenticate, authorize('ADMIN'), AuditLogsController.getLogs);


router.use('/users', usersRoutes);
router.use('/admins', adminsRoutes);
router.use('/jobs', jobsRoutes);
router.use('/reports', reportsRoutes);
router.use('/support', supportRoutes);
router.use('/subscription', adminSubscriptionRouter);

export default router;
