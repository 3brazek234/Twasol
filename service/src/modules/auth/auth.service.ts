import { NotificationsService } from "../notifications/notifications.service";

import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { hashPassword, comparePassword } from '../../common/utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken, TokenPayload } from '../../common/utils/jwt';
import { RegisterInput, LoginInput } from './auth.schema';
import { SAFE_USER_SELECT } from '../users/user-safe-fields';

export class AuthService {
  static async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw AppError.badRequest('User with this email already exists');
    }

    if (data.barNumber) {
      const existingBarNumber = await prisma.user.findUnique({
        where: { barNumber: data.barNumber }
      });
      if (existingBarNumber) {
        throw AppError.badRequest('User with this bar number already exists');
      }
    }

    const passwordHash = await hashPassword(data.password);

    // 1. Determine Default Courts (if governorate is provided)
    const userCourtsToCreate: string[] = [];
    if (data.governorateId) {
      const { appealCourtMapping } = require('../jobs/appealCourtsMap');
      const gov = await prisma.governorate.findUnique({ where: { id: data.governorateId } });
      
      if (!gov) {
        throw AppError.badRequest('Invalid governorate selected. Please refresh your app data and try again.');
      }
      
      if (gov) {
        // Add all Partial/Primary courts in this governorate
        const localCourts = await prisma.court.findMany({
          where: { governorateId: gov.id, type: { in: ['PRIMARY', 'PARTIAL'] } },
          select: { id: true }
        });
        userCourtsToCreate.push(...localCourts.map(c => c.id));
        
        // Add mapped Appeal court
        const appealName = appealCourtMapping[gov.nameEn];
        if (appealName) {
          const appealCourt = await prisma.court.findFirst({
            where: { nameEn: appealName, type: 'APPEAL' },
            select: { id: true }
          });
          if (appealCourt) {
            userCourtsToCreate.push(appealCourt.id);
          }
        }
      }
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        barNumber: data.barNumber,
        role: data.role || 'LAWYER',
        preferredLocale: data.preferredLocale || 'AR',
        isActive: true,
        governorateId: data.governorateId,
        courts: {
          create: userCourtsToCreate.map(id => ({ courtId: id, isActive: true }))
        }
      },
      select: SAFE_USER_SELECT,
    });

    const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role, preferredLocale: user.preferredLocale as 'EN' | 'AR', tokenVersion: user.tokenVersion };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Fetch admins and create notifications inline
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true, deletedAt: null },
      select: { id: true }
    });

    if (admins.length > 0) {
      const notificationPayload = { newUserId: user.id, fullName: user.fullName, email: user.email, role: user.role };
      
      await NotificationsService.notifyManyUsers(
        admins.map(a => a.id),
        {
          type: 'NEW_USER_SIGNUP',
          titleAr: 'تسجيل مستخدم جديد',
          messageAr: `قام مستخدم جديد بالتسجيل: ${user.fullName}`,
          data: notificationPayload,
        }
      );
    }

    return {
      user: {
        ...user,
        name: user.fullName
      },
      accessToken,
      refreshToken
    };
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findFirst({
      where: { 
        email: data.email,
        deletedAt: null
      },
      select: { ...SAFE_USER_SELECT, passwordHash: true },
    });

    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role, preferredLocale: user.preferredLocale as 'EN' | 'AR', tokenVersion: user.tokenVersion };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const { passwordHash: _, ...safeUser } = user;

    return {
      user: {
        ...safeUser,
        name: safeUser.fullName
      },
      accessToken,
      refreshToken
    };
  }

  static async refresh(refreshTokenStr: string) {
    try {
      const decoded = verifyRefreshToken(refreshTokenStr);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || user.deletedAt) {
        throw AppError.unauthorized('Invalid refresh token or user not found');
      }

      if (user.tokenVersion !== decoded.tokenVersion) {
        throw AppError.unauthorized('Session invalidated. Please log in again.');
      }

      const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role, preferredLocale: user.preferredLocale as 'EN' | 'AR', tokenVersion: user.tokenVersion };
      const newAccessToken = signAccessToken(payload);
      const newRefreshToken = signRefreshToken(payload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.unauthorized('Invalid refresh token');
    }
  }
}
