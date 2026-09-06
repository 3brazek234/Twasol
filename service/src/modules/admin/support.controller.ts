import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { paginationQuerySchema } from '../../common/schemas/pagination.schema';
import { AdminSupportService } from './admin-support.service';
import { io } from '../../server';

const listSupportQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['OPEN', 'RESOLVED']).optional().default('OPEN'),
});

const sendMessageBodySchema = z.object({
  content: z.string().min(1),
});

export class AdminSupportController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listSupportQuerySchema.parse(req.query);
      const result = await AdminSupportService.list(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const messages = await AdminSupportService.getMessages(req.params.id);
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { content } = sendMessageBodySchema.parse(req.body);
      const { message, conversationId, lawyerParticipantId } = await AdminSupportService.sendMessage({
        conversationId: req.params.id,
        adminId: req.user!.userId,
        content,
      });

      // Socket emissions stay in the controller — they are I/O side-effects, not business logic
      io.to(`conversation:${conversationId}`).emit('message:receive', message);
      io.to('admins').emit('admin:new_support_message', { conversationId, message });
      if (lawyerParticipantId) {
        io.to(`user:${lawyerParticipantId}`).emit('notification:new', {
          type: 'NEW_MESSAGE',
          messageId: message.id,
        });
      }

      res.json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  }

  static async resolve(req: Request, res: Response, next: NextFunction) {
    try {
      const { conversation, systemMessage, conversationId } = await AdminSupportService.resolve(
        req.params.id,
        req.user!.userId,
      );
      io.to(`conversation:${conversationId}`).emit('message:receive', systemMessage);
      res.json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }
}
