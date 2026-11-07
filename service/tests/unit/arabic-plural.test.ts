import { describe, it, expect } from 'vitest';
import { formatFreeJobsCount, formatRemainingFreeJobs } from '../../../mobile/src/utils/arabicPlural';

describe('Arabic plural helper (formatFreeJobsCount & formatRemainingFreeJobs)', () => {
  it('returns null for 0, negative numbers, null, or undefined so callers hide trial copy', () => {
    expect(formatFreeJobsCount(0)).toBeNull();
    expect(formatFreeJobsCount(-1)).toBeNull();
    expect(formatFreeJobsCount(null)).toBeNull();
    expect(formatFreeJobsCount(undefined)).toBeNull();

    expect(formatRemainingFreeJobs(0)).toBeNull();
    expect(formatRemainingFreeJobs(-3)).toBeNull();
    expect(formatRemainingFreeJobs(null)).toBeNull();
    expect(formatRemainingFreeJobs(undefined)).toBeNull();
  });

  it('formats 1 as singular ("مهمة مجانية واحدة")', () => {
    expect(formatFreeJobsCount(1)).toBe('مهمة مجانية واحدة');
    expect(formatRemainingFreeJobs(1)).toBe('متبقي مهمة مجانية واحدة');
  });

  it('formats 2 as dual ("مهمتان مجانيتان")', () => {
    expect(formatFreeJobsCount(2)).toBe('مهمتان مجانيتان');
    expect(formatRemainingFreeJobs(2)).toBe('متبقي مهمتان مجانيتان');
  });

  it('formats 3 through 10 with plural noun ("مهام مجانية")', () => {
    expect(formatFreeJobsCount(3)).toBe('3 مهام مجانية');
    expect(formatFreeJobsCount(5)).toBe('5 مهام مجانية');
    expect(formatFreeJobsCount(10)).toBe('10 مهام مجانية');
    expect(formatRemainingFreeJobs(3)).toBe('متبقي 3 مهام مجانية');
    expect(formatRemainingFreeJobs(10)).toBe('متبقي 10 مهام مجانية');
  });

  it('formats 11 and above with singular tamyiz ("مهمة مجانية")', () => {
    expect(formatFreeJobsCount(11)).toBe('11 مهمة مجانية');
    expect(formatFreeJobsCount(15)).toBe('15 مهمة مجانية');
    expect(formatFreeJobsCount(100)).toBe('100 مهمة مجانية');
    expect(formatRemainingFreeJobs(11)).toBe('متبقي 11 مهمة مجانية');
  });
});
