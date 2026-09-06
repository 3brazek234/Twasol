import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getOverview();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getBadges(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getBadges();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
