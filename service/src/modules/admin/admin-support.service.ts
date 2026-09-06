import { prisma } from '../../prisma';
import { paginate } from '../../common/schemas/pagination.schema';
import { AppError } from '../../common/errors/AppError';
import { SupportStatus } from '@prisma/client';

export interface ListSupportOptions {
  page: number;
  limit: number;
  status?: 'OPEN' | 'RESOLVED';
}

export interface SendSupportMessageOptions {
  conversationId: string;
  adminId: string;
  content: string;
}

export class AdminSupportService {
  static async list(options: ListSupportOptions) {
    const { page, limit, status = 'OPEN' } = options;
    const where = {
      type: 'SUPPORT' as const,
      supportStatus: (status === 'RESOLVED' ? 'RESOLVED' : 'OPEN') as SupportStatus,
    };

    const [total, conversations] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          assignedAdmin: { select: { id: true, fullName: true } },
          participants: {
            where: { user: { role: 'LAWYER' } },
            include: { user: { select: { id: true, fullName: true, email: true } } },
          },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
    ]);

    return paginate(conversations, total, page, limit);
  }

  static async getMessages(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId, type: 'SUPPORT' },
    });
    if (!conversation) throw AppError.notFound('Support conversation');

    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, fullName: true, role: true } } },
    });
  }

  static async sendMessage(options: SendSupportMessageOptions) {
    const { conversationId, adminId, content } = options;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId, type: 'SUPPORT' },
      include: { participants: true },
    });
    if (!conversation) throw AppError.notFound('Support conversation');

    // Auto-claim if unclaimed, or reopen if resolved
    if (!conversation.assignedAdminId) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { assignedAdminId: adminId, supportStatus: 'OPEN' },
      });
    } else if (conversation.supportStatus === 'RESOLVED') {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { supportStatus: 'OPEN' },
      });
    }

    const message = await prisma.message.create({
      data: { conversationId, senderId: adminId, content, type: 'TEXT' },
      include: { sender: { select: { id: true, fullName: true, role: true } } },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const lawyerParticipantId = conversation.participants.find(p => p.userId !== adminId)?.userId ?? null;

    return { message, conversationId, lawyerParticipantId };
  }

  static async resolve(conversationId: string, adminId: string) {
    const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
    const adminName = adminUser?.fullName ?? 'الإدارة';

    try {
      const conversation = await prisma.conversation.update({
        where: { id: conversationId, type: 'SUPPORT' },
        data: { supportStatus: 'RESOLVED' },
      });

      const systemMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId: adminId,
          content: `تم إغلاق طلب الدعم بواسطة ${adminName}.`,
          type: 'SYSTEM',
        },
      });

      return { conversation, systemMessage, conversationId };
    } catch (err: any) {
      if (err.code === 'P2025') throw AppError.notFound('Support conversation');
      throw err;
    }
  }
}
