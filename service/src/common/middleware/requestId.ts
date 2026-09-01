import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * Assigns a unique request ID (from x-request-id header or generated).
 * Attaches requestId to req and creates a child logger.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || uuidv4();
  req.requestId = id;
  res.setHeader('x-request-id', id);

  // Create a child logger with request context
  req.log = logger.child({
    requestId: id,
    method: req.method,
    url: req.originalUrl,
  });

  next();
}
