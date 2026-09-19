import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'crypto';
import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { signAccessToken, signRefreshToken, TokenPayload } from '../../common/utils/jwt';
import { hashPassword } from '../../common/utils/password';
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
   * Verify a Google ID token and either sign in an existing user or create
   * a new account.
   *
   * New users are created with Google's name + email and a random password
   * hash. barNumber and governorateId are left null — the mobile app's
   * CompleteProfileScreen collects those before proceeding to verification.
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

    const { email, sub: googleId, name: googleName } = payload;

    // ── Step 2: Look up existing user by email ────────────────────────────
    let user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: SAFE_USER_SELECT,
    });

    let isNewUser = false;

    if (!user) {
      // ── Step 2b: Create new user via Google ─────────────────────────────
      // Random password hash — user signs in via Google, can set a real
      // password later via ChangePasswordScreen in Settings.
      const randomPassword = randomBytes(32).toString('hex');
      const passwordHash = await hashPassword(randomPassword);

      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          fullName: googleName || email.split('@')[0],
          googleId,
          role: 'LAWYER',
          preferredLocale: 'AR',
          isActive: true,
          // barNumber and governorateId are left null —
          // collected on CompleteProfileScreen
        },
        select: SAFE_USER_SELECT,
      });

      isNewUser = true;

      // Notify admins about new signup (same as email/password register)
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true, deletedAt: null },
        select: { id: true },
      });

      if (admins.length > 0) {
        await NotificationsService.notifyManyUsers(
          admins.map(a => a.id),
          {
            type: 'NEW_USER_SIGNUP',
            titleAr: 'تسجيل مستخدم جديد',
            messageAr: `قام مستخدم جديد بالتسجيل عبر Google: ${user.fullName}`,
            data: { newUserId: user.id, fullName: user.fullName, email: user.email, role: user.role },
          }
        );
      }
    }

    // ── Step 3: Link Google ID on first sign-in + audit trail notification ─
    if (!user.googleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    // Audit notification on first-time link (both new and existing users)
    if (!user.googleId || isNewUser) {
      await NotificationsService.notifyManyUsers([user.id], {
        type: 'GOOGLE_ACCOUNT_LINKED',
        titleAr: 'ربط حساب Google',
        messageAr: 'تم ربط حساب Google بحسابك على وكيل',
        data: { googleEmail: email },
      });
    }

    // ── Step 4: Issue JWT tokens ──────────────────────────────────────────
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
