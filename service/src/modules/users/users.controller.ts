import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';

export class UsersController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UsersService.getProfile(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }


  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UsersService.updateProfile(req.user!.userId, req.body);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async savePushToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) throw new Error('Token is required');

      await UsersService.savePushToken(req.user!.userId, token);
      res.status(200).json({ success: true, message: 'Push token saved successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async updateAccountMode(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await UsersService.updateAccountMode(req.user!.userId, req.body.mode);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
