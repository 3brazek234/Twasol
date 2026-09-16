import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  barNumber: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  fullName: z.string().nullable().optional(),
  isActive: z.boolean().default(false),
  role: z.enum(['USER', 'LAWYER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  verificationStatus: z.enum(['UNVERIFIED', 'PENDING_UPLOAD', 'PENDING', 'APPROVED', 'REJECTED']).default('UNVERIFIED'),
  subscriptionStatus: z.enum(['NOT_REQUIRED', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'SUSPENDED']).default('PENDING_PAYMENT'),
  accountMode: z.enum(['GIG', 'HIRING', 'BOTH']).default('BOTH'),
  governorateId: z.string().nullable().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
