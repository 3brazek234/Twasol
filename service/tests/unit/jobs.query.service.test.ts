import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobsQueryService } from '../../src/modules/jobs/jobs.query.service';
import { prismaMock } from '../mocks/prisma';

describe('JobsQueryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('returns jobs and pagination metadata', async () => {
      prismaMock.job.findMany.mockResolvedValue([{ id: 'job-1' }] as any);
      prismaMock.job.count.mockResolvedValue(1);
      
      const result = await JobsQueryService.search({ page: 1, limit: 10 });
      
      expect(prismaMock.job.findMany).toHaveBeenCalled();
      expect(prismaMock.job.count).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
