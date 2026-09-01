import { Request, Response, NextFunction } from 'express';
import { ReviewsService } from './reviews.service';

export class ReviewsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await ReviewsService.create(req.params.id, req.user!.userId, req.body);
      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }

  static async getUserReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      
      const paginatedReviews = await ReviewsService.getUserReviews(req.params.id, { page, limit });
      res.status(200).json({ success: true, data: paginatedReviews });
    } catch (error) {
      next(error);
    }
  }

  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ReviewsService.getUserStats(req.params.id);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }
}
