import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';

export class NotificationsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const { items, meta } = await NotificationsService.list(req.user!.userId, { page, limit });
      res.json({ success: true, data: items, meta });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationsService.markAsRead(req.params.id, req.user!.userId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await NotificationsService.getUnreadCount(req.user!.userId);
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }
}
