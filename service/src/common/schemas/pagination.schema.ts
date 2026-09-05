// src/common/schemas/pagination.schema.ts
import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(25),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Standard paginated response shape.
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export function paginate<T>(data: T[], total: number, page: number, limit: number): PaginatedResponse<T> {
  return {
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}
