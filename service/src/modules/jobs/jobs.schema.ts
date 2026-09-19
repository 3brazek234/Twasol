import { z } from 'zod';
import { paginationQuerySchema } from '../../common/schemas/pagination.schema';

const moneyRegex = /^\d+(\.\d{1,2})?$/;

const createJobBody = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  courtId: z.string().uuid('معرف المحكمة غير صالح'),
  invitedLawyerId: z.string().uuid().optional(),
  taskType: z.enum(['ATTEND_SESSION', 'OBTAIN_DOCUMENT', 'FILE_PLEADING', 'REGISTER_PROPERTY', 'REVIEW_DOCKET', 'OTHER']),
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
  taskType: z.string().optional(),
  sortBy: z.enum(['newest', 'fee_desc', 'deadline_asc']).optional(),
  q: z.string().optional(),
});

export const jobIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const updateJobStatusSchema = z.object({
  status: z.string(),
});
