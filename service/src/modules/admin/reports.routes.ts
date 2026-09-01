import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { AdminReportsController } from './reports.controller';
import { validate } from '../../common/middleware/validate';
import { z } from 'zod';

const router = Router();

const idParamsSchema = z.object({
  id: z.string().uuid()
});

router.get('/', authenticate, authorize('ADMIN'), AdminReportsController.list);
router.patch('/:id/status', authenticate, authorize('ADMIN'), validate(idParamsSchema, 'params'), AdminReportsController.updateStatus);

export default router;
