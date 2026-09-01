import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { SupportController } from './support.controller';

const router = Router();

router.post('/conversations', authenticate, SupportController.createConversation);
router.get('/conversations/mine', authenticate, SupportController.getMyConversation);

export { router as supportRouter };
