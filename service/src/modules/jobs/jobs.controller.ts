import { Request, Response, NextFunction } from 'express';
import { JobsService } from './jobs.service';
import { JobStatus } from '@prisma/client';

export class JobsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await JobsService.create(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, courtId, status, taskType, sortBy } = req.query as any;
      const result = await JobsService.list({ 
        page: Number(page) || 1, 
        limit: Math.min(Number(limit) || 25, 50), 
        courtId, 
        status, 
        taskType,
        sortBy,
        userId: req.user!.userId,
        role: req.user!.role,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await JobsService.getById(req.params.id);
      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  static async apply(req: Request, res: Response, next: NextFunction) {
    try {
      const { application, conversationId } = await JobsService.apply(req.params.id, req.user!.userId);
      res.json({ success: true, data: { ...application, conversationId } });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const job = await JobsService.updateStatus(req.params.id, req.user!.userId, status as JobStatus);
      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  static async getMyJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const jobs = await JobsService.getMyJobs(req.user!.userId);
      res.json({ success: true, data: jobs });
    } catch (error) {
      next(error);
    }
  }

  static async getMyActiveJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const jobs = await JobsService.getMyActiveJobs(req.user!.userId);
      res.json({ success: true, data: jobs });
    } catch (error) {
      next(error);
    }
  }

  static async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await JobsService.complete(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async translate(req: Request, res: Response, next: NextFunction) {
    try {
      const { targetLocale } = req.body;
      const result = await JobsService.translate(req.params.id, targetLocale || 'AR');
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
