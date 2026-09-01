import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { AdminSupportController } from './support.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/conversations', AdminSupportController.list);
router.get('/conversations/:id/messages', AdminSupportController.getMessages);
router.post('/conversations/:id/messages', AdminSupportController.sendMessage);
router.patch('/conversations/:id/resolve', AdminSupportController.resolve);

export default router;
