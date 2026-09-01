import { Request, Response, NextFunction } from 'express';
import { AdminUsersService } from './users.service';

export class AdminUsersController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminUsersService.list(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AdminUsersService.deactivate(req.params.id, req.user!.userId, req.body.reason);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AdminUsersService.activate(req.params.id, req.user!.userId, req.body.reason);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static async overrideVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, justification } = req.body;
      const user = await AdminUsersService.overrideVerification(req.params.id, req.user!.userId, status, justification);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}
