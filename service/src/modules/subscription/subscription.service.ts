import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { paginate } from '../../common/schemas/pagination.schema';
import { generateUploadUrl, generateDownloadUrl, deleteFromR2 } from '../../common/utils/r2';

// ─── خطط الاشتراك المتاحة ──────────────────────────────────────────────────────
export const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    nameAr: 'اشتراك شهري',
    nameEn: 'Monthly',
    durationMonths: 1,
    amountPiasters: 19900,   // 199 جنيه
    currency: 'EGP',
    badge: null,
  },
  {
    id: 'annual',
    nameAr: 'اشتراك سنوي',
    nameEn: 'Annual',
    durationMonths: 12,
    amountPiasters: 149900,  // 1,499 جنيه (وفر 37%)
    currency: 'EGP',
    badge: 'الأوفر',
  },
] as const;

// ─── بيانات الحساب البنكي وفودافون كاش ─────────────────────────────────────────
export const PAYMENT_INSTRUCTIONS = {
  MANUAL_BANK_TRANSFER: {
    bankName: 'بنك مصر',
    accountName: 'وكيل للخدمات القانونية',
    accountNumber: '1234567890123',
    iban: 'EG123456789012345678901234',
  },
  MANUAL_VODAFONE_CASH: {
    phoneNumber: '01001234567',
    accountName: 'وكيل للخدمات القانونية',
  },
  MANUAL_CASH: {
    address: 'القاهرة، مصر الجديدة، شارع عبد العزيز فهمي',
    workingHours: 'الأحد – الخميس: 9 صباحاً – 5 مساءً',
  },
};

export class SubscriptionService {

  // ─── التحقق من أحقية المحامي بالاشتراك ─────────────────────────────────────
  static async assertCanSubscribe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { verificationStatus: true, subscriptionStatus: true, role: true },
    });
    if (!user) throw AppError.notFound('المستخدم غير موجود');

    if (user.role !== 'LAWYER') {
      throw AppError.forbidden('الاشتراك متاح للمحامين فقط');
    }
    if (user.verificationStatus !== 'APPROVED') {
      throw AppError.forbidden('يجب إتمام توثيق حسابك أولاً قبل الاشتراك');
    }
    if (user.subscriptionStatus === 'ACTIVE') {
      throw AppError.conflict('حسابك نشط بالفعل، لا داعي للاشتراك مجدداً في الوقت الحالي');
    }
    return user;
  }

  // ─── حالة الاشتراك الحالية ──────────────────────────────────────────────────
  static async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        verificationStatus: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        isActive: true,
        barId: true,
      },
    });
    if (!user) throw AppError.notFound('المستخدم غير موجود');

    const pendingPayment = await prisma.subscriptionPayment.findFirst({
      where: { userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, paymentMethod: true, createdAt: true },
    });

    return { ...user, pendingPayment };
  }

  // ─── طلب رابط رفع الإيصال ──────────────────────────────────────────────────
  static async getReceiptUploadUrl(userId: string, contentType: string) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(contentType)) {
      throw AppError.badRequest('نوع الملف غير مدعوم. الأنواع المقبولة: صورة (JPEG/PNG) أو ملف PDF');
    }

    const key = `subscription-receipts/${userId}/${Date.now()}`;
    const uploadUrl = await generateUploadUrl(key, contentType);
    return { uploadUrl, fileKey: key };
  }

  // ─── تقديم طلب اشتراك مع إيصال الدفع ──────────────────────────────────────
  static async submitPayment(
    userId: string,
    {
      planId,
      paymentMethod,
      receiptFileKey,
      senderNumber,
    }: {
      planId: string;
      paymentMethod: 'MANUAL_BANK_TRANSFER' | 'MANUAL_VODAFONE_CASH' | 'MANUAL_CASH';
      receiptFileKey?: string;
      senderNumber?: string;
    }
  ) {
    await this.assertCanSubscribe(userId);

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) throw AppError.badRequest('خطة الاشتراك المحددة غير موجودة');

    // الدفع النقدي لا يحتاج إيصالاً رقمياً
    if (paymentMethod !== 'MANUAL_CASH' && !receiptFileKey) {
      throw AppError.badRequest('يجب رفع صورة إيصال الدفع لإتمام الطلب');
    }

    // تحقق من عدم وجود طلب معلق بالفعل
    const existing = await prisma.subscriptionPayment.findFirst({
      where: { userId, status: 'PENDING' },
    });
    if (existing) {
      throw AppError.conflict('لديك طلب اشتراك قيد المراجعة بالفعل. يرجى الانتظار حتى يتم مراجعته من فريق الإدارة.');
    }

    const payment = await prisma.subscriptionPayment.create({
      data: {
        userId,
        amountPiasters: plan.amountPiasters,
        currency: plan.currency,
        paymentMethod,
        durationMonths: plan.durationMonths,
        status: 'PENDING',
        receiptFileKey: receiptFileKey ?? null,
        senderNumber: senderNumber ?? null,
      },
    });

    // إشعار للمحامي بأن طلبه قيد المراجعة
    await prisma.notification.create({
      data: buildNotification({
        userId,
        type: 'SUBSCRIPTION_PAYMENT_PENDING',
        titleAr: 'تم استلام طلب الاشتراك ⏳',
        messageAr: 'تم استلام طلب الاشتراك الخاص بك وهو قيد المراجعة من فريق الإدارة. سيتم إشعارك فور الانتهاء من المراجعة.',
        data: { paymentId: payment.id },
      })
    });

    // إشعار للأدمن عبر الـ socket
    const { io } = await import('../../server');
    io.to('admins').emit('admin:new_subscription_request', {
      paymentId: payment.id,
      userId,
      plan: { nameAr: plan.nameAr, durationMonths: plan.durationMonths },
    });

    return { payment, plan };
  }

  // ─── [أدمن] جلب قائمة طلبات الاشتراك ──────────────────────────────────────
  static async getPendingPayments({ page, limit, status }: { page: number; limit: number; status?: string }) {
    const where = status ? { status: status as any } : { status: { in: ['PENDING' as const] } };

    const [payments, total] = await Promise.all([
      prisma.subscriptionPayment.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, barNumber: true, barId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscriptionPayment.count({ where }),
    ]);

    return paginate(payments, total, page, limit);
  }

  // ─── [أدمن] رابط مؤقت لعرض الإيصال ────────────────────────────────────────
  static async getReceiptViewUrl(paymentId: string) {
    const payment = await prisma.subscriptionPayment.findUnique({ where: { id: paymentId } });
    if (!payment) throw AppError.notFound('طلب الاشتراك غير موجود');
    if (!payment.receiptFileKey) throw AppError.badRequest('لا يوجد إيصال مرفق بهذا الطلب');

    const url = await generateDownloadUrl(payment.receiptFileKey, 300); // 5 دقائق
    return { url };
  }

  // ─── [أدمن] قبول طلب الاشتراك وتفعيل الحساب ───────────────────────────────
  static async approvePayment(paymentId: string, adminId: string, notes?: string) {
    const payment = await prisma.subscriptionPayment.findUnique({
      where: { id: paymentId },
      include: { user: { select: { fullName: true } } },
    });
    if (!payment) throw AppError.notFound('طلب الاشتراك غير موجود');
    if (payment.status !== 'PENDING') {
      throw AppError.conflict('هذا الطلب ليس في انتظار المراجعة');
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + payment.durationMonths);

    await prisma.$transaction(async (tx) => {
      await tx.subscriptionPayment.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCESS',
          processedAt: new Date(),
          processedBy: adminId,
          notes: notes ?? null,
        },
      });

      await tx.user.update({
        where: { id: payment.userId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: expiresAt,
          isActive: true,
        },
      });

      await tx.notification.create({
        data: buildNotification({
          userId: payment.userId,
          type: 'SUBSCRIPTION_ACTIVATED',
          titleAr: 'تم تفعيل حسابك 🎉',
          messageAr: `مرحباً بك في وكيل! تم تفعيل اشتراكك بنجاح. حسابك نشط الآن ويمكنك الاستفادة من جميع الخدمات. ينتهي اشتراكك في ${expiresAt.toLocaleDateString('ar-EG')}.`,
          data: { paymentId: payment.id, expiresAt: expiresAt.toISOString() },
        })
      });
    });

    const { io } = await import('../../server');
    io.to(`user:${payment.userId}`).emit('account:activated', {
      subscriptionStatus: 'ACTIVE',
      subscriptionExpiresAt: expiresAt.toISOString(),
    });

    return { paymentId, userId: payment.userId, expiresAt };
  }

  // ─── [أدمن] رفض طلب الاشتراك ───────────────────────────────────────────────
  static async rejectPayment(paymentId: string, adminId: string, notes: string) {
    if (!notes || notes.trim().length < 5) {
      throw AppError.badRequest('يجب ذكر سبب الرفض (5 أحرف على الأقل) لإشعار المحامي');
    }

    const payment = await prisma.subscriptionPayment.findUnique({ where: { id: paymentId } });
    if (!payment) throw AppError.notFound('طلب الاشتراك غير موجود');
    if (payment.status !== 'PENDING') {
      throw AppError.conflict('هذا الطلب ليس في انتظار المراجعة');
    }

    await prisma.$transaction(async (tx) => {
      await tx.subscriptionPayment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          processedAt: new Date(),
          processedBy: adminId,
          notes,
        },
      });

      await tx.notification.create({
        data: buildNotification({
          userId: payment.userId,
          type: 'SUBSCRIPTION_REJECTED',
          titleAr: 'تم رفض إيصال الدفع ❌',
          messageAr: `تم رفض إيصال الدفع بسبب: ${notes}. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.`,
          data: { paymentId: payment.id },
        })
      });
    });

    const { io } = await import('../../server');
    io.to(`user:${payment.userId}`).emit('subscription:rejected', { reason: notes });

    return { paymentId };
  }

  // ─── [أدمن] منح اشتراك يدوي بدون إيصال ────────────────────────────────────
  static async manualGrant(userId: string, adminId: string, planId: string, notes: string) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) throw AppError.badRequest('خطة الاشتراك المحددة غير موجودة');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('المستخدم غير موجود');

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + plan.durationMonths);

    await prisma.$transaction(async (tx) => {
      await tx.subscriptionPayment.create({
        data: {
          userId,
          amountPiasters: 0,
          currency: 'EGP',
          paymentMethod: 'MANUAL_CASH',
          durationMonths: plan.durationMonths,
          status: 'SUCCESS',
          processedAt: new Date(),
          processedBy: adminId,
          notes: `منح يدوي بواسطة الإدارة. ${notes}`,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: expiresAt,
          isActive: true,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: 'SUBSCRIPTION_ACTIVATED',
          payload: {
            titleAr: 'تم تفعيل حسابك 🎉',
            messageAr: `تم تفعيل اشتراكك يدوياً من قِبل فريق الإدارة. حسابك نشط الآن حتى ${expiresAt.toLocaleDateString('ar-EG')}.`,
            expiresAt: expiresAt.toISOString(),
          },
        },
      });
    });

    const { io } = await import('../../server');
    io.to(`user:${userId}`).emit('account:activated', {
      subscriptionStatus: 'ACTIVE',
      subscriptionExpiresAt: expiresAt.toISOString(),
    });

    return { userId, expiresAt };
  }
}
