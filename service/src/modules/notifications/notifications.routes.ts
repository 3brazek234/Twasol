import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validate } from '../../common/middleware/validate';
import { NotificationsController } from './notifications.controller';
import { listNotificationsSchema, markReadSchema } from './notifications.schema';

const router = Router();

router.get('/', authenticate, validate(listNotificationsSchema, 'query'), NotificationsController.list);
router.get('/unread-count', authenticate, NotificationsController.getUnreadCount);
router.patch('/:id/read', authenticate, validate(markReadSchema, 'params'), NotificationsController.markAsRead);

export default router;
