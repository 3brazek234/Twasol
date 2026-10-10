import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import { CompleteProfileService } from './complete-profile.service';
import { PasswordResetService } from './password-reset.service';
import { AppError } from '../../common/errors/AppError';
import { prisma } from '../../prisma';
import { SAFE_USER_SELECT } from '../users/user-safe-fields';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }           

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      
      // If the user is an admin, they need a cookie for the dashboard
      if (result.user.role === 'ADMIN' || result.user.role === 'SUPER_ADMIN') {
        res.cookie('accessToken', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600000 // 1 hour
        });
      }
      
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.refresh(req.body.refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async googleSignIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { idToken } = req.body;
      if (!idToken || typeof idToken !== 'string') {
        throw AppError.badRequest('idToken is required');
      }

      const result = await GoogleAuthService.verifyAndSignInWithGoogle(idToken);

      // If the user is an admin, set cookie (same as login)
      if (result.user.role === 'ADMIN' || result.user.role === 'SUPER_ADMIN') {
        res.cookie('accessToken', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600000,
        });
      }

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async completeProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { barNumber, governorateId } = req.body;

      if (!barNumber || !governorateId) {
        throw AppError.badRequest('barNumber and governorateId are required');
      }

      const user = await CompleteProfileService.completeProfile(userId, {
        barNumber,
        governorateId,
      });

      res.json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: SAFE_USER_SELECT,
      });
      if (!user) throw AppError.notFound('User');
      res.json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }

  static async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      await PasswordResetService.requestPasswordReset(req.body.email);
      res.json({ success: true, data: { message: 'إذا كان البريد الإلكتروني مسجلاً، فستتلقى رمز التحقق.' } });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PasswordResetService.verifyOtp(req.body.email, req.body.otp);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await PasswordResetService.resetPassword(req.body.resetToken, req.body.newPassword);
      res.json({ success: true, data: { message: 'تم إعادة تعيين كلمة المرور بنجاح' } });
    } catch (error) {
      next(error);
    }
  }
}
