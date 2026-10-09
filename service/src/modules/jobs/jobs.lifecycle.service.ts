import { buildNotification } from "../notifications/notification-payload";

import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { JobStatus, Prisma } from '@prisma/client';
import { auditLog } from '../../common/utils/audit';

export class JobsLifecycleService {
  private static assertValidTransition(current: JobStatus, target: JobStatus) {
    const validTransitions: Record<JobStatus, JobStatus[]> = {
      OPEN: ['NEGOTIATING', 'AGREED', 'CANCELLED', 'EXPIRED'],
      NEGOTIATING: ['OPEN', 'AGREED', 'CANCELLED', 'EXPIRED'],
      AGREED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'],
      IN_PROGRESS: ['COMPLETED', 'EXPIRED'], // COMPLETED requires poster action
      COMPLETED: [],
      CANCELLED: [],
      EXPIRED: [],
    };

    if (!validTransitions[current].includes(target)) {
      throw AppError.badRequest(`Cannot transition job from ${current} to ${target}`);
    }
  }

  private static async assertCanApply(jobId: string, lawyerId: string) {
    const user = await prisma.user.findUnique({
      where: { id: lawyerId },
      select: { isActive: true, verificationStatus: true, subscriptionExpiresAt: true },
    });

    if (!user?.isActive) throw AppError.forbidden("Account is not active");
    if (user?.verificationStatus !== "APPROVED") throw AppError.forbidden("Account must be verified to apply for jobs");

    const isActiveSub = user.subscriptionExpiresAt && user.subscriptionExpiresAt > new Date();
    if (!isActiveSub) {
      throw AppError.forbidden("يتطلب التقديم على المهام اشتراكاً فعالاً. يرجى تجديد اشتراكك.");
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw AppError.notFound("Job");

    if (job.status !== "OPEN" && job.status !== "NEGOTIATING") {
      throw AppError.badRequest("Job is not open for applications");
    }
    if (job.postedByUserId === lawyerId) {
      throw AppError.badRequest("Cannot apply to your own job");
    }

    return job;
  }

  static async declareConflict(jobId: string, lawyerId: string, ipAddress?: string) {
    const job = await JobsLifecycleService.assertCanApply(jobId, lawyerId);

    return prisma.$transaction(async (tx) => {
      const declaration = await tx.conflictDeclaration.upsert({
        where: { jobId_lawyerId: { jobId, lawyerId } },
        update: { hasConflict: true, ipAddress: ipAddress || null, declaredAt: new Date() },
        create: { jobId, lawyerId, hasConflict: true, ipAddress: ipAddress || null },
      });

      await auditLog(
        tx as any,
        lawyerId,
        "job.conflict.declared",
        "ConflictDeclaration",
        declaration.id,
        null,
        { jobId, hasConflict: true },
      );

      return declaration;
    });
  }

  static async apply(jobId: string, lawyerId: string, ipAddress: string | undefined, conflictsCheckPassed: boolean) {
    const job = await JobsLifecycleService.assertCanApply(jobId, lawyerId);
    if (!conflictsCheckPassed) throw AppError.badRequest("A conflicts check confirmation is required");

    const existingApplication = await prisma.jobApplication.findUnique({
      where: { jobId_lawyerId: { jobId, lawyerId } },
    });

    if (existingApplication) {
      const declaration = await prisma.conflictDeclaration.findUnique({
        where: { jobId_lawyerId: { jobId, lawyerId } },
      });
      if (declaration?.hasConflict) throw AppError.forbidden("A declared conflict prevents applying to this job");

      const existingConversation = await prisma.conversation.findFirst({
        where: {
          jobId,
          AND: [
            { participants: { some: { userId: job.postedByUserId } } },
            { participants: { some: { userId: lawyerId } } },
          ],
        },
      });
      return { application: existingApplication, conversationId: existingConversation?.id ?? null };
    }

    return prisma.$transaction(async (tx) => {
      const existingDeclaration = await tx.conflictDeclaration.findUnique({
        where: { jobId_lawyerId: { jobId, lawyerId } },
      });
      if (existingDeclaration?.hasConflict) {
        throw AppError.forbidden("A declared conflict prevents applying to this job");
      }

      const declaration = await tx.conflictDeclaration.upsert({
        where: { jobId_lawyerId: { jobId, lawyerId } },
        update: { hasConflict: false, ipAddress: ipAddress || null, declaredAt: new Date() },
        create: { jobId, lawyerId, hasConflict: false, ipAddress: ipAddress || null },
      });
      const application = await tx.jobApplication.create({
        data: { jobId, lawyerId, status: "PENDING" },
      });
      await auditLog(
        tx as any,
        lawyerId,
        "job.conflict_check.passed",
        "ConflictDeclaration",
        declaration.id,
        null,
        { jobId, hasConflict: false },
      );

      const existingConversation = await tx.conversation.findFirst({
        where: {
          jobId,
          AND: [
            { participants: { some: { userId: job.postedByUserId } } },
            { participants: { some: { userId: lawyerId } } },
          ],
        },
      });

      let conversation = existingConversation;
      if (!conversation) {
        conversation = await tx.conversation.create({
          data: {
            jobId,
            participants: {
              create: [{ userId: job.postedByUserId }, { userId: lawyerId }],
            },
          },
        });
      }

      return { application, conversationId: conversation.id };
    });
  }

  static async startNegotiation(jobId: string, posterId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw AppError.notFound("Job");
    if (job.postedByUserId !== posterId) throw AppError.forbidden();

    this.assertValidTransition(job.status, 'NEGOTIATING');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.job.updateMany({
        where: { id: jobId, status: job.status, version: job.version },
        data: {
          status: 'NEGOTIATING',
          negotiatingSince: new Date(),
          version: { increment: 1 }
        }
      });
      
      if (updated.count === 0) throw AppError.conflict("Job state changed, refresh and retry");

      await auditLog(tx as any, posterId, "job.start_negotiation", "Job", jobId, { status: job.status }, { status: 'NEGOTIATING' });

      return tx.job.findUnique({ where: { id: jobId } });
    });
  }

  static async fallbackToOpen(jobId: string, posterId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw AppError.notFound("Job");
    if (job.postedByUserId !== posterId) throw AppError.forbidden();

    this.assertValidTransition(job.status, 'OPEN');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.job.updateMany({
        where: { id: jobId, status: job.status, version: job.version },
        data: {
          status: 'OPEN',
          negotiatingSince: null, // reset
          version: { increment: 1 }
        }
      });

      if (updated.count === 0) throw AppError.conflict("Job state changed");

      // Optional: Auto-reject or withdraw pending offers on fallback
      await tx.message.updateMany({
        where: { conversation: { jobId }, type: 'OFFER', offerStatus: 'PENDING' },
        data: { offerStatus: 'WITHDRAWN' }
      });

      await auditLog(tx as any, posterId, "job.fallback_to_open", "Job", jobId, { status: job.status }, { status: 'OPEN' });

      return tx.job.findUnique({ where: { id: jobId } });
    });
  }

  static async startWork(jobId: string, lawyerId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw AppError.notFound("Job");
    // Only the assigned lawyer can start the work
    if (job.assignedLawyerId !== lawyerId) throw AppError.forbidden("Only the assigned lawyer can start work");

    this.assertValidTransition(job.status, 'IN_PROGRESS');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.job.updateMany({
        where: { id: jobId, status: job.status, version: job.version },
        data: { status: 'IN_PROGRESS', version: { increment: 1 } }
      });

      if (updated.count === 0) throw AppError.conflict("Job state changed");

      await auditLog(tx as any, lawyerId, "job.start_work", "Job", jobId, { status: job.status }, { status: 'IN_PROGRESS' });

      return tx.job.findUnique({ where: { id: jobId } });
    });
  }

  static async completeJob(jobId: string, posterId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { assignedLawyer: true } });
    if (!job) throw AppError.notFound("Job");
    if (job.postedByUserId !== posterId) throw AppError.forbidden("Only the poster can complete the job");

    this.assertValidTransition(job.status, 'COMPLETED');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.job.updateMany({
        where: { id: jobId, status: job.status, version: job.version },
        data: { status: 'COMPLETED', completedAt: new Date(), version: { increment: 1 } }
      });

      if (updated.count === 0) throw AppError.conflict("Job state changed");

      await auditLog(tx as any, posterId, "job.completed", "Job", jobId, { status: job.status }, { status: 'COMPLETED' });

      if (job.assignedLawyerId) {
        await tx.notification.create({
          data: buildNotification({
            userId: job.assignedLawyerId,
            type: "JOB_COMPLETED",
            titleAr: 'تم اكتمال المهمة ✅',
            messageAr: 'قام صاحب المهمة بإنهاء المهمة. شكراً لجهودك!',
            data: { jobId: job.id, jobTitle: job.title, fee: job.agreedSalary || job.salaryMax, posterId: job.postedByUserId },
          })
        });
      }

      return tx.job.findUnique({ where: { id: jobId } });
    });
  }

  static async cancelJob(jobId: string, posterId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw AppError.notFound("Job");
    if (job.postedByUserId !== posterId) throw AppError.forbidden("Only the poster can cancel the job");

    this.assertValidTransition(job.status, 'CANCELLED');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.job.updateMany({
        where: { id: jobId, status: job.status, version: job.version },
        data: { status: 'CANCELLED', cancelledAt: new Date(), version: { increment: 1 } }
      });

      if (updated.count === 0) throw AppError.conflict("Job state changed");

      await auditLog(tx as any, posterId, "job.cancelled", "Job", jobId, { status: job.status }, { status: 'CANCELLED' });

      if (job.assignedLawyerId) {
        await tx.notification.create({
          data: buildNotification({
            userId: job.assignedLawyerId,
            type: "JOB_EXPIRED_WITHDRAWN", // re-using this or making a new one
            titleAr: 'تم إلغاء المهمة',
            messageAr: `قام الموكِّل بإلغاء طلب: ${job.title}`,
            data: { jobId: job.id, jobTitle: job.title },
          })
        });
      }

      return tx.job.findUnique({ where: { id: jobId } });
    });
  }

  static async expireJob(jobId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw AppError.notFound("Job");

    this.assertValidTransition(job.status, 'EXPIRED');

    return prisma.$transaction(async (tx) => {
      const updateResult = await tx.job.updateMany({
        where: { id: jobId, status: job.status, version: job.version },
        data: { status: 'EXPIRED', expiredAt: new Date(), version: { increment: 1 } }
      });

      if (updateResult.count === 0) {
        throw AppError.conflict('Concurrency conflict during expiration');
      }

      await auditLog(tx as any, 'SYSTEM', "job.expired", "Job", jobId, { status: job.status }, { status: 'EXPIRED' });

      return tx.job.findUnique({ where: { id: jobId }, include: { court: true } });
    });
  }

  static async acceptOffer(jobId: string, lawyerId: string, agreedSalary: Prisma.Decimal | number, txClient?: any) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw AppError.notFound("Job");

    this.assertValidTransition(job.status, 'AGREED');

    // Defense in depth: the assignee must be a real lawyer and never the poster.
    // Note: every non-admin user has role LAWYER (posters too), so role alone
    // can't distinguish poster vs lawyer — the poster-id + accountMode checks do.
    const db = txClient ?? prisma;
    const lawyer = await db.user.findUnique({ where: { id: lawyerId }, select: { role: true, accountMode: true } });
    if (!lawyer || lawyerId === job.postedByUserId || lawyer.role !== 'LAWYER' || lawyer.accountMode === 'HIRING') {
      throw AppError.badRequest('المستخدم المعين ليس محامياً', { code: 'INVALID_LAWYER_ASSIGNMENT' });
    }

    const execute = async (tx: any) => {
      const updated = await tx.job.updateMany({
        where: { id: jobId, status: job.status, version: job.version },
        data: { 
          status: 'AGREED', 
          assignedLawyerId: lawyerId,
          agreedSalary,
          agreedAt: new Date(),
          version: { increment: 1 } 
        }
      });

      if (updated.count === 0) throw AppError.conflict("Job state changed");

      await auditLog(tx as any, job.postedByUserId, "job.agreed", "Job", jobId, { status: job.status }, { status: 'AGREED', assignedLawyerId: lawyerId, agreedSalary });

      return tx.job.findUnique({ where: { id: jobId } });
    };

    return txClient ? execute(txClient) : prisma.$transaction(execute);
  }

  // Support old endpoint just in case, but route to new state machine internally
  static async updateStatus(jobId: string, userId: string, newStatus: JobStatus) {
    if (newStatus === 'NEGOTIATING') return JobsLifecycleService.startNegotiation(jobId, userId);
    if (newStatus === 'OPEN') return JobsLifecycleService.fallbackToOpen(jobId, userId);
    if (newStatus === 'CANCELLED') return JobsLifecycleService.cancelJob(jobId, userId);
    if (newStatus === 'IN_PROGRESS') return JobsLifecycleService.startWork(jobId, userId);
    throw AppError.badRequest("Use specific endpoints for this state transition");
  }

  static async complete(jobId: string, userId: string) {
    return JobsLifecycleService.completeJob(jobId, userId);
  }

  static async convertInquiryToJob(conversationId: string, posterId: string, data: any) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true }
    });
    if (!conversation) throw AppError.notFound("Conversation");
    if (conversation.type !== 'DIRECT_INQUIRY') throw AppError.badRequest("Not a direct inquiry");
    if (!conversation.participants.some(p => p.userId === posterId)) throw AppError.forbidden();

    const otherParticipant = conversation.participants.find(p => p.userId !== posterId);
    if (!otherParticipant) throw AppError.badRequest("No other participant");

    return prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          title: data.title,
          description: data.description,
          status: 'NEGOTIATING',
          postedByUserId: posterId,
          invitedLawyerId: otherParticipant.userId,
          courtId: data.courtId,
          salaryMin: data.salaryMin ? parseFloat(data.salaryMin) : null,
          salaryMax: data.salaryMax ? parseFloat(data.salaryMax) : null,
          negotiatingSince: new Date(),
        }
      });

      await tx.jobApplication.create({
        data: { jobId: job.id, lawyerId: otherParticipant.userId, status: 'PENDING' }
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { type: 'JOB', jobId: job.id }
      });

      return { job, conversationId };
    });
  }
  
  static async translate(jobId: string, targetLocale: "EN" | "AR") {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw AppError.notFound("Job");
    
    // Simplistic stub for translation logic as before
    return { title: job.title + ' (Translated)', description: job.description + ' (Translated)' };
  }

  static async delete(jobId: string, userId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw AppError.notFound("Job");
    if (job.postedByUserId !== userId) throw AppError.forbidden();
    if (job.status !== "OPEN") throw AppError.badRequest("Can only delete OPEN jobs");
    
    return prisma.job.delete({ where: { id: jobId } });
  }
}
