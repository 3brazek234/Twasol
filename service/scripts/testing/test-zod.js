const { z } = require('zod');
const schema = z.string().uuid().optional().nullable();
console.log(schema.safeParse("").success);
