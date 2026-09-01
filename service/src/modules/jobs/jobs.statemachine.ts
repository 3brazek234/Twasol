export const VALID_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['NEGOTIATING', 'CANCELLED'],
  NEGOTIATING: ['AGREED', 'CANCELLED'],
  AGREED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
