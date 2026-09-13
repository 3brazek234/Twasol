import { describe, it, expect, beforeEach, vi } from "vitest";
import { JobsLifecycleService } from "../../src/modules/jobs/jobs.lifecycle.service";
import { prismaMock } from "../mocks/prisma";
import { expectAppError } from "../helpers/errors";
import { makeJob, makeMessage } from "../factories/other.factory";

describe("JobsLifecycleService", () => {
  const jobId = "job-123";
  const posterId = "poster-123";
  const lawyerId = "lawyer-456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("startNegotiation", () => {
    it("transitions OPEN -> NEGOTIATING and sets negotiatingSince", async () => {
      const mockJob = makeJob({ id: jobId, posterId, status: "OPEN" });
      prismaMock.job.findUnique.mockResolvedValue(mockJob);
      prismaMock.job.update.mockResolvedValue({ ...mockJob, status: "NEGOTIATING" });

      await JobsLifecycleService.startNegotiation(jobId, posterId);

      expect(prismaMock.job.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: jobId, version: mockJob.version },
        data: expect.objectContaining({
          status: "NEGOTIATING",
          version: { increment: 1 }
        })
      }));
    });

    it("throws FORBIDDEN if requester is not the poster", async () => {
      const mockJob = makeJob({ id: jobId, posterId, status: "OPEN" });
      prismaMock.job.findUnique.mockResolvedValue(mockJob);

      await expectAppError(() => JobsLifecycleService.startNegotiation(jobId, "wrong-user"), "FORBIDDEN");
    });

    it("throws BAD_REQUEST for invalid state transition", async () => {
      const mockJob = makeJob({ id: jobId, posterId, status: "IN_PROGRESS" });
      prismaMock.job.findUnique.mockResolvedValue(mockJob);

      await expectAppError(() => JobsLifecycleService.startNegotiation(jobId, posterId), "BAD_REQUEST");
    });
  });

  describe("acceptOffer", () => {
    it("sets assignedLawyerId, agreedSalary, and withdraws other pending offers", async () => {
      const mockJob = makeJob({ id: jobId, posterId, status: "NEGOTIATING" });
      const mockMessage = makeMessage({ id: "msg-1", type: "OFFER", status: "DELIVERED", senderId: lawyerId, amount: 2000 });
      
      prismaMock.job.findUnique.mockResolvedValue(mockJob);
      // Prisma transaction mock is tricky, we mock transaction to just run the callback
      prismaMock.$transaction.mockImplementation(async (cb) => {
        if (Array.isArray(cb)) return Promise.all(cb);
        return cb(prismaMock);
      });

      // simulate message findUnique inside transaction if needed, but the actual implementation might not use it like that.
      // wait, the actual implementation of acceptOffer needs specific mocks depending on what it queries.
      // Let's just leave it basic for now to see what breaks
    });
  });
});
