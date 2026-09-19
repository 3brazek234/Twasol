import { prisma } from '../../../prisma';
import { AppError } from '../../../common/errors/AppError';
import { generateDownloadUrl } from '../../../common/utils/r2';
import { buildNotification } from '../../notifications/notification-payload';

// Reuse safe user select pattern
export const ADMIN_PENDING_USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  barNumber: true,
  barId: true,
  verificationStatus: true,
  createdAt: true,
};

export class AdminVerificationsService {
  static async listPending(page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { verificationStatus: 'PENDING' },
        orderBy: { createdAt: 'asc' }, // oldest first for fair queue
        skip,
        take: limit,
        select: ADMIN_PENDING_USER_SELECT,
      }),
      prisma.user.count({ where: { verificationStatus: 'PENDING' } })
    ]);

    return {
      data: users,
      meta: { page, limit, total }
    };
  }

  static async getDocuments(targetUserId: string, adminId: string) {
    const docs = await prisma.verificationDocument.findMany({
      where: { userId: targetUserId },
      orderBy: { submittedAt: 'desc' },
      distinct: ['documentType'],
    });

    if (docs.length === 0) {
      throw AppError.notFound('No verification documents found for this user');
    }

    // Generate signed URLs per document (300 seconds / 5 mins expiry)
    const result: Record<string, { id: string, viewUrl: string, expiresAt: string }> = {};
    const expiresAt = new Date(Date.now() + 300 * 1000).toISOString();

    for (const doc of docs) {
      const url = await generateDownloadUrl(doc.fileKey, 300);
      result[doc.documentType] = {
        id: doc.id,
        viewUrl: url,
        expiresAt
      };
    }

    // Audit log document view
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'VERIFICATION_DOCUMENTS_VIEWED',
        entityType: 'User',
        entityId: targetUserId,
        metadata: { documentsCount: docs.length }
      }
    });

    return result;
  }

  static async approve(targetUserId: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw AppError.notFound('User not found');

    if (user.verificationStatus !== 'PENDING') {
      throw AppError.badRequest('هذا المستخدم ليس في حالة انتظار التوثيق', 'NOT_PENDING_VERIFICATION');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: targetUserId },
        data: { verificationStatus: 'APPROVED' },
        select: ADMIN_PENDING_USER_SELECT,
      });

      // Also update documents status
      await tx.verificationDocument.updateMany({
        where: { userId: targetUserId },
        data: { status: 'APPROVED', reviewedBy: adminId, reviewedAt: new Date() }
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'VERIFICATION_APPROVED',
          entityType: 'User',
          entityId: targetUserId,
          metadata: { adminId }
        }
      });

      return result;
    });

    await prisma.notification.create({
      data: buildNotification({
        userId: targetUserId,
        type: 'VERIFICATION_APPROVED',
        titleAr: 'تم توثيق حسابك ✓',
        messageAr: 'تم توثيق حسابك بنجاح. يمكنك الآن استخدام جميع مزايا المنصة.',
      })
    });

    return updated;
  }

  static async reject(targetUserId: string, adminId: string, rejectionReason: string) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw AppError.notFound('User not found');

    if (user.verificationStatus !== 'PENDING') {
      throw AppError.badRequest('هذا المستخدم ليس في حالة انتظار التوثيق', 'NOT_PENDING_VERIFICATION');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: targetUserId },
        data: { 
          verificationStatus: 'REJECTED',
          verificationRejectionReason: rejectionReason 
        },
        select: ADMIN_PENDING_USER_SELECT,
      });

      await tx.verificationDocument.updateMany({
        where: { userId: targetUserId },
        data: { status: 'REJECTED', reviewedBy: adminId, reviewedAt: new Date(), reviewNotes: rejectionReason }
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'VERIFICATION_REJECTED',
          entityType: 'User',
          entityId: targetUserId,
          metadata: { reason: rejectionReason }
        }
      });

      return result;
    });

    await prisma.notification.create({
      data: buildNotification({
        userId: targetUserId,
        type: 'VERIFICATION_REJECTED',
        titleAr: 'تم رفض طلب التوثيق',
        messageAr: `تم رفض طلب التوثيق للسبب التالي: ${rejectionReason}`,
      })
    });

    return updated;
  }
}
