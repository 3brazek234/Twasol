import { z } from 'zod';

export const MessageSchema = z.object({
  id: z.string().uuid().optional(), // optional before server confirms
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string(),
  type: z.enum(['text', 'offer', 'offer_accepted', 'offer_rejected', 'offer_withdrawn', 'OFFER']).default('text'),
  offerAmount: z.number().optional(),
  offerStatus: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']).optional(),
  timestamp: z.string().datetime().or(z.date()).optional(),
  status: z.enum(['pending', 'sent', 'delivered', 'read', 'error']).default('sent'), // local state
  attachmentUrl: z.string().optional(),
  attachmentType: z.enum(['IMAGE', 'DOCUMENT']).optional(),
  attachmentName: z.string().optional(),
  attachmentSize: z.number().optional(),
  localUri: z.string().optional(),
  uploadProgress: z.number().optional(),
  reactions: z.array(z.object({
    id: z.string().optional(),
    emoji: z.string(),
    userId: z.string()
  })).optional(),
  replyToId: z.string().optional(),
  replyTo: z.any().optional(), // Can't easily recursively type here with zod without lazy, so use any for now
});

export type Message = z.infer<typeof MessageSchema>;
