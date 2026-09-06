import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { auditLog } from '../../common/utils/audit';
import { MessageType, OfferStatus, JobStatus } from '@prisma/client';

export class ChatMessagesService {
  static async sendMessage(conversationId: string, senderId: string, data: { content: string; type: MessageType; offerAmount?: string }, userRole?: string) {
    let conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      throw AppError.notFound('Conversation');
    }

    const isParticipant = conversation.participants.some(p => p.userId === senderId);
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    if (!isParticipant) {
      if (!(conversation.type === 'SUPPORT' && isAdmin)) {
        throw AppError.forbidden('User is not a participant in this conversation');
      }
    }

    if (data.type === 'OFFER') {
      if (conversation.type === 'DIRECT_INQUIRY') {
        throw AppError.badRequest('Offers cannot be sent in direct inquiries. Please convert to a job first.');
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

    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId,
          content: data.content,
          type: data.type,
          offerAmount: data.offerAmount ? parseFloat(data.offerAmount) : null,
          offerStatus: data.type === 'OFFER' ? OfferStatus.PENDING : null,
        }
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      return message;
    });
  }

  static async acceptOffer(messageId: string, userId: string, ipAddress?: string) {
    const message = await prisma.message.findUniqueOrThrow({
      where: { id: messageId },
      include: { conversation: true }
    });

    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId: message.conversationId, userId }
      }
    });

    if (!participant) {
      throw AppError.forbidden('User is not a participant in this conversation');
    }
    if (!message.conversation.jobId || message.conversation.type !== 'JOB') {
      throw AppError.badRequest('Cannot accept an offer in a direct inquiry');
    }

    return prisma.$transaction(async (tx) => {
      const { count } = await tx.message.updateMany({
        where: { id: messageId, offerStatus: OfferStatus.PENDING },
        data: { offerStatus: OfferStatus.ACCEPTED }
      });

      if (count === 0) {
        throw AppError.conflict('Offer is no longer pending or does not exist');
      }

      const { count: jobUpdateCount } = await tx.job.updateMany({
        where: { 
          id: message.conversation.jobId!, 
          status: { in: [JobStatus.NEGOTIATING, JobStatus.OPEN] } 
        },
        data: {
          agreedSalary: message.offerAmount!,
          assignedLawyerId: message.senderId,
          status: JobStatus.AGREED,
          agreedAt: new Date()
        }
      });

      if (jobUpdateCount === 0) {
        throw AppError.conflict('Job is not in a valid state to accept offers');
      }

      // Withdraw all other pending offers in this conversation
      await tx.message.updateMany({
        where: { 
          conversationId: message.conversationId, 
          type: 'OFFER', 
          offerStatus: OfferStatus.PENDING,
          id: { not: messageId }
        },
        data: { offerStatus: OfferStatus.WITHDRAWN }
      });

      await tx.conflictDeclaration.upsert({
        where: {
          jobId_lawyerId: {
            jobId: message.conversation.jobId!,
            lawyerId: message.senderId,
          }
        },
        update: {
          ipAddress: ipAddress || null,
          declaredAt: new Date(),
        },
        create: {
          jobId: message.conversation.jobId!,
          lawyerId: message.senderId,
          ipAddress: ipAddress || null,
        }
      });

      await auditLog(
        tx as any,
        userId,
        'offer.accepted',
        'Message',
        messageId,
        { offerStatus: OfferStatus.PENDING },
        { offerStatus: OfferStatus.ACCEPTED, amount: message.offerAmount }
      );

      return tx.message.findUnique({ where: { id: messageId } });
    });
  }

  static async rejectOffer(messageId: string, userId: string) {
    const message = await prisma.message.findUniqueOrThrow({
      where: { id: messageId },
      include: { conversation: true }
    });

    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId: message.conversationId, userId }
      }
    });

    if (!participant) {
      throw AppError.forbidden('User is not a participant in this conversation');
    }
    if (!message.conversation.jobId || message.conversation.type !== 'JOB') {
      throw AppError.badRequest('Cannot reject an offer in a direct inquiry');
    }

    return prisma.$transaction(async (tx) => {
      const { count } = await tx.message.updateMany({
        where: { id: messageId, offerStatus: OfferStatus.PENDING },
        data: { offerStatus: OfferStatus.REJECTED }
      });

      if (count === 0) {
        throw AppError.conflict('Offer is no longer pending or does not exist');
      }

      await auditLog(
        tx as any,
        userId,
        'offer.rejected',
        'Message',
        messageId,
        { offerStatus: OfferStatus.PENDING },
        { offerStatus: OfferStatus.REJECTED }
      );

      return tx.message.findUnique({ where: { id: messageId } });
    });
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
}
