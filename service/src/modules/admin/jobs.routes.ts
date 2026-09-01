import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { AdminJobsController } from './jobs.controller';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), AdminJobsController.list);

export default router;
