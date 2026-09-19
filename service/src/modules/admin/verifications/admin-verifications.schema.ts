import { z } from 'zod';

export const rejectVerificationSchema = z.object({
  rejectionReason: z.string().min(1, 'سبب الرفض مطلوب').max(500, 'سبب الرفض يجب أن يكون أقل من 500 حرف'),
});
