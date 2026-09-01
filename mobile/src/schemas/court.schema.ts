import { z } from 'zod';

export const CourtTypeEnum = z.enum(['PARTIAL', 'PRIMARY', 'APPEAL', 'CASSATION']);
export type CourtType = z.infer<typeof CourtTypeEnum>;

export const CourtTypeLabelAr: Record<CourtType, string> = {
  PARTIAL:   'جزئية',
  PRIMARY:   'ابتدائية',
  APPEAL:    'استئناف',
  CASSATION: 'نقض',
};

export const CourtTypeLabelEn: Record<CourtType, string> = {
  PARTIAL:   'Partial',
  PRIMARY:   'Primary',
  APPEAL:    'Appeal',
  CASSATION: 'Cassation',
};

export const GovernorateSchema = z.object({
  id:     z.string().uuid(),
  nameAr: z.string(),
  nameEn: z.string(),
});
export type Governorate = z.infer<typeof GovernorateSchema>;

export const CourtSchema = z.object({
  id:            z.string().uuid(),
  nameAr:        z.string(),
  nameEn:        z.string(),
  type:          CourtTypeEnum,
  governorateId: z.string().uuid().nullable().optional(),
  parentCourtId: z.string().uuid().nullable().optional(),
  governorate:   GovernorateSchema.nullable().optional(),
});
export type Court = z.infer<typeof CourtSchema>;

export const LawyerCourtSchema = z.object({
  id:       z.string().uuid(),
  courtId:  z.string().uuid(),
  lawyerId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  court:    CourtSchema.optional(),
});
export type LawyerCourt = z.infer<typeof LawyerCourtSchema>;
