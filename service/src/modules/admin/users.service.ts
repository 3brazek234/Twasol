import { buildNotification } from "../notifications/notification-payload";

import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { auditLog } from '../../common/utils/audit';
import { paginate } from '../../common/schemas/pagination.schema';
import { Prisma } from '@prisma/client';

export class AdminUsersService {
  static async list({ page, limit, role, status, verificationStatus, search }: {
    page: number;
    limit: number;
    role?: string;
    status?: string;
    verificationStatus?: string;
    search?: string;
  }) {
    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role as any;
    }
    if (status) {
      where.isActive = status === 'ACTIVE';
    }
    if (verificationStatus) {
      where.verificationStatus = verificationStatus as any;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          verificationStatus: true,
          createdAt: true,
          isOnline: true,
        },
      }),
    ]);

    return paginate(users, total, page, limit);
  }

  static async deactivate(userId: string, adminId: string, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User');
    if (user.role === 'SUPER_ADMIN') throw AppError.forbidden('Cannot deactivate a SUPER_ADMIN');

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { isActive: false }
      });
      await auditLog(
        tx as any,
        adminId,
        'user.deactivated',
        'User',
        userId,
        { isActive: user.isActive },
        { isActive: false, reason }
      );
      return updated;
    });

    return result;
  }

  static async activate(userId: string, adminId: string, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User');

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { isActive: true }
      });
      await auditLog(
        tx as any,
        adminId,
        'user.activated',
        'User',
        userId,
        { isActive: user.isActive },
        { isActive: true, reason }
      );
      return updated;
    });

    return result;
  }

  static async overrideVerification(userId: string, adminId: string, status: 'APPROVED' | 'REJECTED', justification: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User');

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { verificationStatus: status }
      });
      await auditLog(
        tx as any,
        adminId,
        'user.verification_overridden',
        'User',
        userId,
        { verificationStatus: user.verificationStatus },
        { verificationStatus: status, justification }
      );
      
      if (status === 'APPROVED') {
        await tx.notification.create({
          data: buildNotification({
            userId,
            type: 'VERIFICATION_APPROVED',
            titleAr: 'تم توثيق حسابك بنجاح ✅',
            messageAr: 'مبروك! تم التحقق من هويتك.',
          }),
        });
      } else if (status === 'REJECTED') {
        await tx.notification.create({
          data: buildNotification({
            userId,
            type: 'VERIFICATION_REJECTED',
            titleAr: 'عذراً، لم يتم توثيق حسابك ❌',
            messageAr: 'يرجى مراجعة ملاحظات الإدارة وإعادة المحاولة.',
          }),
        });
      }

      return updated;
    });

    return result;
  }
}
