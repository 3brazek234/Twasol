// src/common/middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { AppError } from '../errors/AppError';

/**
 * JWT authentication middleware.
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches the decoded payload to req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(AppError.unauthorized('Missing or malformed authorization token'));
  }


  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    if (payload.preferredLocale) {
      req.locale = payload.preferredLocale;
    }
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired access token'));
  }
}
