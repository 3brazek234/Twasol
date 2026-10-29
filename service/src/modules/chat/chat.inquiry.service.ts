import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { cache } from '../../common/utils/cache';
import { auditLog } from '../../common/utils/audit';
import { ChatConversationsService } from './chat.conversations.service';

export class ChatInquiryService {
  static async createDirectInquiry(posterId: string, lawyerId: string) {
    if (posterId === lawyerId) {
      throw AppError.badRequest('Cannot message yourself');
    }

    const lawyer = await prisma.user.findFirst({
      where: { id: lawyerId, role: 'LAWYER', verificationStatus: 'APPROVED' }
    });

    if (!lawyer) {
      throw AppError.badRequest('Target user is not an approved lawyer');
    }

    const key = `rate_limit:direct_inquiry:${posterId}`;
    const existingCountStr = await cache.get(key);
    const existingCount = existingCountStr ? parseInt(existingCountStr, 10) : 0;
    if (existingCount >= 15) {
      const candidates = await prisma.conversation.findMany({
        where: {
          type: 'DIRECT_INQUIRY',
          jobId: null,
          AND: [
            { participants: { some: { userId: posterId } } },
            { participants: { some: { userId: lawyerId } } },
          ],
        },
        include: { participants: true },
        orderBy: { createdAt: 'asc' },
      });
      const existing = candidates.find((c) => c.participants.length === 2);
      if (!existing) {
        throw AppError.tooManyRequests('You have reached the maximum number of direct inquiries (15) for a 24-hour period.');
      }
      return existing;
    }

    const { conversation, created } = await ChatConversationsService.getOrCreateDirectInquiryConversation(posterId, lawyerId);

    if (created) {
      const currentInquiries = await cache.incr(key);
      if (currentInquiries === 1) {
        await cache.expire(key, 24 * 60 * 60);
      }

      await auditLog(
        prisma as any,
        posterId,
        'conversation.direct_inquiry_created',
        'Conversation',
        conversation.id,
        null,
        { targetLawyerId: lawyerId }
      );
    }

    return conversation;
  }
}

