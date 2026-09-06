// src/common/errors/AppError.ts

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: string, statusCode: number, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  // ── Factory methods for common errors ──────────────────────────────

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError('BAD_REQUEST', 400, message, details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError('UNAUTHORIZED', 401, message);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError('FORBIDDEN', 403, message);
  }

  static notFound(resource = 'Resource'): AppError {
    return new AppError('NOT_FOUND', 404, `${resource} not found`);
  }

  static conflict(message: string): AppError {
    return new AppError('CONFLICT', 409, message);
  }

  static validation(details: unknown): AppError {
    return new AppError('VALIDATION_ERROR', 422, 'Validation failed', details);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError('INTERNAL_ERROR', 500, message);
  }

  static tooManyRequests(message = 'Too many requests'): AppError {
    return new AppError('TOO_MANY_REQUESTS', 429, message);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable'): AppError {
    return new AppError('SERVICE_UNAVAILABLE', 503, message);
  }
}
