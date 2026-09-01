import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { SubscriptionController, AdminSubscriptionController } from './subscription.controller';

// ─── مسارات المحامي ───────────────────────────────────────────────────────────
const lawyerRouter = Router();

lawyerRouter.get('/plans', SubscriptionController.getPlans);
lawyerRouter.get('/status',             authenticate, SubscriptionController.getStatus);
lawyerRouter.post('/receipt-upload-url', authenticate, SubscriptionController.getReceiptUploadUrl);
lawyerRouter.post('/submit',             authenticate, SubscriptionController.submit);

// ─── مسارات الأدمن ────────────────────────────────────────────────────────────
const adminRouter = Router();

adminRouter.use(authenticate, authorize('ADMIN'));

adminRouter.get('/payments',                   AdminSubscriptionController.listPayments);
adminRouter.get('/payments/:id/receipt',       AdminSubscriptionController.getReceiptUrl);
adminRouter.patch('/payments/:id/approve',     AdminSubscriptionController.approve);
adminRouter.patch('/payments/:id/reject',      AdminSubscriptionController.reject);
adminRouter.post('/manual-grant',              AdminSubscriptionController.manualGrant);

export { lawyerRouter as subscriptionRouter, adminRouter as adminSubscriptionRouter };
