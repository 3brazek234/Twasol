import { Request, Response, NextFunction } from 'express';
import { UploadsService } from './uploads.service';

export class UploadsController {
  static async getPresignedUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UploadsService.getPresignedUrl(req.user!.userId, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
