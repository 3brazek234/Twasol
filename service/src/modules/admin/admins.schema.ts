import { z } from 'zod';

export const createAdminSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8)
});
