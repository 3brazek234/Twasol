import { prisma } from '../../prisma';

export class ChatConversationsService {
  static async getOrCreateConversation(jobId: string, userId1: string, userId2: string) {
    const existing = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: { in: [userId1, userId2] }
          }
        }
      },
      include: {
        participants: true
      }
    });

    if (existing && existing.participants.length === 2) {
      if (jobId && existing.jobId !== jobId) {
        return prisma.conversation.update({
          where: { id: existing.id },
          data: { jobId, type: 'JOB' },
          include: { participants: true }
        });
      }
      return existing;
    }

    return prisma.conversation.create({
      data: {
        jobId,
        type: jobId ? 'JOB' : 'DIRECT_INQUIRY',
        participants: {
          create: [
            { userId: userId1 },
            { userId: userId2 }
          ]
        }
      },
      include: {
        participants: true
      }
    });
  }

  static async getMyConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, fullName: true, role: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        job: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by other user to prevent duplicates if there are already multiple conversations in DB
    const uniqueUserConversations = new Map();

    conversations.forEach((conv) => {
      const otherParticipant = conv.participants.find((p) => p.userId !== userId);
      if (!otherParticipant) return;
      
      const otherPartyId = otherParticipant.user.id;
      const existing = uniqueUserConversations.get(otherPartyId);
      
      // Keep the one with the most recent updated time
      if (!existing || conv.updatedAt > existing.updatedAt) {
        uniqueUserConversations.set(otherPartyId, conv);
      }
    });

    return Array.from(uniqueUserConversations.values()).map((conv) => {
      const otherParticipant = conv.participants.find((p) => p.userId !== userId);
      const lastMessage = conv.messages[0];
      return {
        id: conv.id,
        type: conv.type,
        jobId: conv.jobId,
        jobTitle: conv.job?.title ?? null,
        otherPartyId: otherParticipant?.user.id ?? null,
        otherPartyName: otherParticipant ? otherParticipant.user.fullName : 'Unknown',
        lastMessage: lastMessage?.content ?? null,
        lastMessageAt: lastMessage?.createdAt ?? conv.updatedAt,
      };
    });
  }
}
