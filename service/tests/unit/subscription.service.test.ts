import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionService } from '../../src/modules/subscription/subscription.service';
import { prismaMock } from '../mocks/prisma';

describe('SubscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitPayment', () => {
    it('creates a pending subscription payment', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'LAWYER',
        verificationStatus: 'APPROVED',
        subscriptionStatus: 'PENDING_PAYMENT',
      } as any);
      const mockPayment = { id: 'pay-1', status: 'PENDING' };
      prismaMock.subscriptionPayment.create.mockResolvedValue(mockPayment as any);
      prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
      
      const result = await SubscriptionService.submitPayment('user-1', {
        planId: 'monthly',
        paymentMethod: 'MANUAL_VODAFONE_CASH',
        senderNumber: '01012345678',
        receiptFileKey: 'receipt.jpg'
      });
      
      expect(prismaMock.subscriptionPayment.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1', amountPiasters: 9900, status: 'PENDING' }),
      }));
      expect(result.payment).toEqual(mockPayment);
    });
  });

  describe('approvePayment & manualGrant ban safety', () => {
    it('approvePayment does NOT clear suspendedAt or touch isActive, and returns userSuspendedWarning: true when user is suspended', async () => {
      prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
      const suspendedDate = new Date('2026-09-30T00:12:37.304Z');
      prismaMock.subscriptionPayment.findUnique.mockResolvedValue({
        id: 'pay-1',
        userId: 'user-suspended',
        status: 'PENDING',
        durationMonths: 1,
        amountPiasters: 9900,
        user: {
          id: 'user-suspended',
          subscriptionStatus: 'PENDING_PAYMENT',
          subscriptionExpiresAt: null,
          suspendedAt: suspendedDate,
        },
      } as any);
      prismaMock.subscriptionPayment.update.mockResolvedValue({ id: 'pay-1', status: 'SUCCESS' } as any);
      prismaMock.user.update.mockResolvedValue({} as any);

      const res = await SubscriptionService.approvePayment('pay-1', 'admin-1');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-suspended' },
        data: {
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: expect.any(Date),
        },
      });
      const updateData = prismaMock.user.update.mock.calls[0][0].data as any;
      expect(updateData.isActive).toBeUndefined();
      expect(updateData.suspendedAt).toBeUndefined();
      expect(res.userSuspendedWarning).toBe(true);
      expect(res.warning).toContain('موقوف');
    });

    it('manualGrant does NOT clear suspendedAt or touch isActive, and returns userSuspendedWarning: true when user is suspended', async () => {
      prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-suspended',
        subscriptionStatus: 'PENDING_PAYMENT',
        subscriptionExpiresAt: null,
        suspendedAt: new Date('2026-09-30T00:12:37.304Z'),
      } as any);
      prismaMock.subscriptionPayment.create.mockResolvedValue({ id: 'pay-grant-1', status: 'SUCCESS' } as any);
      prismaMock.user.update.mockResolvedValue({} as any);

      const res = await SubscriptionService.manualGrant(
        'user-suspended',
        'admin-1',
        'monthly',
        'Manual grant',
      );

      const updateData = prismaMock.user.update.mock.calls[0][0].data as any;
      expect(updateData.isActive).toBeUndefined();
      expect(updateData.suspendedAt).toBeUndefined();
      expect(res.userSuspendedWarning).toBe(true);
    });
  });

  describe('AuthController.me & canUseApp', () => {
    it('GET /auth/me returns computed trial: { limit, used, remaining } without mutating SAFE_USER_SELECT', async () => {
      const { AuthController } = await import('../../src/modules/auth/auth.controller');
      const { SAFE_USER_SELECT } = await import('../../src/modules/users/user-safe-fields');

      expect((SAFE_USER_SELECT as any).trial).toBeUndefined();
      expect(SAFE_USER_SELECT.suspendedAt).toBe(true);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'lawyer@example.com',
        isActive: true,
        suspendedAt: null,
        verificationStatus: 'APPROVED',
        subscriptionStatus: 'PENDING_PAYMENT',
      } as any);
      prismaMock.jobApplication.count.mockResolvedValue(1);

      const json = vi.fn();
      await AuthController.me(
        { user: { userId: 'user-1', role: 'LAWYER' } } as any,
        { json } as any,
        vi.fn(),
      );

      expect(json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({
            id: 'user-1',
            trial: { limit: 3, used: 1, remaining: 2 },
          }),
        },
      });
    });

    it('GET /auth/me clamps trial.remaining to 0 when used exceeds limit via AuthController.me', async () => {
      const { AuthController } = await import('../../src/modules/auth/auth.controller');

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'exhausted@example.com',
        isActive: true,
        suspendedAt: null,
        verificationStatus: 'APPROVED',
        subscriptionStatus: 'PENDING_PAYMENT',
      } as any);
      prismaMock.jobApplication.count.mockResolvedValue(5);

      const json = vi.fn();
      await AuthController.me(
        { user: { userId: 'user-2', role: 'LAWYER' } } as any,
        { json } as any,
        vi.fn(),
      );

      expect(json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({
            id: 'user-2',
            trial: { limit: 3, used: 5, remaining: 0 },
          }),
        },
      });
    });

    it('excludes soft-deleted users (deletedAt set) and suspended users (suspendedAt set) from canUseApp and hasSubscriptionAccess', async () => {
      const { canUseApp, hasSubscriptionAccess } = await import('../../src/common/utils/subscription-access');
      const future = new Date(Date.now() + 86_400_000);

      expect(canUseApp({ deletedAt: null, suspendedAt: null })).toBe(true);
      expect(canUseApp({ deletedAt: new Date(), suspendedAt: null })).toBe(false);
      expect(canUseApp({ deletedAt: null, suspendedAt: new Date() })).toBe(false);

      expect(
        hasSubscriptionAccess({
          deletedAt: new Date(),
          suspendedAt: null,
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: future,
        }),
      ).toBe(false);

      expect(
        hasSubscriptionAccess({
          deletedAt: null,
          suspendedAt: new Date(),
          subscriptionStatus: 'ACTIVE',
          subscriptionExpiresAt: future,
        }),
      ).toBe(false);
    });
  });
});

