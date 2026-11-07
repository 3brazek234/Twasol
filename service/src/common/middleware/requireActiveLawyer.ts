import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { prisma } from '../../prisma';
import { canUseApp } from '../utils/subscription-access';

export async function requireActiveLawyer(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw AppError.unauthorized('غير مصرح لك بالوصول. يرجى تسجيل الدخول.');
    }

    // Admins bypass this check entirely
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // We need fresh user data from DB to check exact statuses
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        deletedAt: true,
        suspendedAt: true,
        verificationStatus: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      throw AppError.unauthorized('المستخدم غير موجود.');
    }

    if (!canUseApp(user)) {
      throw AppError.forbidden('حسابك موقوف حالياً. يرجى التواصل مع الدعم الفني.');
    }

    // 1. Verification Issues
    if (user.verificationStatus === 'UNVERIFIED' || user.verificationStatus === 'PENDING_UPLOAD') {
      throw AppError.forbidden('حسابك غير موثق. يرجى رفع صورة الكارنيه.');
    }

    if (user.verificationStatus === 'PENDING') {
      throw AppError.forbidden('حسابك قيد المراجعة. يرجى الانتظار حتى توثيق الكارنيه من الإدارة.');
    }

    if (user.verificationStatus === 'REJECTED') {
      throw AppError.forbidden('تم رفض وثيقة الهوية الخاصة بك. يرجى إعادة رفع مستندات صحيحة.');
    }

    if (user.verificationStatus === 'APPROVED') {
      return next();
    }

    throw AppError.forbidden('حسابك غير نشط حالياً. يرجى التواصل مع الدعم الفني.');
  } catch (error) {
    next(error);
  }
}

