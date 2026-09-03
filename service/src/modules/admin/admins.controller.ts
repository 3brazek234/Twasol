import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { auditLog } from '../../common/utils/audit';
import { hashPassword } from '../../common/utils/password';

export class AdminsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, fullName, password } = req.body;
      const superAdminId = req.user!.userId;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) throw AppError.badRequest('User with this email already exists');

      const passwordHash = await hashPassword(password);

      const result = await prisma.$transaction(async (tx) => {
        const newAdmin = await tx.user.create({
          data: {
            email,
            fullName,
            passwordHash,
            role: 'ADMIN',
            verificationStatus: 'APPROVED'
          }
        });

        await auditLog(
          tx as any,
          superAdminId,
          'admin.created',
          'User',
          newAdmin.id,
          null,
          { email, fullName, role: 'ADMIN' }
        );

        return newAdmin;
      });

      const { passwordHash: _, ...adminWithoutPassword } = result;
      res.status(201).json({ success: true, data: adminWithoutPassword });
    } catch (error) {
      next(error);
    }
  }
}
