import { vi, describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { buildMatchingQuery } from '../../src/workers/notification-fanout.worker';

describe('Job Matching Logic', () => {
  it('should match lawyers in the correct courts and exclude poster, deleted, and suspended users', () => {
    const query = buildMatchingQuery(['court1', 'court2'], 'poster123');

    expect(query).toEqual({
      courtId: { in: ['court1', 'court2'] },
      isActive: true,
      user: {
        deletedAt: null,
        suspendedAt: null,
        verificationStatus: 'APPROVED',
        id: { not: 'poster123' }
      }
    });
  });

  it('should exclude the user who posted the job', () => {
    const query = buildMatchingQuery(['court1'], 'poster123');
    expect(query.user.id).toEqual({ not: 'poster123' });
  });

  it('should ensure the user is not suspended, not deleted, and approved (including trial lawyers)', () => {
    const query = buildMatchingQuery(['court1'], 'poster123');
    expect(query.user.suspendedAt).toBeNull();
    expect(query.user.deletedAt).toBeNull();
    expect((query.user as any).isActive).toBeUndefined();
    expect(query.user.verificationStatus).toBe('APPROVED');
  });
});

