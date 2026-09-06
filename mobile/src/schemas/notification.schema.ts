import { z } from 'zod';

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  type: z.string(),
  referenceId: z.string().uuid().optional(), // e.g. jobId or conversationId
  metadata: z.record(z.string(), z.any()).optional(),
  isRead: z.boolean().default(false),
  createdAt: z.string().datetime(),
});

export type AppNotification = z.infer<typeof NotificationSchema>;
