/**
 * Formats an Arabic count of "مهمة مجانية" (free job/task) following standard
 * Arabic pluralization rules:
 * - <= 0 or null/undefined: returns null so callers hide trial copy when 0
 * - 1: "مهمة مجانية واحدة"
 * - 2: "مهمتان مجانيتان"
 * - 3–10: "${count} مهام مجانية"
 * - 11+: "${count} مهمة مجانية"
 */
export function formatFreeJobsCount(count: number | null | undefined): string | null {
  if (count == null || !Number.isFinite(count) || count <= 0) {
    return null;
  }

  const n = Math.floor(count);
  if (n <= 0) {
    return null;
  }
  if (n === 1) {
    return 'مهمة مجانية واحدة';
  }
  if (n === 2) {
    return 'مهمتان مجانيتان';
  }
  if (n >= 3 && n <= 10) {
    return `${n} مهام مجانية`;
  }
  return `${n} مهمة مجانية`;
}

/**
 * Formats the "remaining free jobs" badge/banner label:
 * - <= 0 or null/undefined: returns null (hide trial copy)
 * - >= 1: "متبقي <formatted count>"
 */
export function formatRemainingFreeJobs(remaining: number | null | undefined): string | null {
  const formatted = formatFreeJobsCount(remaining);
  if (!formatted) {
    return null;
  }
  return `متبقي ${formatted}`;
}
