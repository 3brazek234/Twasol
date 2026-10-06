const { z } = require('zod');
const createSchema = z.object({
  criteria: z.object({
    courtId: z.string().uuid().or(z.literal('')).transform(v => v === '' ? null : v).optional().nullable(),
    taskType: z.string().or(z.literal('')).transform(v => v === '' ? null : v).optional().nullable(),
    q: z.string().or(z.literal('')).transform(v => v === '' ? null : v).optional().nullable(),
  }).refine(data => !!data.courtId || !!data.taskType || !!data.q)
});
console.log("Empty string test:", createSchema.safeParse({ criteria: { courtId: '123e4567-e89b-12d3-a456-426614174000', q: '' } }).success);
console.log("All empty test:", createSchema.safeParse({ criteria: { courtId: '', q: '' } }).success);
