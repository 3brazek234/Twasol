import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';

export class SupportController {
  static async createConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const lockKey = `support:${userId}`;

      const { conversation, created } = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

        const existing = await tx.conversation.findFirst({
          where: {
            type: 'SUPPORT',
            supportStatus: 'OPEN',
            participants: {
              some: {
                userId: userId,
              },
            },
          },
          include: {
            participants: true,
          },
        });

        if (existing) {
          return { conversation: existing, created: false };
        }

        const newConv = await tx.conversation.create({
          data: {
            type: 'SUPPORT',
            supportStatus: 'OPEN',
            participants: {
              create: [{ userId }],
            },
          },
          include: {
            participants: true,
          },
        });

        return { conversation: newConv, created: true };
      });

      res.status(created ? 201 : 200).json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }

  static async getMyConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'SUPPORT',
          participants: {
            some: {
              userId: userId
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          participants: true
        }
      });

      if (!existing) {
        throw AppError.notFound('No support conversation found');
      }

      res.json({ success: true, data: existing });
    } catch (error) {
      next(error);
    }
  }
}
