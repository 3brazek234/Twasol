import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminVerificationsService } from '../../src/modules/admin/verifications/admin-verifications.service';
import { prismaMock } from '../mocks/prisma';

describe('AdminVerificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('approve', () => {
    it('approves document and updates user status', async () => {
      prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', verificationStatus: 'PENDING', accountMode: 'HIRING' } as any);
      prismaMock.verificationDocument.findUnique.mockResolvedValue({ id: 'doc-1', userId: 'user-1', status: 'PENDING' } as any);
      prismaMock.verificationDocument.updateMany.mockResolvedValue({} as any);
      prismaMock.user.update.mockResolvedValue({} as any);
      
      await AdminVerificationsService.approve('user-1', 'admin-1');
      
      expect(prismaMock.verificationDocument.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'APPROVED' }) }),
      );
      expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({ 
        data: { verificationStatus: 'APPROVED', subscriptionStatus: 'PENDING_PAYMENT' } 
      }));
      expect((prismaMock.user.update.mock.calls[0][0].data as any).isActive).toBeUndefined();
    });
  });

  describe('reject', () => {
    it('rejects document and updates user status', async () => {
      prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', verificationStatus: 'PENDING' } as any);
      prismaMock.verificationDocument.findUnique.mockResolvedValue({ id: 'doc-1', userId: 'user-1', status: 'PENDING' } as any);
      prismaMock.verificationDocument.updateMany.mockResolvedValue({} as any);
      prismaMock.user.update.mockResolvedValue({} as any);
      
      await AdminVerificationsService.reject('user-1', 'admin-1', 'Blurry image');
      
      expect(prismaMock.verificationDocument.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'REJECTED', reviewNotes: 'Blurry image' }),
        }),
      );
      expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { verificationStatus: 'REJECTED', verificationRejectionReason: 'Blurry image' },
      }));
    });
  });

  describe('AdminUsersService.overrideVerification', () => {
    it.each(['APPROVED', 'REJECTED'] as const)(
      'does not touch isActive when overriding verification to %s',
      async (status) => {
        const { AdminUsersService } = await import('../../src/modules/admin/users.service');
        prismaMock.$transaction.mockImplementation(async (cb) => cb(prismaMock));
        prismaMock.user.findUnique.mockResolvedValue({
          id: 'user-1',
          verificationStatus: 'PENDING',
          subscriptionStatus: 'PENDING_PAYMENT',
        } as any);
        prismaMock.user.update.mockResolvedValue({ id: 'user-1', verificationStatus: status } as any);

        await AdminUsersService.overrideVerification('user-1', 'admin-1', status, 'Manual override');

        const updateData = prismaMock.user.update.mock.calls[0][0].data as any;
        expect(updateData.verificationStatus).toBe(status);
        expect(updateData.isActive).toBeUndefined();
        if (status === 'APPROVED') {
          expect(updateData.subscriptionStatus).toBe('PENDING_PAYMENT');
        }
      },
    );
  });
});

