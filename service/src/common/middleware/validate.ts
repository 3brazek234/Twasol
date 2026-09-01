// src/common/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../errors/AppError';

/**
 * Reusable validation middleware factory.
 *
 * Usage:
 *   router.post('/jobs', validate(createJobSchema), controller.create);
 *
 * Validates req.body, req.query, and req.params against the provided Zod schema.
 * The schema should be a z.object with optional `body`, `query`, `params` keys,
 * OR a flat schema when a specific source is specified.
 */
export function validate(schema: ZodSchema, source?: 'body' | 'query' | 'params') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (source) {
        const parsed = await schema.parseAsync(req[source]);
        req[source] = parsed;
      } else {
        const parsed = await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
        if (parsed && typeof parsed === 'object') {
          if ('body' in parsed) req.body = parsed.body;
          if ('query' in parsed) req.query = parsed.query;
          if ('params' in parsed) req.params = parsed.params;
        }
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(AppError.validation(err.flatten().fieldErrors));
      } else {
        next(err);
      }
    }
  };
}
