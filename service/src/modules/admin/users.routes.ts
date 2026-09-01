import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { validate } from '../../common/middleware/validate';
import { AdminUsersController } from './users.controller';
import { activationSchema, verificationOverrideSchema, idParamsSchema, listUsersQuerySchema } from './users.schema';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), validate(listUsersQuerySchema, 'query'), AdminUsersController.list);
router.patch('/:id/deactivate', authenticate, authorize('ADMIN'), validate(idParamsSchema, 'params'), validate(activationSchema, 'body'), AdminUsersController.deactivate);
router.patch('/:id/activate', authenticate, authorize('ADMIN'), validate(idParamsSchema, 'params'), validate(activationSchema, 'body'), AdminUsersController.activate);
router.patch('/:id/verification-override', authenticate, authorize('ADMIN'), validate(idParamsSchema, 'params'), validate(verificationOverrideSchema, 'body'), AdminUsersController.overrideVerification);

export default router;
