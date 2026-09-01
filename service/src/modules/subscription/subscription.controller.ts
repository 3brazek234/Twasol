import { Request, Response, NextFunction } from 'express';
import { SubscriptionService, SUBSCRIPTION_PLANS, PAYMENT_INSTRUCTIONS } from './subscription.service';
import { AppError } from '../../common/errors/AppError';

export class SubscriptionController {

  // GET /api/subscription/plans
  // عرض خطط الاشتراك المتاحة مع تعليمات الدفع
  static async getPlans(_req: Request, res: Response) {
    res.json({
      success: true,
      message: 'تم جلب خطط الاشتراك وتعليمات الدفع بنجاح',
      data: {
        plans: SUBSCRIPTION_PLANS,
        paymentInstructions: PAYMENT_INSTRUCTIONS,
      },
    });
  }

  // GET /api/subscription/status
  // حالة اشتراك المحامي الحالية
  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await SubscriptionService.getStatus(req.user!.userId);

      const statusMessages: Record<string, string> = {
        PENDING_PAYMENT: 'تم توثيق حسابك. يرجى إتمام الاشتراك لتفعيل حسابك والوصول إلى جميع الخدمات.',
        ACTIVE:          'حسابك نشط. يمكنك الاستفادة من جميع خدمات وكيل.',
        EXPIRED:         'انتهت صلاحية اشتراكك. يرجى تجديد الاشتراك للاستمرار.',
        SUSPENDED:       'تم إيقاف اشتراكك. يرجى التواصل مع الدعم للمزيد من المعلومات.',
        NOT_REQUIRED:    'لا يلزمك اشتراك.',
      };

      res.json({
        success: true,
        message: statusMessages[data.subscriptionStatus] ?? 'حالة الاشتراك غير معروفة',
        data,
      });
    } catch (err) { next(err); }
  }

  // POST /api/subscription/receipt-upload-url
  // طلب رابط مؤقت لرفع صورة الإيصال إلى R2
  static async getReceiptUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { contentType } = req.body;
      if (!contentType) throw AppError.badRequest('يجب تحديد نوع الملف (contentType)');

      const result = await SubscriptionService.getReceiptUploadUrl(req.user!.userId, contentType);
      res.json({
        success: true,
        message: 'تم إنشاء رابط رفع الإيصال. الرابط صالح لمدة 15 دقيقة.',
        data: result,
      });
    } catch (err) { next(err); }
  }

  // POST /api/subscription/submit
  // تقديم طلب الاشتراك مع إيصال الدفع
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId, paymentMethod, receiptFileKey, senderNumber } = req.body;

      if (!planId) throw AppError.badRequest('يجب تحديد خطة الاشتراك');
      if (!paymentMethod) throw AppError.badRequest('يجب تحديد طريقة الدفع');

      const validMethods = ['MANUAL_BANK_TRANSFER', 'MANUAL_VODAFONE_CASH', 'MANUAL_CASH'];
      if (!validMethods.includes(paymentMethod)) {
        throw AppError.badRequest('طريقة الدفع غير صالحة. الطرق المتاحة: تحويل بنكي، فودافون كاش، أو نقدي');
      }

      const result = await SubscriptionService.submitPayment(req.user!.userId, {
        planId,
        paymentMethod,
        receiptFileKey,
        senderNumber,
      });

      res.status(201).json({
        success: true,
        message: 'تم استلام طلب الاشتراك بنجاح وهو قيد المراجعة. سيتم إشعارك عند الانتهاء من المراجعة (عادةً خلال 24 ساعة).',
        data: {
          paymentId: result.payment.id,
          status: result.payment.status,
          plan: { nameAr: result.plan.nameAr, durationMonths: result.plan.durationMonths },
          submittedAt: result.payment.createdAt,
        },
      });
    } catch (err) { next(err); }
  }
}

// ─── Admin Controller ──────────────────────────────────────────────────────────
export class AdminSubscriptionController {

  // GET /api/admin/subscription/payments?status=PENDING
  static async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const status = req.query.status as string | undefined;

      const result = await SubscriptionService.getPendingPayments({ page, limit, status });
      res.json({
        success: true,
        message: 'تم جلب قائمة طلبات الاشتراك',
        data: result.data,
        meta: result.meta,
      });
    } catch (err) { next(err); }
  }

  // GET /api/admin/subscription/payments/:id/receipt
  static async getReceiptUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SubscriptionService.getReceiptViewUrl(req.params.id);
      res.json({
        success: true,
        message: 'تم إنشاء رابط عرض الإيصال. صالح لمدة 5 دقائق.',
        data: result,
      });
    } catch (err) { next(err); }
  }

  // PATCH /api/admin/subscription/payments/:id/approve
  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SubscriptionService.approvePayment(
        req.params.id,
        req.user!.userId,
        req.body.notes,
      );
      res.json({
        success: true,
        message: 'تم قبول إيصال الدفع وتفعيل حساب المحامي بنجاح.',
        data: result,
      });
    } catch (err) { next(err); }
  }

  // PATCH /api/admin/subscription/payments/:id/reject
  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { notes } = req.body;
      const result = await SubscriptionService.rejectPayment(req.params.id, req.user!.userId, notes);
      res.json({
        success: true,
        message: 'تم رفض إيصال الدفع وإشعار المحامي بسبب الرفض.',
        data: result,
      });
    } catch (err) { next(err); }
  }

  // POST /api/admin/subscription/manual-grant
  static async manualGrant(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, planId, notes } = req.body;
      if (!userId || !planId) throw AppError.badRequest('يجب تحديد معرف المستخدم وخطة الاشتراك');

      const result = await SubscriptionService.manualGrant(
        userId,
        req.user!.userId,
        planId,
        notes ?? 'منح يدوي بدون ملاحظات',
      );
      res.json({
        success: true,
        message: 'تم تفعيل الاشتراك يدوياً وإشعار المحامي بذلك.',
        data: result,
      });
    } catch (err) { next(err); }
  }
}
