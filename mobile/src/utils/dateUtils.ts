import { tokens } from '../theme/tokens';

// ─── Existing helpers (preserved) ─────────────────────────────────────────────

export function daysBetween(from: Date | string, to: Date | string): number {
  const f = new Date(from);
  const t = new Date(to);
  f.setHours(0, 0, 0, 0);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso));
}

export function getDeadlineInfo(deadline: string): { label: string; color: string; urgent: boolean } {
  const today = new Date();
  const days = daysBetween(today, deadline);

  if (days < 0) {
    return { label: 'منتهي', color: tokens.colors.crimson, urgent: true };
  }
  if (days === 0) {
    return { label: 'اليوم', color: tokens.colors.crimson, urgent: true };
  }
  if (days <= 2) {
    return { label: `يتبقى ${days} أيام`, color: tokens.colors.crimson, urgent: true };
  }
  if (days <= 5) {
    return { label: `يتبقى ${days} أيام`, color: tokens.colors.amber, urgent: false };
  }

  return { label: formatDate(deadline), color: tokens.colors.muted, urgent: false };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG').format(amount) + ' ج.م';
}

// ─── Safe date helpers ─────────────────────────────────────────────────────────

/**
 * Safely parses a date value. Returns null if input is falsy or produces an
 * invalid date — never throws, never returns an Invalid Date object silently.
 */
export function safeParseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** Safely formats a date in Arabic long form; returns fallback string if invalid. */
export function safeFormatDate(
  value: string | Date | null | undefined,
  fallback: string = '—'
): string {
  const date = safeParseDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/** Safely formats a time (HH:MM) for chat bubbles; returns fallback string if invalid. */
export function safeFormatTime(
  value: string | Date | null | undefined,
  fallback: string = ''
): string {
  const date = safeParseDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
