import { vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { describe, it, expect } from 'vitest';
import { canTransition } from '../../src/modules/jobs/jobs.statemachine';

describe('Job Status State Machine', () => {
  it('allows valid transition OPEN -> NEGOTIATING', () => {
    expect(canTransition('OPEN', 'NEGOTIATING')).toBe(true);
  });

  it('allows valid transition OPEN -> CANCELLED', () => {
    expect(canTransition('OPEN', 'CANCELLED')).toBe(true);
  });

  it('allows valid transition NEGOTIATING -> AGREED', () => {
    expect(canTransition('NEGOTIATING', 'AGREED')).toBe(true);
  });

  it('allows valid transition AGREED -> IN_PROGRESS', () => {
    expect(canTransition('AGREED', 'IN_PROGRESS')).toBe(true);
  });

  it('allows valid transition IN_PROGRESS -> COMPLETED', () => {
    expect(canTransition('IN_PROGRESS', 'COMPLETED')).toBe(true);
  });

  it('rejects invalid transition OPEN -> COMPLETED', () => {
    expect(canTransition('OPEN', 'COMPLETED')).toBe(false);
  });

  it('rejects invalid transition from COMPLETED -> anything', () => {
    expect(canTransition('COMPLETED', 'OPEN')).toBe(false);
    expect(canTransition('COMPLETED', 'NEGOTIATING')).toBe(false);
    expect(canTransition('COMPLETED', 'CANCELLED')).toBe(false);
  });

  it('rejects invalid transition from CANCELLED -> anything', () => {
    expect(canTransition('CANCELLED', 'OPEN')).toBe(false);
    expect(canTransition('CANCELLED', 'NEGOTIATING')).toBe(false);
    expect(canTransition('CANCELLED', 'COMPLETED')).toBe(false);
  });

  it('rejects transition from non-existent state', () => {
    expect(canTransition('UNKNOWN', 'OPEN')).toBe(false);
  });
});
