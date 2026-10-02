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
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', verificationStatus: 'PENDING' } as any);
      prismaMock.verificationDocument.findUnique.mockResolvedValue({ id: 'doc-1', userId: 'user-1', status: 'PENDING' } as any);
      prismaMock.verificationDocument.updateMany.mockResolvedValue({} as any);
      prismaMock.user.update.mockResolvedValue({} as any);
      
      await AdminVerificationsService.approve('user-1', 'admin-1');
      
      expect(prismaMock.verificationDocument.updateMany).toHaveBeenCalled(expect.objectContaining({ data: { status: 'APPROVED' } }));
      expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: { verificationStatus: 'APPROVED' } }));
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
      
      expect(prismaMock.verificationDocument.updateMany).toHaveBeenCalled(expect.objectContaining({ data: { status: 'REJECTED', rejectionReason: 'Blurry image' } }));
      expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { verificationStatus: 'REJECTED', verificationRejectionReason: 'Blurry image' },
      }));
    });
  });
});
