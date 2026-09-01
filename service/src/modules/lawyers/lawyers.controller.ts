import { Request, Response, NextFunction } from 'express';
import { LawyersService } from './lawyers.service';

export class LawyersController {
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LawyersService.search({
        courtId: req.query.courtId as string,
        minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
        q: req.query.q as string,
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
      });
      res.status(200).json({ success: true, data: result.data, meta: result.meta });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await LawyersService.getProfile(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
