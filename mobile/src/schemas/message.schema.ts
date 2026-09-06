import { z } from 'zod';

export const MessageSchema = z.object({
  id: z.string().uuid().optional(), // optional before server confirms
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string(),
  type: z.enum(['text', 'offer', 'offer_accepted', 'offer_rejected', 'offer_withdrawn']).default('text'),
  offerAmount: z.number().optional(),
  timestamp: z.string().datetime().or(z.date()).optional(),
  status: z.enum(['pending', 'sent', 'error']).default('sent'), // local state
});

export type Message = z.infer<typeof MessageSchema>;
