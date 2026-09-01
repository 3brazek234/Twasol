import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';

// Extend Express Request interface to include locale
declare global {
  namespace Express {
    interface Request {
      locale: 'EN' | 'AR';
    }
  }
}

export const localeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.locale = 'EN';

  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage && acceptLanguage.toLowerCase().startsWith('ar')) {
    req.locale = 'AR';
  }

  next();
};
