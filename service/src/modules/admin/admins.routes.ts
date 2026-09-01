import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { validate } from '../../common/middleware/validate';
import { AdminsController } from './admins.controller';
import { createAdminSchema } from './admins.schema';

const router = Router();

router.post('/', authenticate, authorize('SUPER_ADMIN'), validate(createAdminSchema, 'body'), AdminsController.create);

export default router;
