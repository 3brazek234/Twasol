import { Request, Response, NextFunction } from 'express';
import { ChatService } from './chat.service';

export class ChatController {
  static async getMyConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ChatService.getMyConversations(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const cursor = req.query.cursor as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const data = await ChatService.getMessages(req.params.id, req.user!.userId, cursor, limit);
      res.json({ success: true, data: data.messages, meta: { nextCursor: data.nextCursor } });
    } catch (error) {
      next(error);
    }
  }

  static async createDirectInquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ChatService.createDirectInquiry(req.user!.userId, req.body.lawyerId);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async convertToJob(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ChatService.convertDirectInquiryToJob(
        req.params.id,
        req.user!.userId,
        req.body
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
