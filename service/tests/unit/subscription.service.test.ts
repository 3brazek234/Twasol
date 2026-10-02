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
        data: expect.objectContaining({ userId: 'user-1', amountPiasters: 19900, status: 'PENDING' }),
      }));
      expect(result.payment).toEqual(mockPayment);
    });
  });
});
