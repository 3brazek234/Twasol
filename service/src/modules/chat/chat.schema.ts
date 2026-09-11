import { z } from 'zod';
import { MessageType } from '@prisma/client';

export const joinConversationSchema = z.object({
  conversationId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().max(5000).optional().default(''),
  type: z.nativeEnum(MessageType).default('TEXT'),
  offerAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  attachmentUrl: z.string().optional(),
  attachmentType: z.enum(['IMAGE', 'DOCUMENT']).optional(),
  attachmentName: z.string().optional(),
  attachmentSize: z.number().optional(),
  replyToId: z.string().uuid().optional()
}).refine((data) => {
  if (data.type === 'OFFER' && !data.offerAmount) {
    return false;
  }
  return true;
}, {
  message: 'Offer amount is required for offer messages',
  path: ['offerAmount'],
}).refine(data => {
  if (!data.content && !data.attachmentUrl) return false;
  return true;
}, {
  message: 'Content or attachment is required',
  path: ['content'],
});

export const acceptOfferSchema = z.object({
  messageId: z.string().uuid(),
  conflictsCheckPassed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm that you have run a conflicts check and found no conflicts.' }),
  }),
});

export const rejectOfferSchema = z.object({
  messageId: z.string().uuid(),
});

export const directInquirySchema = z.object({
  lawyerId: z.string().uuid(),
});

export const convertToJobSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(5000),
  courtIds: z.array(z.string().uuid()).min(1).max(5),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
});
