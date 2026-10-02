import { describe, it, expect, beforeEach, vi } from "vitest";
import { JobsLifecycleService } from "../../src/modules/jobs/jobs.lifecycle.service";
import { prismaMock } from "../mocks/prisma";
import { expectAppError } from "../helpers/errors";
import { makeJob } from "../factories/job.factory";

describe("JobsLifecycleService", () => {
  const jobId = "job-123";
  const posterId = "poster-123";
  const lawyerId = "lawyer-456";

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
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
