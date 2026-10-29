import { prisma } from '../../prisma';

export class ChatConversationsService {
  static async getOrCreateDirectInquiryConversation(userId1: string, userId2: string) {
    const [sortedU1, sortedU2] = [userId1, userId2].sort();
    const lockKey = `direct_inquiry:${sortedU1}:${sortedU2}`;

    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const candidates = await tx.conversation.findMany({
        where: {
          type: 'DIRECT_INQUIRY',
          jobId: null,
          AND: [
            { participants: { some: { userId: userId1 } } },
            { participants: { some: { userId: userId2 } } },
          ],
        },
        include: {
          participants: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      const existing = candidates.find(
        (c) =>
          c.participants.length === 2 &&
          c.participants.some((p) => p.userId === userId1) &&
          c.participants.some((p) => p.userId === userId2)
      );

      if (existing) {
        return { conversation: existing, created: false };
      }

      const conversation = await tx.conversation.create({
        data: {
          jobId: null,
          type: 'DIRECT_INQUIRY',
          participants: {
            create: [{ userId: userId1 }, { userId: userId2 }],
          },
        },
        include: {
          participants: true,
        },
      });

      return { conversation, created: true };
    });
  }

  static async getMyConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, fullName: true, role: true, barNumber: true } } },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        job: { select: { id: true, title: true, status: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conv) => {
      const isSupport = conv.type === 'SUPPORT';
      const otherParticipant = isSupport
        ? undefined
        : conv.participants.find((p) => p.userId !== userId);
      const lastMessage = conv.messages[0];
      return {
        id: conv.id,
        type: conv.type,
        jobId: conv.jobId,
        jobTitle: conv.job?.title ?? null,
        jobStatus: conv.job?.status ?? null,
        otherPartyId: isSupport ? null : (otherParticipant?.user.id ?? null),
        otherPartyName: isSupport ? null : (otherParticipant ? otherParticipant.user.fullName : 'Unknown'),
        otherPartyBarNumber: isSupport ? null : (otherParticipant?.user.barNumber ?? null),
        lastMessage: lastMessage?.content ?? null,
        lastMessageAt: lastMessage?.createdAt ?? conv.updatedAt,
      };
    });
  }
}
