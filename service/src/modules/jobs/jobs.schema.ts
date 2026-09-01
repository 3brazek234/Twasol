import { z } from 'zod';
import { paginationQuerySchema } from '../../common/schemas/pagination.schema';

const moneyRegex = /^\d+(\.\d{1,2})?$/;

const createJobBody = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  courtId: z.string().uuid('معرف المحكمة غير صالح'),
  invitedLawyerId: z.string().uuid().optional(),
  salaryMin: z.string().regex(moneyRegex, 'Invalid money format').optional(),
  salaryMax: z.string().regex(moneyRegex, 'Invalid money format').optional(),
  currency: z.string().default('EGP'),
  expiresAt: z.coerce.date().optional(),
}).refine(data => {
  if (data.salaryMin && data.salaryMax) {
    return parseFloat(data.salaryMin) <= parseFloat(data.salaryMax);
  }
  return true;
}, {
  message: "salaryMin must be less than or equal to salaryMax",
  path: ["salaryMax"],
});

// Export the raw body schema for validate middleware with source='body'
export const createJobSchema = createJobBody;

export const listJobsSchema = paginationQuerySchema.extend({
  courtId: z.string().uuid().optional(),
  status: z.string().optional(),
  q: z.string().optional(),
});

export const jobIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const updateJobStatusSchema = z.object({
  status: z.string(),
});
