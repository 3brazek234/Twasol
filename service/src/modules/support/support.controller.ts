import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';

export class SupportController {
  static async createConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      // Check if there is already an OPEN support conversation for this user
      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'SUPPORT',
          supportStatus: 'OPEN',
          participants: {
            some: {
              userId: userId
            }
          }
        },
        include: {
          participants: true
        }
      });

      if (existing) {
        res.json({ success: true, data: existing });
        return;
      }

      // Create a new support conversation with only the lawyer as a participant
      const conversation = await prisma.conversation.create({
        data: {
          type: 'SUPPORT',
          supportStatus: 'OPEN',
          participants: {
            create: [
              { userId }
            ]
          }
        },
        include: {
          participants: true
        }
      });

      res.status(201).json({ success: true, data: conversation });
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
