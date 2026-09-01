import { z } from 'zod';

export const searchLawyersSchema = z.object({
  courtId: z.string().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
});

export const lawyerIdParamSchema = z.object({
  id: z.string().uuid('Invalid lawyer ID format')
});
