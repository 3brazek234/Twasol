import { tokens } from '../theme/tokens';

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
