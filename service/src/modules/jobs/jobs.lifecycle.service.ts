import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { JobStatus } from '@prisma/client';
import { canTransition } from './jobs.statemachine';
import { auditLog } from '../../common/utils/audit';

export class JobsLifecycleService {
  static async apply(jobId: string, lawyerId: string) {
    const user = await prisma.user.findUnique({ where: { id: lawyerId } });

    if (!user?.isActive) {
      throw AppError.forbidden("Account is not active");
    }

    if (user?.verificationStatus !== "APPROVED") {
      throw AppError.forbidden("Account must be verified to apply for jobs");
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw AppError.notFound("Job");

    if (job.status !== "OPEN" && job.status !== "NEGOTIATING") {
      throw AppError.badRequest("Job is not open for applications");
    }
    if (job.postedByUserId === lawyerId) {
      throw AppError.badRequest("Cannot apply to your own job");
    }

    const existingApplication = await prisma.jobApplication.findUnique({
      where: { jobId_lawyerId: { jobId, lawyerId } },
    });

    if (existingApplication) {
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
      const application = await tx.jobApplication.create({
        data: {
          jobId,
          lawyerId,
          status: "PENDING",
        },
      });

      if (job.status === "OPEN") {
        const updateResult = await tx.job.updateMany({
          where: { id: jobId, status: "OPEN" },
          data: { status: "NEGOTIATING", version: { increment: 1 } },
        });
        if (updateResult.count === 0) {
          throw AppError.conflict("Job state changed, refresh and retry");
        }
      }

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

  static async updateStatus(
    jobId: string,
    userId: string,
    newStatus: JobStatus,
  ) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw AppError.notFound("Job");
    if (job.postedByUserId !== userId)
      throw AppError.forbidden("Only poster can change status");

    if (!canTransition(job.status, newStatus)) {
      throw AppError.badRequest(
        `Cannot transition from ${job.status} to ${newStatus}`,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.job.updateMany({
        where: {
          id: jobId,
          status: job.status,
          version: job.version,
          postedByUserId: userId,
        },
        data: { status: newStatus, version: { increment: 1 } },
      });

      if (updateResult.count === 0)
        throw AppError.conflict("Job state changed, refresh and retry");

      await auditLog(
        tx as any,
        userId,
        "job.status_changed",
        "Job",
        jobId,
        { status: job.status },
        { status: newStatus },
      );

      return tx.job.findUnique({ where: { id: jobId } });
    });

    return result;
  }

  static async delete(jobId: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isActive) {
      throw AppError.forbidden("Account is not active");
    }
    if (user?.verificationStatus !== "APPROVED") {
      throw AppError.forbidden("Account must be verified to delete jobs");
    }
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw AppError.notFound("Job");
    if (job.postedByUserId !== userId)
      throw AppError.forbidden("Only poster can delete job");
    await prisma.job.delete({ where: { id: jobId } });
  }

  static async translate(jobId: string, targetLocale: "EN" | "AR") {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    if (!job) throw AppError.notFound("Job");

    const titleTranslationMap: Record<string, string> = {
      "Deposition Coverage Needed": "مطلوب تغطية شهادة الشهود",
      "Motion Hearing Appearance": "حضور جلسة تقديم طلبات",
      "Trial Preparation Assistance": "المساعدة في التحضير للمحاكمة",
      "مطلوب تغطية شهادة الشهود": "Deposition Coverage Needed",
      "حضور جلسة تقديم طلبات": "Motion Hearing Appearance",
      "المساعدة في التحضير للمحاكمة": "Trial Preparation Assistance",
    };

    const descriptionTranslationMap: Record<string, string> = {
      "Need an experienced attorney to cover a deposition tomorrow morning.":
        "مطلوب محامٍ ذو خبرة لتغطية شهادة شهود صباح الغد.",
      "Quick appearance required for a routine motion hearing.":
        "مطلوب حضور سريع لجلسة تقديم طلبات روتينية.",
      "Looking for co-counsel for upcoming civil trial prep.":
        "نبحث عن مستشار مشارك للتحضير للمحاكمة المدنية القادمة.",
      "مطلوب محامٍ ذو خبرة لتغطية شهادة شهود صباح الغد.":
        "Need an experienced attorney to cover a deposition tomorrow morning.",
      "مطلوب حضور سريع لجلسة تقديم طلبات روتينية.":
        "Quick appearance required for a routine motion hearing.",
      "نبحث عن مستشار مشارك للتحضير للمحاكمة المدنية القادمة.":
        "Looking for co-counsel for upcoming civil trial prep.",
    };

    const isTargetArabic = targetLocale === "AR";
    const translatedTitle =
      titleTranslationMap[job.title] ||
      (isTargetArabic ? `${job.title} (مترجم)` : `${job.title} (Translated)`);
    const translatedDescription =
      descriptionTranslationMap[job.description] ||
      (isTargetArabic
        ? `${job.description} (مترجم)`
        : `${job.description} (Translated)`);

    return {
      title: translatedTitle,
      description: translatedDescription,
    };
  }
}
