import { describe, it, expect, beforeEach, vi } from "vitest";
import { JobsLifecycleService } from "../../src/modules/jobs/jobs.lifecycle.service";
import { prismaMock } from "../mocks/prisma";
import { expectAppError } from "../helpers/errors";
import { makeJob } from "../factories/job.factory";
import { makeUser } from "../factories/user.factory";

describe("JobsLifecycleService", () => {
  const jobId = "job-123";
  const posterId = "poster-123";
  const lawyerId = "lawyer-456";

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
  });

  describe("conflict declarations", () => {
    it("records a declared conflict without creating an application", async () => {
      const job = makeJob({ id: jobId, postedByUserId: posterId });
      prismaMock.user.findUnique.mockResolvedValue(makeUser({
        isActive: true,
        verificationStatus: "APPROVED",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: new Date(Date.now() + 60_000),
      }) as any);
      prismaMock.job.findUnique.mockResolvedValue(job);
      prismaMock.conflictDeclaration.upsert.mockResolvedValue({
        id: "declaration-1",
        jobId,
        lawyerId,
        hasConflict: true,
      } as any);

      await JobsLifecycleService.declareConflict(jobId, lawyerId, "127.0.0.1");

      expect(prismaMock.conflictDeclaration.upsert).toHaveBeenCalledWith(expect.objectContaining({
        create: expect.objectContaining({ jobId, lawyerId, hasConflict: true }),
      }));
      expect(prismaMock.jobApplication.create).not.toHaveBeenCalled();
    });

    it("prevents applying after a conflict has been declared", async () => {
      const job = makeJob({ id: jobId, postedByUserId: posterId });
      prismaMock.user.findUnique.mockResolvedValue(makeUser({
        isActive: true,
        verificationStatus: "APPROVED",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: new Date(Date.now() + 60_000),
      }) as any);
      prismaMock.job.findUnique.mockResolvedValue(job);
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);
      prismaMock.conflictDeclaration.findUnique.mockResolvedValue({
        id: "declaration-1",
        jobId,
        lawyerId,
        hasConflict: true,
      } as any);

      await expectAppError(
        () => JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true),
        "FORBIDDEN",
      );
      expect(prismaMock.jobApplication.create).not.toHaveBeenCalled();
    });

    it.each([
      {
        subscriptionStatus: "PENDING_PAYMENT",
        subscriptionExpiresAt: null,
      },
      {
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: new Date(Date.now() - 60_000),
      },
    ] as const)("rejects applying without a current subscription: $subscriptionStatus", async ({
      subscriptionStatus,
      subscriptionExpiresAt,
    }) => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser({
        isActive: true,
        verificationStatus: "APPROVED",
        subscriptionStatus,
        subscriptionExpiresAt,
      }) as any);

      await expectAppError(
        () => JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true),
        "FORBIDDEN",
      );
      expect(prismaMock.job.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.jobApplication.create).not.toHaveBeenCalled();
    });
  });

  describe("apply idempotency (concurrent double submit)", () => {
    it("returns the same applicationId and conversationId on concurrent P2002 race and creates only one conversation", async () => {
      const job = makeJob({ id: jobId, postedByUserId: posterId, status: "OPEN" });
      prismaMock.user.findUnique.mockResolvedValue(makeUser({
        isActive: true,
        verificationStatus: "APPROVED",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: new Date(Date.now() + 60_000),
      }) as any);
      prismaMock.job.findUnique.mockResolvedValue(job);
      // Both concurrent calls see null on the pre-transaction check
      prismaMock.jobApplication.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        // Third call is the post-P2002 fallback outside the transaction
        .mockResolvedValueOnce({ id: "app-1", jobId, lawyerId, status: "PENDING" } as any);

      prismaMock.conflictDeclaration.findUnique.mockResolvedValue(null);
      prismaMock.conflictDeclaration.upsert.mockResolvedValue({
        id: "decl-1",
        jobId,
        lawyerId,
        hasConflict: false,
      } as any);

      // First call creates the application; second call hits P2002 unique constraint violation on jobId_lawyerId
      prismaMock.jobApplication.create
        .mockResolvedValueOnce({ id: "app-1", jobId, lawyerId, status: "PENDING" } as any)
        .mockRejectedValueOnce(
          Object.assign(new Error("Unique constraint failed"), {
            code: "P2002",
            meta: { target: ["job_id", "lawyer_id"] },
          })
        );

      // First call inside tx sees no conversation, creates conv-1; second call's fallback finds conv-1
      prismaMock.conversation.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "conv-1", jobId, type: "JOB" } as any);
      prismaMock.conversation.create.mockResolvedValue({ id: "conv-1", jobId, type: "JOB" } as any);

      const [res1, res2] = await Promise.all([
        JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true),
        JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true),
      ]);

      expect(res1.application.id).toBe("app-1");
      expect(res2.application.id).toBe("app-1");
      expect(res1.conversationId).toBe("conv-1");
      expect(res2.conversationId).toBe("conv-1");
      expect(prismaMock.conversation.create).toHaveBeenCalledTimes(1);
    });

    it("rethrows P2002 when meta.target is a different constraint", async () => {
      const job = makeJob({ id: jobId, postedByUserId: posterId, status: "OPEN" });
      prismaMock.user.findUnique.mockResolvedValue(makeUser({
        isActive: true,
        verificationStatus: "APPROVED",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: new Date(Date.now() + 60_000),
      }) as any);
      prismaMock.job.findUnique.mockResolvedValue(job);
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);
      prismaMock.conflictDeclaration.findUnique.mockResolvedValue(null);
      prismaMock.conflictDeclaration.upsert.mockResolvedValue({
        id: "decl-1",
        jobId,
        lawyerId,
        hasConflict: false,
      } as any);

      const otherP2002 = Object.assign(new Error("Unique constraint failed on conversation_id_user_id"), {
        code: "P2002",
        meta: { target: ["conversation_id", "user_id"] },
      });
      prismaMock.jobApplication.create.mockRejectedValueOnce(otherP2002);

      await expect(
        JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true)
      ).rejects.toThrow("Unique constraint failed on conversation_id_user_id");
    });
  });

  describe("startNegotiation", () => {
    it("transitions OPEN -> NEGOTIATING and sets negotiatingSince", async () => {
      const mockJob = makeJob({ id: jobId, postedByUserId: posterId, status: "OPEN" });
      prismaMock.job.findUnique.mockResolvedValue(mockJob);
      prismaMock.job.updateMany.mockResolvedValue({ count: 1 } as any);

      await JobsLifecycleService.startNegotiation(jobId, posterId);

      expect(prismaMock.job.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: jobId, status: "OPEN", version: mockJob.version },
        data: expect.objectContaining({
          status: "NEGOTIATING",
          version: { increment: 1 }
        })
      }));
    });

    it("throws FORBIDDEN if requester is not the poster", async () => {
      const mockJob = makeJob({ id: jobId, postedByUserId: posterId, status: "OPEN" });
      prismaMock.job.findUnique.mockResolvedValue(mockJob);

      await expectAppError(() => JobsLifecycleService.startNegotiation(jobId, "wrong-user"), "FORBIDDEN");
    });

    it("throws BAD_REQUEST for invalid state transition", async () => {
      const mockJob = makeJob({ id: jobId, postedByUserId: posterId, status: "IN_PROGRESS" });
      prismaMock.job.findUnique.mockResolvedValue(mockJob);

      await expectAppError(() => JobsLifecycleService.startNegotiation(jobId, posterId), "BAD_REQUEST");
    });
  });

  describe("acceptOffer", () => {
    it("assigns the lawyer and agreed salary", async () => {
      const mockJob = makeJob({ id: jobId, postedByUserId: posterId, status: "NEGOTIATING" });
      prismaMock.job.findUnique.mockResolvedValue(mockJob);
      prismaMock.user.findUnique.mockResolvedValue({ role: "LAWYER", accountMode: "GIG" } as any);
      prismaMock.job.updateMany.mockResolvedValue({ count: 1 } as any);

      await JobsLifecycleService.acceptOffer(jobId, lawyerId, 2000);

      expect(prismaMock.job.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: jobId, status: "NEGOTIATING", version: mockJob.version },
        data: expect.objectContaining({
          status: "AGREED",
          assignedLawyerId: lawyerId,
          agreedSalary: 2000,
        }),
      }));
    });

    it("rejects assigning the job poster as the lawyer", async () => {
      prismaMock.job.findUnique.mockResolvedValue(makeJob({ id: jobId, postedByUserId: posterId, status: "NEGOTIATING" }));
      prismaMock.user.findUnique.mockResolvedValue({ role: "LAWYER", accountMode: "BOTH" } as any);

      await expectAppError(() => JobsLifecycleService.acceptOffer(jobId, posterId, 2000), "BAD_REQUEST");
      expect(prismaMock.job.updateMany).not.toHaveBeenCalled();
    });

    it("rejects assigning a HIRING-only account", async () => {
      prismaMock.job.findUnique.mockResolvedValue(makeJob({ id: jobId, postedByUserId: posterId, status: "NEGOTIATING" }));
      prismaMock.user.findUnique.mockResolvedValue({ role: "LAWYER", accountMode: "HIRING" } as any);

      await expectAppError(() => JobsLifecycleService.acceptOffer(jobId, lawyerId, 2000), "BAD_REQUEST");
      expect(prismaMock.job.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("fallbackToOpen", () => {
    it("transitions NEGOTIATING -> OPEN", async () => {
      const mockJob = makeJob({ id: jobId, postedByUserId: posterId, status: "NEGOTIATING" });
      prismaMock.job.findUnique.mockResolvedValue(mockJob);
      prismaMock.job.updateMany.mockResolvedValue({ count: 1 } as any);

      await JobsLifecycleService.fallbackToOpen(jobId, posterId);

      expect(prismaMock.job.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: jobId, status: "NEGOTIATING", version: mockJob.version },
        data: expect.objectContaining({ status: "OPEN" })
      }));
    });
  });

  describe("completeJob", () => {
    it("transitions IN_PROGRESS -> COMPLETED", async () => {
      const mockJob = makeJob({ id: jobId, postedByUserId: posterId, status: "IN_PROGRESS", assignedLawyerId: lawyerId });
      prismaMock.job.findUnique.mockResolvedValue(mockJob);
      prismaMock.job.updateMany.mockResolvedValue({ count: 1 } as any);

      await JobsLifecycleService.completeJob(jobId, posterId);

      expect(prismaMock.job.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: jobId, status: "IN_PROGRESS", version: mockJob.version },
        data: expect.objectContaining({ status: "COMPLETED" })
      }));
      expect(prismaMock.notification.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: lawyerId,
          type: "JOB_COMPLETED",
          payload: expect.objectContaining({
            titleAr: 'تم اكتمال المهمة ✅',
            messageAr: 'قام صاحب المهمة بإنهاء المهمة. شكراً لجهودك!',
          }),
        }),
      }));
    });
  });

  describe("expireJob", () => {
    it("transitions OPEN -> EXPIRED", async () => {
      const mockJob = makeJob({ id: jobId, postedByUserId: posterId, status: "OPEN" });
      prismaMock.job.findUnique.mockResolvedValue(mockJob);
      prismaMock.job.updateMany.mockResolvedValue({ count: 1 } as any);

      await JobsLifecycleService.expireJob(jobId);

      expect(prismaMock.job.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: jobId, status: "OPEN", version: mockJob.version },
        data: expect.objectContaining({ status: "EXPIRED" })
      }));
    });
  });
});
