import { z } from 'zod';

export const JobSchema = z.object({
  id: z.string().uuid(),
  courtId: z.string().uuid(),
  courtNameAr: z.string().optional(),
  courtNameEn: z.string().optional(),
  posterName: z.string().optional(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['OPEN', 'NEGOTIATING', 'AGREED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED']),
  posterId: z.string().uuid(),
  assignedExecutorId: z.string().uuid().nullable().optional(),
  offerAmount: z.number().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Job = z.infer<typeof JobSchema>;
export const JobFeedResponseSchema = z.array(JobSchema);
