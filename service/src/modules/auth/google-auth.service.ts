import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { signAccessToken, signRefreshToken, TokenPayload } from '../../common/utils/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { SAFE_USER_SELECT } from '../users/user-safe-fields';
import { env } from '../../env';

const client = new OAuth2Client();

// All three client IDs are valid audiences — the ID token's `aud`
// claim will match whichever platform the user signed in from.
const GOOGLE_CLIENT_IDS = [
  env.GOOGLE_WEB_CLIENT_ID,
  env.GOOGLE_IOS_CLIENT_ID,
  env.GOOGLE_ANDROID_CLIENT_ID,
].filter(Boolean) as string[];

export class GoogleAuthService {
  /**
   * Verify a Google ID token and sign the user in using the existing JWT system.
   *
   * Verification is FREE — google-auth-library fetches and caches Google's
   * public keys locally. No per-call API cost, no external rate limit.
   *
   * Option A (confirmed): Login-only. If no Wakeel account exists for this
   * email, the user is directed to register via the normal flow first.
   */
  static async verifyAndSignInWithGoogle(idToken: string) {
    if (GOOGLE_CLIENT_IDS.length === 0) {
      throw AppError.internal('Google Sign-In is not configured on this server');
    }

    // ── Step 1: Verify the ID token against Google's public keys ──────────
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_IDS,
      });
      payload = ticket.getPayload();
    } catch {
      throw AppError.unauthorized(
        'فشل التحقق من حساب Google. يرجى المحاولة مرة أخرى.'
      );
    }

    if (!payload || !payload.email || !payload.email_verified) {
      throw AppError.unauthorized(
        'البريد الإلكتروني في حساب Google غير مُوثّق.'
      );
    }

    const { email, sub: googleId } = payload;

    // ── Step 2: Look up existing user by email (using safe select to fail closed)
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: SAFE_USER_SELECT,
    });

    if (!user) {
      // Option A: Login-only — no auto-registration via Google.
      // notFound() appends " not found" so we use unauthorized for a cleaner message.
      throw AppError.unauthorized(
        'لا يوجد حساب مرتبط بهذا البريد الإلكتروني. يرجى إنشاء حساب أولاً ثم استخدام تسجيل الدخول بواسطة Google.'
      );
    }

    // ── Step 3: Link Google ID on first sign-in + audit trail notification ─
    if (!user.googleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });

      // In-app notification + push (if push tokens present on the user record)
      await NotificationsService.notifyManyUsers([user.id], {
        type: 'GOOGLE_ACCOUNT_LINKED',
        titleAr: 'ربط حساب Google',
        messageAr: 'تم ربط حساب Google بحسابك على وكيل',
        data: { googleEmail: email },
      });
    }

    // ── Step 4: Issue JWT tokens (same flow as email/password login) ───────
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      preferredLocale: user.preferredLocale as 'EN' | 'AR',
    };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return {
      user: {
        ...user,
        name: user.fullName,
      },
      accessToken,
      refreshToken,
    };
  }
}
