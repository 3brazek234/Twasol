import { SAFE_USER_SELECT } from '../users/user-safe-fields';
import { buildNotification } from '../notifications/notification-payload';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';
import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { auditLog } from '../../common/utils/audit';
import { MessageType, OfferStatus, JobStatus, MessageStatus } from '@prisma/client';
import { JobsLifecycleService } from '../jobs/jobs.lifecycle.service';

export class ChatMessagesService {
  static async sendMessage(conversationId: string, userId: string, data: { content?: string; type?: any; offerAmount?: string; attachmentUrl?: string; attachmentType?: 'IMAGE' | 'DOCUMENT'; attachmentName?: string; attachmentSize?: number; replyToId?: string; }, userRole?: string, initialStatus = 'SENT') {
    const conversation = await prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: { participants: true }
    });
    const participant = conversation.participants.find(p => p.userId === userId);
    if (!participant && !(conversation.type === 'SUPPORT' && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'))) {
      throw AppError.forbidden('User is not a participant in this conversation');
    }

    if (data.type === 'OFFER') {
      if (!data.offerAmount) {
        throw AppError.badRequest('Offer amount is required for offer messages');
      }
      if (conversation.type === 'SUPPORT') {
        throw AppError.badRequest('Offers cannot be sent in support conversations.');
      }
      if (conversation.jobId) {
        const job = await prisma.job.findUnique({ where: { id: conversation.jobId } });
        if (job?.status !== 'NEGOTIATING' && job?.status !== 'OPEN') {
          throw AppError.badRequest('Offers can only be sent when the job is OPEN or NEGOTIATING');
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: data.content || '',
          type: data.type,
          status: 'SENT',
          offerAmount: data.offerAmount ? parseFloat(data.offerAmount) : null,
          offerStatus: data.type === 'OFFER' ? OfferStatus.PENDING : null,
          attachmentUrl: data.attachmentUrl,
          attachmentType: data.attachmentType,
          attachmentName: data.attachmentName,
          attachmentSize: data.attachmentSize,
          replyToId: data.replyToId,
        },
        include: { replyTo: true }
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });
      return message;
    });

    // Handle push notifications inside REST service
    const receiver = conversation.participants.find(p => p.userId !== userId);
    if (receiver) {
      const job = conversation.jobId ? await prisma.job.findUnique({ where: { id: conversation.jobId }, select: { title: true } }) : null;
      const sender = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
      const truncatedBody = result.content && result.content.length > 80 ? result.content.slice(0, 80) + '…' : (result.content || 'رسالة جديدة');
      
      const type = data.type === 'OFFER' ? NotificationType.OFFER_RECEIVED : NotificationType.NEW_MESSAGE;
      const titleAr = data.type === 'OFFER' ? 'عرض جديد 💰' : sender?.fullName || 'رسالة جديدة';
      const messageAr = data.type === 'OFFER' ? 'لقد تلقيت عرضاً مالياً جديداً للمهمة' : truncatedBody;

      await NotificationsService.notifyManyUsers([receiver.userId], {
          type,
          titleAr,
          messageAr,
          data: { jobId: conversation.jobId, conversationId: conversation.id, messageId: result.id, jobTitle: job?.title },
      });
    }

    if (conversation.type === 'SUPPORT' && userRole === 'LAWYER') {
      const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } });
      if (admins.length > 0) {
        for (const admin of admins) {
          await NotificationsService.notifyManyUsers([admin.id], {
              type: NotificationType.NEW_MESSAGE,
              titleAr: 'رسالة دعم فني جديدة 💬',
              messageAr: 'يوجد رسالة جديدة في قسم الدعم الفني تحتاج لردك',
              data: { conversationId: conversation.id }
          });
        }
      }
    }

    return result;
  }

  static async acceptOffer(messageId: string, userId: string, ipAddress?: string) {
    const message = await prisma.message.findUniqueOrThrow({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } }
    });
    const participant = message.conversation.participants.find(p => p.userId === userId);
    if (!participant) throw AppError.forbidden('User is not a participant in this conversation');
    if (!(message.conversation.jobId as string) || message.conversation.type !== 'JOB') throw AppError.badRequest('Cannot accept an offer in a direct inquiry');

    const result = await prisma.$transaction(async (tx) => {
      const { count } = await tx.message.updateMany({
        where: { id: messageId, offerStatus: OfferStatus.PENDING },
        data: { offerStatus: OfferStatus.ACCEPTED }
      });
      if (count === 0) throw AppError.conflict('Offer is no longer pending or does not exist');

      await JobsLifecycleService.acceptOffer((message.conversation.jobId as string), message.senderId, message.offerAmount!, tx);

      await tx.message.updateMany({
        where: { conversationId: message.conversationId, type: 'OFFER', offerStatus: OfferStatus.PENDING, id: { not: messageId } },
        data: { offerStatus: OfferStatus.WITHDRAWN }
      });

      await tx.conflictDeclaration.upsert({
        where: { jobId_lawyerId: { jobId: (message.conversation.jobId as string), lawyerId: message.senderId } },
        update: { ipAddress: ipAddress || null, declaredAt: new Date() },
        create: { jobId: (message.conversation.jobId as string), lawyerId: message.senderId, ipAddress: ipAddress || null }
      });

      await auditLog(tx as any, userId, 'offer.accepted', 'Message', messageId, { offerStatus: OfferStatus.PENDING }, { offerStatus: OfferStatus.ACCEPTED, amount: message.offerAmount });

      return tx.message.findUnique({ where: { id: messageId } });
    });

    const job = await prisma.job.findUnique({ where: { id: (message.conversation.jobId as string) }, select: { title: true } });
    for (const p of message.conversation.participants) {
      if (p.userId !== userId) {
        await NotificationsService.notifyManyUsers([p.userId], {
            type: NotificationType.OFFER_ACCEPTED,
            titleAr: 'تم قبول العرض ✅',
            messageAr: `تم قبول عرضك المالي لمهمة: ${job?.title || 'غير معروف'}`,
            data: { jobId: (message.conversation.jobId as string) as string, conversationId: message.conversation.id }
        });
      }
    }
    return result;
  }

  static async rejectOffer(messageId: string, userId: string) {
    const message = await prisma.message.findUniqueOrThrow({
      where: { id: messageId },
      include: { conversation: { include: { participants: true } } }
    });
    const participant = message.conversation.participants.find(p => p.userId === userId);
    if (!participant) throw AppError.forbidden('User is not a participant in this conversation');
    if (!(message.conversation.jobId as string) || message.conversation.type !== 'JOB') throw AppError.badRequest('Cannot reject an offer in a direct inquiry');

    const result = await prisma.$transaction(async (tx) => {
      const { count } = await tx.message.updateMany({
        where: { id: messageId, offerStatus: OfferStatus.PENDING },
        data: { offerStatus: OfferStatus.REJECTED }
      });
      if (count === 0) throw AppError.conflict('Offer is no longer pending or does not exist');
      await auditLog(tx as any, userId, 'offer.rejected', 'Message', messageId, { offerStatus: OfferStatus.PENDING }, { offerStatus: OfferStatus.REJECTED });
      return tx.message.findUnique({ where: { id: messageId } });
    });

    const job = await prisma.job.findUnique({ where: { id: (message.conversation.jobId as string) }, select: { title: true } });
    for (const p of message.conversation.participants) {
      if (p.userId !== userId) {
        // Assume you have an OFFER_REJECTED enum or similar, if not just use NEW_MESSAGE
        await NotificationsService.notifyManyUsers([p.userId], {
            type: NotificationType.OFFER_REJECTED,
            titleAr: 'تم رفض العرض ❌',
            messageAr: `تم رفض العرض المالي لمهمة: ${job?.title || 'غير معروف'}`,
            data: { jobId: (message.conversation.jobId as string) as string, conversationId: message.conversation.id }
        });
      }
    }
    return result;
  }

  static async getMessages(conversationId: string, userId: string, cursor?: string, limit: number = 50) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });

    if (!participant) {
      throw AppError.forbidden('User is not a participant in this conversation');
    }

    // Since we display messages oldest first at the top (usually), we need to fetch backward from cursor
    // If no cursor, fetch the latest `limit` messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      select: {
        id: true,
        type: true,
        content: true,
        status: true,
        offerAmount: true,
        offerStatus: true,
        attachmentUrl: true,
        attachmentType: true,
        attachmentName: true,
        attachmentSize: true,
        replyToId: true,
        createdAt: true,
        senderId: true,
        conversationId: true,
        sender: { select: SAFE_USER_SELECT },
        replyTo: true,
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' }
    });

    let nextCursor: string | undefined = undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    // Return in ascending order for UI
    return {
      messages: messages.reverse(),
      nextCursor
    };
  }

  static async searchMessages(conversationId: string, userId: string, q?: string) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } }
    });
    if (!participant) throw AppError.forbidden('User is not a participant');
    if (!q || q.trim().length === 0) return [];

    return prisma.message.findMany({
      where: {
        conversationId,
        content: { contains: q, mode: 'insensitive' }
      },
      select: {
        id: true,
        type: true,
        content: true,
        status: true,
        offerAmount: true,
        offerStatus: true,
        attachmentUrl: true,
        attachmentType: true,
        attachmentName: true,
        attachmentSize: true,
        replyToId: true,
        createdAt: true,
        senderId: true,
        conversationId: true,
        sender: { select: SAFE_USER_SELECT },
        replyTo: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async markMessagesAsRead(conversationId: string, userId: string) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });

    if (!participant) {
      throw AppError.forbidden('User is not a participant in this conversation');
    }

    const { count } = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        status: { not: 'READ' }
      },
      data: {
        status: 'READ'
      }
    });

    return { updated: count };
  }

  }
