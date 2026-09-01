import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { prisma } from '../../prisma';

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
        isActive: true,
        verificationStatus: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      throw AppError.unauthorized('المستخدم غير موجود.');
    }

    // If fully active, proceed
    if (user.isActive) {
      return next();
    }

    // Determine the exact reason for being inactive and return a specific Arabic error
    
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

    // 2. Subscription Issues (assuming verification is APPROVED at this point)
    if (user.verificationStatus === 'APPROVED') {
      if (user.subscriptionStatus === 'PENDING_PAYMENT') {
        throw AppError.forbidden('حسابك موثق. يرجى رفع إيصال الدفع لتفعيل الحساب واستخدام التطبيق.');
      }
      
      if (user.subscriptionStatus === 'EXPIRED') {
        throw AppError.forbidden('انتهت صلاحية اشتراكك. يرجى تجديد الباقة للوصول إلى هذه الخدمة.');
      }
      
      if (user.subscriptionStatus === 'SUSPENDED') {
        throw AppError.forbidden('تم إيقاف اشتراكك مؤقتاً. يرجى التواصل مع الدعم الفني.');
      }
    }

    // Fallback if isActive is false for some other reason (e.g. manually deactivated)
    throw AppError.forbidden('حسابك غير نشط حالياً. يرجى التواصل مع الدعم الفني.');

  } catch (error) {
    next(error);
  }
}
