import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { SAFE_USER_SELECT } from '../users/user-safe-fields';
import { createDefaultCourts } from './create-default-courts';

interface CompleteProfileInput {
  barNumber: string;
  governorateId: string;
}

export class CompleteProfileService {
  /**
   * Complete a Google-registered user's profile by adding barNumber
   * and governorateId, then creating default court mappings.
   */
  static async completeProfile(userId: string, data: CompleteProfileInput) {
    const { barNumber, governorateId } = data;

    if (!barNumber || barNumber.trim().length < 2) {
      throw AppError.badRequest('رقم العضوية مطلوب');
    }

    if (!governorateId) {
      throw AppError.badRequest('يرجى اختيار مقر المكتب');
    }

    // Validate barNumber uniqueness
    const existingBarNumber = await prisma.user.findUnique({
      where: { barNumber: barNumber.trim() },
    });
    if (existingBarNumber && existingBarNumber.id !== userId) {
      throw AppError.badRequest('رقم العضوية مسجّل بالفعل لمستخدم آخر');
    }

    // Validate governorate exists
    const gov = await prisma.governorate.findUnique({ where: { id: governorateId } });
    if (!gov) {
      throw AppError.badRequest('المحافظة المختارة غير صالحة');
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        barNumber: barNumber.trim(),
        governorateId,
      },
      select: SAFE_USER_SELECT,
    });

    // Create default court mappings (same logic as email/password register)
    await createDefaultCourts(userId, governorateId);

    return {
      ...user,
      name: user.fullName,
    };
  }
}
