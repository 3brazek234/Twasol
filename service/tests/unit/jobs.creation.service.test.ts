import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobsCreationService } from '../../src/modules/jobs/jobs.creation.service';
import { prismaMock } from '../mocks/prisma';
import { AppError } from '../../src/common/errors/AppError';

describe('JobsCreationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('creates a job and assigns it if invitedLawyerId is provided', async () => {
      prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
      prismaMock.user.findUnique.mockResolvedValue({
        isActive: true,
        verificationStatus: 'APPROVED',
      } as any);
      prismaMock.job.findFirst.mockResolvedValue(null);
      const mockJob = { id: 'job-1', status: 'OPEN' };
      prismaMock.job.create.mockResolvedValue(mockJob as any);
      
      const result = await JobsCreationService.create('user-1', {
        title: 'Title',
        description: 'Desc',
        invitedLawyerId: 'lawyer-1',
        courtId: 'court-1',
        taskType: 'ATTEND_SESSION'
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
