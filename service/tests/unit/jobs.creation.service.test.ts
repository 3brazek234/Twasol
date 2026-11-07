import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobsCreationService } from '../../src/modules/jobs/jobs.creation.service';
import { prismaMock } from '../mocks/prisma';
import { AppError } from '../../src/common/errors/AppError';

describe('JobsCreationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    const createJobData = {
      title: 'Title',
      description: 'Desc',
      invitedLawyerId: 'lawyer-1',
      courtId: 'court-1',
      taskType: 'ATTEND_SESSION',
    };

    it.each(['HIRING', 'GIG', 'BOTH'] as const)(
      'allows a verified %s lawyer with PENDING_PAYMENT and 0 trial remaining to post a job for free (D4)',
      async (accountMode) => {
        prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
        prismaMock.user.findUnique.mockResolvedValue({
          id: 'user-1',
          accountMode,
          isActive: false,
          suspendedAt: null,
          deletedAt: null,
          verificationStatus: 'APPROVED',
          subscriptionStatus: 'PENDING_PAYMENT',
          subscriptionExpiresAt: null,
        } as any);
        prismaMock.job.findFirst.mockResolvedValue(null);
        const mockJob = { id: 'job-1', status: 'OPEN' };
        prismaMock.job.create.mockResolvedValue(mockJob as any);

        const result = await JobsCreationService.create('user-1', createJobData);

        expect(prismaMock.job.create).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({
            title: 'Title',
            postedByUserId: 'user-1',
          }),
        }));
        expect(result).toEqual(mockJob);
      },
    );

    it('rejects job creation for a banned user (suspendedAt set) even if APPROVED and ACTIVE', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        isActive: true,
        suspendedAt: new Date(),
        deletedAt: null,
        verificationStatus: 'APPROVED',
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: new Date(Date.now() + 86_400_000),
      } as any);

      await expect(
        JobsCreationService.create('user-1', createJobData),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
      expect(prismaMock.job.create).not.toHaveBeenCalled();
    });

    it('rejects job creation for an unverified user', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        isActive: true,
        suspendedAt: null,
        deletedAt: null,
        verificationStatus: 'PENDING',
        subscriptionStatus: 'PENDING_PAYMENT',
        subscriptionExpiresAt: null,
      } as any);

      await expect(
        JobsCreationService.create('user-1', createJobData),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
      expect(prismaMock.job.create).not.toHaveBeenCalled();
    });

    it('creates jobs for users exempt from subscription requirements', async () => {
      prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
      prismaMock.user.findUnique.mockResolvedValue({
        isActive: true,
        suspendedAt: null,
        deletedAt: null,
        verificationStatus: 'APPROVED',
        subscriptionStatus: 'NOT_REQUIRED',
        subscriptionExpiresAt: null,
      } as any);
      prismaMock.job.findFirst.mockResolvedValue(null);
      const mockJob = { id: 'job-1', status: 'OPEN' };
      prismaMock.job.create.mockResolvedValue(mockJob as any);

      await expect(
        JobsCreationService.create('user-1', createJobData),
      ).resolves.toEqual(mockJob);
    });

    it('creates a job and assigns it if invitedLawyerId is provided', async () => {
      prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
      prismaMock.user.findUnique.mockResolvedValue({
        isActive: true,
        suspendedAt: null,
        deletedAt: null,
        verificationStatus: 'APPROVED',
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: new Date(Date.now() + 60_000),
      } as any);
      prismaMock.job.findFirst.mockResolvedValue(null);
      const mockJob = { id: 'job-1', status: 'OPEN' };
      prismaMock.job.create.mockResolvedValue(mockJob as any);
      
      const result = await JobsCreationService.create('user-1', {
        ...createJobData,
      });
      
      expect(prismaMock.job.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          title: 'Title',
          postedByUserId: 'user-1',
        })
      }));
      expect(prismaMock.jobApplication.create).toHaveBeenCalledWith(expect.objectContaining({
        data: { jobId: 'job-1', lawyerId: 'lawyer-1', status: 'PENDING' },
      }));
      expect(result).toEqual(mockJob);
    });
  });
});

