// src/common/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../utils/logger';

/**
 * Centralized Express error handler.
 * Produces consistent JSON: { success: false, error: { code, message, details? } }
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn({ code: err.code, status: err.statusCode, message: err.message, details: err.details });
    const errorBody: Record<string, unknown> = {
        code: err.code,
        message: err.message,
      };
      if (err.details) errorBody.details = err.details;
      res.status(err.statusCode).json({
      success: false,
      error: errorBody,
    });
    return;
  }

  // Unexpected errors
  logger.error({ err }, 'Unhandled error');
  require('fs').appendFileSync('/tmp/err.log', err.stack + '\\n');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
}
