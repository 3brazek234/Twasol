import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validate } from '../../common/middleware/validate';
import { chatLimiter } from '../../common/middleware/rateLimiter';
import { ChatController } from './chat.controller';
import { directInquirySchema, convertToJobSchema } from './chat.schema';

const router = Router();

router.get('/', authenticate, ChatController.getMyConversations);

router.get('/:id/messages', authenticate, ChatController.getMessages);
router.post('/:id/messages', authenticate, chatLimiter, ChatController.sendMessage);
router.post('/messages/:messageId/accept', authenticate, ChatController.acceptOffer);
router.post('/messages/:messageId/reject', authenticate, ChatController.rejectOffer);

router.patch('/:id/messages/read', authenticate, ChatController.markMessagesAsRead);
router.post('/direct', authenticate, chatLimiter, validate(directInquirySchema, 'body'), ChatController.createDirectInquiry);
router.post('/:id/convert-to-job', authenticate, validate(convertToJobSchema, 'body'), ChatController.convertToJob);
router.get('/:id/messages/search', authenticate, ChatController.searchMessages);


export { router as chatRouter };
