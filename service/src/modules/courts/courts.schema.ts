import { z } from 'zod';
import { paginationQuerySchema } from '../../common/schemas/pagination.schema';

export const CourtTypeEnum = z.enum(['PARTIAL', 'PRIMARY', 'APPEAL', 'CASSATION']);

export const createCourtSchema = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  type: CourtTypeEnum,
  governorateId: z.string().uuid().optional(),
  parentCourtId: z.string().uuid().optional(),
});

export const courtIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const registerLawyerSchema = z.object({
  courtId: z.string().uuid(),
});

export const listCourtsSchema = paginationQuerySchema.merge(
  z.object({
    type: CourtTypeEnum.optional(),
    governorateId: z.string().uuid().optional(),
  })
);

export const searchCourtsSchema = z.object({
  q: z.string().min(1),
});
