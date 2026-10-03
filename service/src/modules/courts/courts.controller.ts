import { Request, Response, NextFunction } from 'express';
import { CourtsService } from './courts.service';

export class CourtsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const court = await CourtsService.create(req.body);
      res.status(201).json({ success: true, data: court });
    } catch (error) { next(error); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const court = await CourtsService.getById(req.params.id);
      res.json({ success: true, data: court });
    } catch (error) { next(error); }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, type, governorateId } = req.query as any;
      const result = await CourtsService.list({ page: Number(page) || 1, limit: Number(limit) || 100, type, governorateId });
      res.json(result);
    } catch (error) { next(error); }
  }

  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query as any;
      const results = await CourtsService.search(q);
      res.json({ success: true, data: results });
    } catch (error) { next(error); }
  }

  static async getGovernorates(req: Request, res: Response, next: NextFunction) {
    try {
      const governorates = await CourtsService.getGovernorates();
      res.json({ success: true, data: governorates });
    } catch (error) { next(error); }
  }

  static async getLawyers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query as any;
      const lawyers = await CourtsService.getLawyers(req.params.id, Number(page) || 1, Number(limit) || 20);
      res.json(lawyers); // paginated response format
    } catch (error) { next(error); }
  }

  static async getMyCourts(req: Request, res: Response, next: NextFunction) {
    try {
      const courts = await CourtsService.getMyCourts(req.user!.userId);
      res.json({ success: true, data: courts });
    } catch (error) { next(error); }
  }

  static async registerLawyer(req: Request, res: Response, next: NextFunction) {
    try {
      const { courtId } = req.body;
      const result = await CourtsService.registerLawyer(req.user!.userId, courtId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async deactivateLawyer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CourtsService.deactivateLawyer(req.user!.userId, req.params.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}
