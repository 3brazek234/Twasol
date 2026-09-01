import { z } from 'zod';
import { paginationQuerySchema } from '../../common/schemas/pagination.schema';

export const getUploadUrlSchema = z.object({
  documentType: z.enum(['bar_license', 'government_id']),
  contentType: z.string().min(1),
});

export const confirmUploadParamsSchema = z.object({
  documentId: z.string().uuid(),
});

export const reviewDocumentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional(),
});

export const reviewDocumentParamsSchema = z.object({
  id: z.string().uuid(),
});

export const pendingQueueSchema = paginationQuerySchema;
