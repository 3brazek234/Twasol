import crypto from 'crypto';
import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { sendEmail, buildOtpEmailHtml } from '../../common/utils/email';
import { hashPassword } from '../../common/utils/password';
import { signAccessToken, verifyAccessToken } from '../../common/utils/jwt';

export class PasswordResetService {
  /**
   * Request a password reset OTP for a given email.
   * Silently returns even if email doesn't exist to prevent enumeration.
   */
  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, googleId: true }
    });

    if (!user) return; // Silently return

    if (user.googleId) {
      // Send Google specific email
      const html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; padding: 20px;">
          <h2>وكيل — منصة التوكيل القانوني</h2>
          <p>أنت مسجل بواسطة حساب Google، يرجى تسجيل الدخول بواسطة Google مباشرةً.</p>
        </div>
      `;
      await sendEmail({ to: email, subject: 'إعادة تعيين كلمة المرور', html });
      return;
    }

    // Invalidate existing unused tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() }
    });

    // Generate random 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedOtp,
        expiresAt,
      }
    });

    // Send OTP via email
    await sendEmail({
      to: email,
      subject: 'رمز إعادة تعيين كلمة المرور',
      html: buildOtpEmailHtml(otp)
    });
  }

  /**
   * Verifies the OTP and issues a short-lived reset token.
   */
  static async verifyOtp(email: string, otp: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!user) {
      throw AppError.badRequest('الرمز غير صحيح أو انتهت صلاحيته', 'INVALID_OR_EXPIRED_OTP');
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        token: hashedOtp,
        usedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (!tokenRecord) {
      throw AppError.badRequest('الرمز غير صحيح أو انتهت صلاحيته', 'INVALID_OR_EXPIRED_OTP');
    }

    // Mark as used
    await prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() }
    });

    // Issue short-lived JWT (15 mins) with purpose: 'password_reset'
    // Re-using signAccessToken logic but overriding purpose
    const jwt = require('jsonwebtoken');
    const { env } = require('../../env');
    
    // We sign it directly to avoid standard TokenPayload casting issues if preferredLocale is missing
    const resetToken = jwt.sign(
      { sub: user.id, purpose: 'password_reset' },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return { resetToken };
  }

  /**
   * Resets the password using the reset token.
   * Increments tokenVersion to invalidate existing sessions.
   */
  static async resetPassword(resetToken: string, newPassword: string) {
    const jwt = require('jsonwebtoken');
    const { env } = require('../../env');

    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, env.JWT_SECRET);
    } catch {
      throw AppError.unauthorized('رمز إعادة التعيين غير صالح');
    }

    if (decoded.purpose !== 'password_reset' || !decoded.sub) {
      throw AppError.unauthorized('رمز إعادة التعيين غير صالح');
    }

    const userId = decoded.sub;

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { 
        passwordHash: newPasswordHash,
        tokenVersion: { increment: 1 } // Invalidate existing refresh tokens
      }
    });
  }
}
