import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../common/errors/AppError';
import { uploadToR2 } from '../../common/utils/r2';
import { VerificationService } from './verification.service';

export class VerificationController {
  static async getUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { documentType, contentType } = req.body;
      
      const data = await VerificationService.getUploadUrl(userId, documentType, contentType);
      
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  static async confirmUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { documentId } = req.params;

      const document = await VerificationService.confirmUpload(documentId, userId);
      
      res.status(200).json({ data: document });
    } catch (error) {
      next(error);
    }
  }

  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const statusData = await VerificationService.getStatus(userId);
      res.json({ data: statusData });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      
      const result = await VerificationService.getPendingQueue({ page, limit });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async review(req: Request, res: Response, next: NextFunction) {
    try {
      const docId = req.params.id;
      const adminUserId = req.user!.userId;
      const { status, notes } = req.body;
      
      const document = await VerificationService.review(docId, adminUserId, { status, notes });
      res.json({ data: document });
    } catch (error) {
      next(error);
    }
  }

  static async getViewUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentId } = req.params;
      const adminUserId = req.user!.userId;
      
      const url = await VerificationService.getViewUrl(documentId, adminUserId);
      res.json({ data: { viewUrl: url } });
    } catch (error) {
      next(error);
    }
  }
}
