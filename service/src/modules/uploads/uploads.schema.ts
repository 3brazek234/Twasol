import { z } from 'zod';

export const presignedUrlSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().positive().max(5 * 1024 * 1024, "File size must be less than 5MB"),
  conversationId: z.string().uuid(),
}).strict();

