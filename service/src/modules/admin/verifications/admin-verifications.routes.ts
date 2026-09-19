import { Router } from 'express';
import { authenticate } from '../../../common/middleware/authenticate';
import { authorize } from '../../../common/middleware/authorize';
import { validate } from '../../../common/middleware/validate';
import { AdminVerificationsController } from './admin-verifications.controller';
import { rejectVerificationSchema } from './admin-verifications.schema';

const router = Router();

// Every route is gated by authorize('ADMIN')
router.get('/pending', authenticate, authorize('ADMIN'), AdminVerificationsController.listPending);
router.get('/:userId/documents', authenticate, authorize('ADMIN'), AdminVerificationsController.getDocuments);
router.post('/:userId/approve', authenticate, authorize('ADMIN'), AdminVerificationsController.approve);
router.post('/:userId/reject', authenticate, authorize('ADMIN'), validate(rejectVerificationSchema, 'body'), AdminVerificationsController.reject);

export default router;
