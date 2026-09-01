import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { VerificationController } from './verification.controller';
import { authorize } from '../../common/middleware/authorize';
import { validate } from '../../common/middleware/validate';
import { getUploadUrlSchema, confirmUploadParamsSchema, reviewDocumentSchema, reviewDocumentParamsSchema, pendingQueueSchema } from './verification.schema';

const router = Router();

// User routes
router.post('/upload-url', authenticate, validate(getUploadUrlSchema, 'body'), VerificationController.getUploadUrl);
router.post('/:documentId/confirm', authenticate, validate(confirmUploadParamsSchema, 'params'), VerificationController.confirmUpload);
router.get('/status', authenticate, VerificationController.getStatus);

// Admin routes
router.get('/admin/pending', authenticate, authorize('ADMIN'), validate(pendingQueueSchema, 'query'), VerificationController.getPendingQueue);
router.patch('/admin/:id/review', authenticate, authorize('ADMIN'), validate(reviewDocumentParamsSchema, 'params'), validate(reviewDocumentSchema, 'body'), VerificationController.review);
router.get('/admin/:documentId/view-url', authenticate, authorize('ADMIN'), validate(confirmUploadParamsSchema, 'params'), VerificationController.getViewUrl);

export default router;
