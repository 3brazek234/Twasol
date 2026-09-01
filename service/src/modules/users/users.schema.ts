import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  preferredLocale: z.enum(['EN', 'AR']).optional(),
  bio: z.string().max(500).optional(),
  governorateId: z.string().uuid().optional(),
});

export const updateAccountModeSchema = z.object({
  mode: z.enum(['GIG', 'HIRING', 'BOTH']),
});
