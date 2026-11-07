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
        suspendedAt: null,
        deletedAt: null,
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
        suspendedAt: null,
        deletedAt: null,
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
  });

  describe("free trial & subscription gating on apply", () => {
    it.each([0, 1, 2])(
      "allows an unsubscribed verified lawyer with %i prior applications to apply via the free trial",
      async (priorApplications) => {
        const job = makeJob({ id: jobId, postedByUserId: posterId, status: "OPEN" });
        prismaMock.user.findUnique.mockResolvedValue(makeUser({
          isActive: false, // Even if legacy isActive is false, suspendedAt is null
          suspendedAt: null,
          deletedAt: null,
          verificationStatus: "APPROVED",
          subscriptionStatus: "PENDING_PAYMENT",
          subscriptionExpiresAt: null,
        }) as any);
        prismaMock.job.findUnique.mockResolvedValue(job);
        prismaMock.jobApplication.findUnique.mockResolvedValue(null);
        prismaMock.conflictDeclaration.findUnique.mockResolvedValue(null);
        prismaMock.$executeRaw.mockResolvedValue(1 as any);
        prismaMock.jobApplication.count.mockResolvedValue(priorApplications);
        prismaMock.conflictDeclaration.upsert.mockResolvedValue({
          id: "decl-1",
          jobId,
          lawyerId,
          hasConflict: false,
        } as any);
        prismaMock.jobApplication.create.mockResolvedValue({
          id: `app-${priorApplications + 1}`,
          jobId,
          lawyerId,
          status: "PENDING",
        } as any);
        prismaMock.conversation.findFirst.mockResolvedValue(null);
        prismaMock.conversation.create.mockResolvedValue({ id: "conv-1", jobId } as any);

        const res = await JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true);

        expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
        expect(prismaMock.jobApplication.count).toHaveBeenCalledWith({ where: { lawyerId } });
        expect(res.application.id).toBe(`app-${priorApplications + 1}`);
        expect(res.conversationId).toBe("conv-1");
      },
    );

    it("rejects with 403 SUBSCRIPTION_REQUIRED and { trial } details and zero writes when 3 prior applications exist", async () => {
      const job = makeJob({ id: jobId, postedByUserId: posterId, status: "OPEN" });
      prismaMock.user.findUnique.mockResolvedValue(makeUser({
        suspendedAt: null,
        deletedAt: null,
        verificationStatus: "APPROVED",
        subscriptionStatus: "PENDING_PAYMENT",
        subscriptionExpiresAt: null,
      }) as any);
      prismaMock.job.findUnique.mockResolvedValue(job);
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);
      prismaMock.conflictDeclaration.findUnique.mockResolvedValue(null);
      prismaMock.$executeRaw.mockResolvedValue(1 as any);
      prismaMock.jobApplication.count.mockResolvedValue(3);

      const err = await expectAppError(
        () => JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true),
        "SUBSCRIPTION_REQUIRED",
        403,
      );
      expect(err.details).toEqual({
        trial: { limit: 3, used: 3, remaining: 0 },
      });
      expect(prismaMock.conflictDeclaration.upsert).not.toHaveBeenCalled();
      expect(prismaMock.jobApplication.create).not.toHaveBeenCalled();
      expect(prismaMock.conversation.create).not.toHaveBeenCalled();
    });

    it("returns existing application on re-apply to the same job even after trial exhaustion (C1)", async () => {
      const job = makeJob({ id: jobId, postedByUserId: posterId, status: "OPEN" });
      prismaMock.user.findUnique.mockResolvedValue(makeUser({
        suspendedAt: null,
        deletedAt: null,
        verificationStatus: "APPROVED",
        subscriptionStatus: "PENDING_PAYMENT",
        subscriptionExpiresAt: null,
      }) as any);
      prismaMock.job.findUnique.mockResolvedValue(job);
      prismaMock.jobApplication.findUnique.mockResolvedValue({
        id: "existing-app-1",
        jobId,
        lawyerId,
        status: "PENDING",
      } as any);
      prismaMock.conflictDeclaration.findUnique.mockResolvedValue({
        id: "decl-1",
        jobId,
        lawyerId,
        hasConflict: false,
      } as any);
      prismaMock.conversation.findFirst.mockResolvedValue({ id: "existing-conv-1" } as any);

      const res = await JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true);

      expect(res).toEqual({
        application: expect.objectContaining({ id: "existing-app-1" }),
        conversationId: "existing-conv-1",
      });
      expect(prismaMock.jobApplication.count).not.toHaveBeenCalled();
      expect(prismaMock.jobApplication.create).not.toHaveBeenCalled();
    });

    it("allows a subscribed lawyer with live expiry to apply without checking trial count", async () => {
      const job = makeJob({ id: jobId, postedByUserId: posterId, status: "OPEN" });
      prismaMock.user.findUnique.mockResolvedValue(makeUser({
        suspendedAt: null,
        deletedAt: null,
        verificationStatus: "APPROVED",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: new Date(Date.now() + 86_400_000),
      }) as any);
      prismaMock.job.findUnique.mockResolvedValue(job);
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);
      prismaMock.conflictDeclaration.findUnique.mockResolvedValue(null);
      prismaMock.conflictDeclaration.upsert.mockResolvedValue({ id: "decl-1" } as any);
      prismaMock.jobApplication.create.mockResolvedValue({ id: "app-sub-1" } as any);
      prismaMock.conversation.findFirst.mockResolvedValue({ id: "conv-sub-1" } as any);

      const res = await JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true);

      expect(res.application.id).toBe("app-sub-1");
      expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
      expect(prismaMock.jobApplication.count).not.toHaveBeenCalled();
    });

    it("treats ACTIVE subscriptionStatus with past subscriptionExpiresAt as unsubscribed and blocks when >=3 prior applications exist", async () => {
      const job = makeJob({ id: jobId, postedByUserId: posterId, status: "OPEN" });
      prismaMock.user.findUnique.mockResolvedValue(makeUser({
        suspendedAt: null,
        deletedAt: null,
        verificationStatus: "APPROVED",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: new Date(Date.now() - 60_000),
      }) as any);
      prismaMock.job.findUnique.mockResolvedValue(job);
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);
      prismaMock.conflictDeclaration.findUnique.mockResolvedValue(null);
      prismaMock.$executeRaw.mockResolvedValue(1 as any);
      prismaMock.jobApplication.count.mockResolvedValue(4);

      const err = await expectAppError(
        () => JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true),
        "SUBSCRIPTION_REQUIRED",
        403,
      );
      expect(err.details).toEqual({
        trial: { limit: 3, used: 4, remaining: 0 },
      });
      expect(prismaMock.jobApplication.create).not.toHaveBeenCalled();
    });

    it("gives a lapsed subscriber (EXPIRED) with >=3 prior applications 0 free jobs", async () => {
      const job = makeJob({ id: jobId, postedByUserId: posterId, status: "OPEN" });
      prismaMock.user.findUnique.mockResolvedValue(makeUser({
        suspendedAt: null,
        deletedAt: null,
        verificationStatus: "APPROVED",
        subscriptionStatus: "EXPIRED",
        subscriptionExpiresAt: new Date(Date.now() - 86_400_000),
      }) as any);
      prismaMock.job.findUnique.mockResolvedValue(job);
      prismaMock.jobApplication.findUnique.mockResolvedValue(null);
      prismaMock.conflictDeclaration.findUnique.mockResolvedValue(null);
      prismaMock.$executeRaw.mockResolvedValue(1 as any);
      prismaMock.jobApplication.count.mockResolvedValue(5);

      const err = await expectAppError(
        () => JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true),
        "SUBSCRIPTION_REQUIRED",
        403,
      );
      expect(err.details).toEqual({
        trial: { limit: 3, used: 5, remaining: 0 },
      });
    });

    it.each(["UNVERIFIED", "PENDING_UPLOAD", "PENDING", "REJECTED"] as const)(
      "prevents an unverified lawyer (%s) from using the trial",
      async (verificationStatus) => {
        prismaMock.user.findUnique.mockResolvedValue(makeUser({
          suspendedAt: null,
          deletedAt: null,
          verificationStatus,
          subscriptionStatus: "PENDING_PAYMENT",
          subscriptionExpiresAt: null,
        }) as any);

        await expectAppError(
          () => JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true),
          "FORBIDDEN",
          403,
        );
        expect(prismaMock.job.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.jobApplication.create).not.toHaveBeenCalled();
      },
    );

    it("prevents a banned user (suspendedAt set) from applying even with an active subscription", async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser({
        suspendedAt: new Date(),
        deletedAt: null,
        verificationStatus: "APPROVED",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: new Date(Date.now() + 86_400_000),
      }) as any);

      await expectAppError(
        () => JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true),
        "FORBIDDEN",
        403,
      );
      expect(prismaMock.job.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.jobApplication.create).not.toHaveBeenCalled();
    });

    it("prevents a soft-deleted user (deletedAt set) from applying", async () => {
      prismaMock.user.findUnique.mockResolvedValue(makeUser({
        suspendedAt: null,
        deletedAt: new Date(),
        verificationStatus: "APPROVED",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: new Date(Date.now() + 86_400_000),
      }) as any);

      await expectAppError(
        () => JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true),
        "FORBIDDEN",
        403,
      );
      expect(prismaMock.jobApplication.create).not.toHaveBeenCalled();
    });

    it("exposes no hard-delete method on JobsLifecycleService or JobsService and mounts no DELETE route on /jobs (C2)", async () => {
      const { JobsService } = await import("../../src/modules/jobs/jobs.service");
      const { JobsController } = await import("../../src/modules/jobs/jobs.controller");
      const jobsRouter = (await import("../../src/modules/jobs/jobs.routes")).default;

      expect((JobsLifecycleService as any).delete).toBeUndefined();
      expect((JobsService as any).delete).toBeUndefined();
      expect((JobsController as any).delete).toBeUndefined();

      const deleteRoutes = (jobsRouter.stack || []).filter(
        (layer: any) => layer.route?.methods?.delete,
      );
      expect(deleteRoutes).toHaveLength(0);
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

    it.each([
      { label: "camelCase array ['jobId', 'lawyerId']", target: ["jobId", "lawyerId"] },
      { label: "string constraint name 'jobId_lawyerId'", target: "jobId_lawyerId" },
      { label: "string constraint name 'job_applications_job_id_lawyer_id_key'", target: "job_applications_job_id_lawyer_id_key" },
    ])("treats P2002 with meta.target = $label as idempotent and returns raced application + conversationId", async ({ target }) => {
      const job = makeJob({ id: jobId, postedByUserId: posterId, status: "OPEN" });
      prismaMock.user.findUnique.mockResolvedValue(makeUser({
        isActive: true,
        verificationStatus: "APPROVED",
        subscriptionStatus: "ACTIVE",
        subscriptionExpiresAt: new Date(Date.now() + 60_000),
      }) as any);
      prismaMock.job.findUnique.mockResolvedValue(job);
      prismaMock.jobApplication.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "app-raced", jobId, lawyerId, status: "PENDING" } as any);
      prismaMock.conflictDeclaration.findUnique.mockResolvedValue(null);
      prismaMock.conflictDeclaration.upsert.mockResolvedValue({ id: "decl-1" } as any);
      prismaMock.jobApplication.create.mockRejectedValueOnce(
        Object.assign(new Error("Unique constraint failed"), {
          code: "P2002",
          meta: { target },
        }),
      );
      prismaMock.conversation.findFirst.mockResolvedValueOnce({ id: "conv-raced", jobId, type: "JOB" } as any);

      const res = await JobsLifecycleService.apply(jobId, lawyerId, "127.0.0.1", true);

      expect(res).toEqual({
        application: expect.objectContaining({ id: "app-raced" }),
        conversationId: "conv-raced",
      });
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
