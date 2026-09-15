import { PushNotificationService } from '../notifications/push.service';
import { buildNotification } from "../notifications/notification-payload";

import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { paginate } from '../../common/schemas/pagination.schema';

export class VerificationService {
    static async submitVerification(userId: string, documents: any) {
    // Always sets status to PENDING, regardless of what the client sends
    // This closes the security hole where a client could send status: "APPROVED"
    return prisma.user.update({
      where: { id: userId },
      data: { verificationStatus: "PENDING" },
    });
  }

  static async getUploadUrl(userId: string, documentType: string, contentType: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');

    const key = `verification/${userId}/${Date.now()}_${documentType}`;
    const { generateUploadUrl } = await import('../../common/utils/r2');
    const uploadUrl = await generateUploadUrl(key, contentType);

    const document = await prisma.verificationDocument.create({
      data: {
        userId,
        documentType,
        fileKey: key,
        status: 'PENDING_UPLOAD',
      },
    });

    return { uploadUrl, documentId: document.id };
  }

  static async confirmUpload(documentId: string, userId: string) {
    const document = await prisma.verificationDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) throw AppError.notFound('Document not found');
    if (document.userId !== userId) throw AppError.forbidden('Cannot confirm this document');
    if (document.status !== 'PENDING_UPLOAD') throw AppError.badRequest('Document is not pending upload');

    const { headObjectR2, deleteFromR2 } = await import('../../common/utils/r2');
    let metadata;
    try {
      metadata = await headObjectR2(document.fileKey);
    } catch (err) {
      throw AppError.badRequest('File has not been uploaded to the expected location');
    }

    // Validate size (e.g., max 10MB) and content type
    const MAX_SIZE = 10 * 1024 * 1024;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!metadata.ContentLength || metadata.ContentLength > MAX_SIZE || !metadata.ContentType || !allowedTypes.includes(metadata.ContentType)) {
      await deleteFromR2(document.fileKey);
      await prisma.verificationDocument.delete({ where: { id: documentId } });
      throw AppError.badRequest('Invalid file type or size. Max 10MB, PDF/JPEG/PNG only.');
    }

    const updatedDoc = await prisma.verificationDocument.update({
      where: { id: documentId },
      data: { status: 'PENDING' },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && (user.verificationStatus === 'UNVERIFIED' || user.verificationStatus === 'REJECTED')) {
      await prisma.user.update({
        where: { id: userId },
        data: { verificationStatus: 'PENDING' },
      });
    }

    return updatedDoc;
  }

  static async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { verificationStatus: true },
    });
    if (!user) throw AppError.notFound('User not found');

    const documents = await prisma.verificationDocument.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });

    return {
      verificationStatus: user.verificationStatus,
      documents,
    };
  }

  static async getPendingQueue({ page, limit }: { page: number; limit: number }) {
    const [documents, total] = await Promise.all([
      prisma.verificationDocument.findMany({
        where: { status: 'PENDING' },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.verificationDocument.count({ where: { status: 'PENDING' } }),
    ]);

    return paginate(documents, total, page, limit);
  }

  static async review(docId: string, adminUserId: string, { status, notes }: { status: 'APPROVED' | 'REJECTED'; notes?: string }) {
    const { auditLog } = await import('../../common/utils/audit');
    const resultDoc = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.verificationDocument.updateMany({
        where: { id: docId, status: 'PENDING' },
        data: {
          reviewedBy: adminUserId,
          reviewNotes: notes,
          reviewedAt: new Date(),
          status,
        },
      });

      if (updateResult.count === 0) {
        throw AppError.conflict('Document is not pending or does not exist');
      }

      const doc = await tx.verificationDocument.findUniqueOrThrow({
        where: { id: docId },
      });

      if (status === 'APPROVED') {
        const pendingOrRejectedCount = await tx.verificationDocument.count({
          where: { userId: doc.userId, status: { not: 'APPROVED' } },
        });

        if (pendingOrRejectedCount === 0) {
          await tx.user.update({
            where: { id: doc.userId },
            data: {
              verificationStatus: 'APPROVED',
              subscriptionStatus: 'PENDING_PAYMENT', // ← الخطوة التالية: الاشتراك
            },
          });

          await tx.notification.create({
            data: buildNotification({
              userId: doc.userId,
              type: 'VERIFICATION_APPROVED',
              titleAr: 'تم توثيق حسابك بنجاح ✅',
              messageAr: 'مبروك! تم التحقق من هويتك. يرجى إتمام الاشتراك لتفعيل حسابك والبدء في استخدام خدمات وكيل.',
              data: { nextStep: 'SUBSCRIPTION_PAYMENT' },
            }),
          });
        }
      } else if (status === 'REJECTED') {
        await tx.user.update({
          where: { id: doc.userId },
          data: { verificationStatus: 'REJECTED' },
        });

        await tx.notification.create({
          data: buildNotification({
            userId: doc.userId,
            type: 'VERIFICATION_REJECTED',
            titleAr: 'تم رفض طلب التوثيق',
            messageAr: `تم رفض طلب التوثيق${notes ? ': ' + notes : ''}. يرجى المراجعة وإعادة التقديم.`,
          }),
        });
      }

      await auditLog(
        tx as any,
        adminUserId,
        'verification.reviewed',
        'VerificationDocument',
        docId,
        { status: 'PENDING' },
        { status, notes }
      );

      return doc;
    });

    if (status === 'APPROVED') {
      await PushNotificationService.sendPushToUser(
        resultDoc.userId,
        'تم توثيق حسابك بنجاح ✅',
        'مبروك! تم التحقق من هويتك. يرجى إتمام الاشتراك لتفعيل حسابك والبدء في استخدام خدمات وكيل.',
        { nextStep: 'SUBSCRIPTION_PAYMENT' }
      ).catch(e => console.error(e));
    } else if (status === 'REJECTED') {
      await PushNotificationService.sendPushToUser(
        resultDoc.userId,
        'تم رفض طلب التوثيق',
        `تم رفض طلب التوثيق${notes ? ': ' + notes : ''}. يرجى المراجعة وإعادة التقديم.`,
        {}
      ).catch(e => console.error(e));
    }

    return resultDoc;
  }

  static async getViewUrl(documentId: string, adminUserId: string) {
    const document = await prisma.verificationDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) throw AppError.notFound('Document not found');

    const { generateDownloadUrl } = await import('../../common/utils/r2');
    const viewUrl = await generateDownloadUrl(document.fileKey, 300); // 5 mins

    const { auditLog } = await import('../../common/utils/audit');
    await auditLog(
      prisma as any,
      adminUserId,
      'verification.document_viewed',
      'VerificationDocument',
      documentId,
      null,
      null
    );

    return viewUrl;
  }
}
