import { z } from 'zod';
import { paginationQuerySchema } from '../../common/schemas/pagination.schema';

export const createReviewParamsSchema = z.object({
  id: z.string().uuid()
});

export const createReviewBodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional()
});

export const getUserReviewsParamsSchema = z.object({
  id: z.string().uuid()
});

export const getUserReviewsQuerySchema = paginationQuerySchema;
