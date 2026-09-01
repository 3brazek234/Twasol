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

    const key = `rate_limit:direct_inquiry:${posterId}`;
    const currentInquiries = await cache.incr(key);
    
    if (currentInquiries === 1) {
      await cache.expire(key, 24 * 60 * 60);
    }

    if (currentInquiries > 15) {
      throw AppError.tooManyRequests('You have reached the maximum number of direct inquiries (15) for a 24-hour period.');
    }

    const lawyer = await prisma.user.findFirst({
      where: { id: lawyerId, role: 'LAWYER', verificationStatus: 'APPROVED' }
    });

    if (!lawyer) {
      throw AppError.badRequest('Target user is not an approved lawyer');
    }

    const conversation = await ChatConversationsService.getOrCreateConversation(null as any, posterId, lawyerId);

    await auditLog(
      prisma as any,
      posterId,
      'conversation.direct_inquiry_created',
      'Conversation',
      conversation.id,
      null,
      { targetLawyerId: lawyerId }
    );

    return conversation;
  }

  static async convertDirectInquiryToJob(
    conversationId: string,
    posterId: string,
    data: { title: string; description: string; courtIds: string[]; salaryMin?: number; salaryMax?: number; }
  ) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });

    if (!conversation) {
      throw AppError.notFound('Conversation');
    }

    const isParticipant = conversation.participants.some(p => p.userId === posterId);
    if (!isParticipant) {
      throw AppError.forbidden('You are not a participant in this conversation');
    }

    const targetLawyer = conversation.participants.find(p => p.userId !== posterId);
    if (!targetLawyer) {
      throw AppError.badRequest('Conversation does not have a valid target lawyer');
    }

    return prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          title: data.title,
          description: data.description,
          postedByUserId: posterId,
          assignedLawyerId: targetLawyer.userId,
          status: 'AGREED',
          salaryMin: data.salaryMin,
          salaryMax: data.salaryMax,
          courts: {
            create: data.courtIds.map((courtId) => ({ courtId }))
          }
        }
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          type: 'JOB',
          jobId: job.id
        }
      });

      await auditLog(
        tx as any,
        posterId,
        'job.created_from_inquiry',
        'Job',
        job.id,
        null,
        { conversationId, assignedLawyerId: targetLawyer.userId }
      );

      return job;
    });
  }
}
