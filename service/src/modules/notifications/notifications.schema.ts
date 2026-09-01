import { z } from 'zod';
import { paginationQuerySchema } from '../../common/schemas/pagination.schema';

export const listNotificationsSchema = paginationQuerySchema;

export const markReadSchema = z.object({
  id: z.string().uuid()
});
