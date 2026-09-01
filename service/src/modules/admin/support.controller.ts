import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { z } from 'zod';
import { AppError } from '../../common/errors/AppError';
import { io } from '../../server';
import { paginate, paginationQuerySchema } from '../../common/schemas/pagination.schema';
import { SupportStatus } from '@prisma/client';

const listSupportQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['OPEN', 'RESOLVED']).optional().default('OPEN'),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
});

export class AdminSupportController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status } = listSupportQuerySchema.parse(req.query);

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
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        }),
      ]);

      res.json(paginate(conversations, total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.id;
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId, type: 'SUPPORT' },
      });

      if (!conversation) {
        throw AppError.notFound('Support conversation');
      }

      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, fullName: true, role: true } } },
      });

      res.json(messages);
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.id;
      const { content } = sendMessageSchema.parse(req.body);
      const adminId = req.user!.userId;

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId, type: 'SUPPORT' },
        include: { participants: true },
      });

      if (!conversation) {
        throw AppError.notFound('Support conversation');
      }

      // Auto-claim conversation if not already claimed by an admin
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
        data: {
          conversationId,
          senderId: adminId,
          content,
          type: 'TEXT',
        },
        include: {
          sender: { select: { id: true, fullName: true, role: true } },
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Emit to participants
      io.to(`conversation:${conversationId}`).emit('message:receive', message);
      
      // Notify admins of new message in support
      io.to('admins').emit('admin:new_support_message', {
        conversationId,
        message,
      });

      const lawyerParticipant = conversation.participants.find(p => p.userId !== adminId);
      if (lawyerParticipant) {
        io.to(`user:${lawyerParticipant.userId}`).emit('notification:new', {
          type: 'NEW_MESSAGE',
          messageId: message.id
        });
      }

      res.json(message);
    } catch (error) {
      next(error);
    }
  }

  static async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationId = req.params.id;

      let adminName = 'Admin';
      const adminUser = await prisma.user.findUnique({ where: { id: req.user!.userId } });
      if (adminUser) {
        adminName = adminUser.fullName;
      }

      const conversation = await prisma.conversation.update({
        where: { id: conversationId, type: 'SUPPORT' },
        data: { supportStatus: 'RESOLVED' },
      });

      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: req.user!.userId,
          content: `This support request was marked resolved by ${adminName}.`,
          type: 'SYSTEM',
        },
      });

      io.to(`conversation:${conversationId}`).emit('message:receive', message);

      res.json(conversation);
    } catch (error) {
      if ((error as any).code === 'P2025') {
        next(AppError.notFound('Support conversation'));
      } else {
        next(error);
      }
    }
  }
}
