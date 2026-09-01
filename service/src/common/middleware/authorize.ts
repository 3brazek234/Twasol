// src/common/middleware/authorize.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Role-based authorization middleware factory.
 *
 * Usage:
 *   router.post('/courts', authenticate, authorize('ADMIN'), controller.create);
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    const hasAccess = allowedRoles.includes(req.user.role) || (allowedRoles.includes('ADMIN') && req.user.role === 'SUPER_ADMIN');
    if (!hasAccess) {
      return next(AppError.forbidden(`Role '${req.user.role}' is not authorized for this action`));
    }
    next();
  };
}
