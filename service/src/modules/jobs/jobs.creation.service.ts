import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { JobStatus, Prisma } from '@prisma/client';
import { pushNotificationQueue } from '../../common/utils/queue';
import { auditLog } from '../../common/utils/audit';

export class JobsCreationService {
  static async create(userId: string, data: any) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.isActive) {
      throw AppError.forbidden("Account is not active");
    }

    if (user?.verificationStatus !== "APPROVED") {
      throw AppError.forbidden("Account must be verified to post jobs");
    }
    
    const {
      title,
      description,
      courtId,
      taskType,
      invitedLawyerId,
      salaryMin,
      salaryMax,
      expiresAt,
    } = data;

    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          title,
          description,
          taskType,
          status: "OPEN",
          postedByUserId: userId,
          salaryMin: salaryMin ? parseFloat(salaryMin) : null,
          salaryMax: salaryMax ? parseFloat(salaryMax) : null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          courtId,
        },
        include: {
          court: true,
        },
      });

      if (invitedLawyerId) {
        await tx.jobApplication.create({
          data: {
            jobId: job.id,
            lawyerId: invitedLawyerId,
            status: "PENDING",
          },
        });
        await pushNotificationQueue.add('send-push', {
          userId: invitedLawyerId,
          type: 'JOB_INVITATION',
          title: 'New Job Invitation',
          body: `You have been invited to apply for: ${title}`,
          data: { jobId: job.id },
        });
      }

      await auditLog(
        tx as any,
        userId,
        "job.created",
        "Job",
        job.id,
        null,
        { title, hasInvite: !!invitedLawyerId },
      );

      return job;
    });

    if (!invitedLawyerId && courtId) {
      await pushNotificationQueue.add("fanout-job-notification", {
        jobId: result.id,
        courtIds: [courtId],
        postedByUserId: userId,
      });
    }

    return result;
  }
}
