import { Request, Response, NextFunction } from 'express';
import { AdminVerificationsService } from './admin-verifications.service';

export class AdminVerificationsController {
  static async listPending(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      
      const result = await AdminVerificationsService.listPending(page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adminId = req.user!.userId;
      
      const data = await AdminVerificationsService.getDocuments(userId, adminId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adminId = req.user!.userId;
      
      const data = await AdminVerificationsService.approve(userId, adminId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const adminId = req.user!.userId;
      const { rejectionReason } = req.body;
      
      const data = await AdminVerificationsService.reject(userId, adminId, rejectionReason);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
