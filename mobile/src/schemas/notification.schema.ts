import { z } from 'zod';

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  type: z.enum(['new_job', 'offer_received', 'offer_accepted', 'offer_rejected', 'chat_message']),
  referenceId: z.string().uuid().optional(), // e.g. jobId or conversationId
  metadata: z.record(z.any()).optional(),
  isRead: z.boolean().default(false),
  createdAt: z.string().datetime(),
});

export type AppNotification = z.infer<typeof NotificationSchema>;
