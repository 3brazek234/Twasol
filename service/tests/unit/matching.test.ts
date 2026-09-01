import { vi, describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { buildMatchingQuery } from '../../src/workers/notification-fanout.worker';

describe('Job Matching Logic', () => {
  it('should match lawyers in the correct courts and exclude poster', () => {
    const query = buildMatchingQuery(['court1', 'court2'], 'poster123');

    expect(query).toEqual({
      courtId: { in: ['court1', 'court2'] },
      isActive: true,
      user: {
        isActive: true,
        verificationStatus: 'APPROVED',
        id: { not: 'poster123' }
      }
    });
  });

  it('should exclude the user who posted the job', () => {
    const query = buildMatchingQuery(['court1'], 'poster123');
    expect(query.user.id).toEqual({ not: 'poster123' });
  });

  it('should ensure the user is active and approved', () => {
    const query = buildMatchingQuery(['court1'], 'poster123');
    expect(query.user.isActive).toBe(true);
    expect(query.user.verificationStatus).toBe('APPROVED');
  });
});
