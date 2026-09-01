import { z } from 'zod';
import { paginationQuerySchema } from '../../common/schemas/pagination.schema';

export const activationSchema = z.object({
  reason: z.string().optional()
});

export const verificationOverrideSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  justification: z.string().min(20, 'Justification must be at least 20 characters long')
});

export const idParamsSchema = z.object({
  id: z.string().uuid()
});

export const listUsersQuerySchema = paginationQuerySchema.extend({
  role: z.enum(['LAWYER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  verificationStatus: z.enum(['UNVERIFIED', 'PENDING_UPLOAD', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
  search: z.string().optional(),
});
