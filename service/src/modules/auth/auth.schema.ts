import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    barNumber: z.string().optional(),
    preferredLocale: z.enum(['EN', 'AR']).default('EN').optional(),
    accountMode: z.enum(['GIG', 'HIRING', 'BOTH']).optional(),
    role: z.enum(['LAWYER', 'ADMIN']).default('LAWYER'),
    governorateId: z.string().uuid().optional()
  })
  .refine(data => data.fullName || data.name, {
    message: 'Full name or name is required',
    path: ['fullName']
  })
  .transform(data => {
    const fullName = data.fullName || data.name || '';
    return {
      ...data,
      fullName,
      name: fullName
    };
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
});

export const requestPasswordResetSchema = z.object({
  body: z.object({
    email: z.string().email('بريد إلكتروني غير صالح')
  })
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('بريد إلكتروني غير صالح'),
    otp: z.string().length(6, 'الرمز يجب أن يكون 6 أرقام')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    resetToken: z.string().min(1, 'رمز إعادة التعيين مطلوب'),
    newPassword: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  })
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshInput = z.infer<typeof refreshSchema>['body'];
