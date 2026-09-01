import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validate } from '../../common/middleware/validate';
import { ChatController } from './chat.controller';
import { directInquirySchema, convertToJobSchema } from './chat.schema';

const router = Router();

router.get('/', authenticate, ChatController.getMyConversations);

router.get('/:id/messages', authenticate, ChatController.getMessages);
router.post('/direct', authenticate, validate(directInquirySchema, 'body'), ChatController.createDirectInquiry);
router.post('/:id/convert-to-job', authenticate, validate(convertToJobSchema, 'body'), ChatController.convertToJob);

export { router as chatRouter };
