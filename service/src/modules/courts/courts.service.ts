import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { paginate } from '../../common/schemas/pagination.schema';
import { getCached, invalidateCachePrefix } from '../../common/utils/cache';
import { CourtType } from '@prisma/client';

export class CourtsService {
  static async getGovernorates() {
    return prisma.governorate.findMany({ orderBy: { nameAr: 'asc' } });
  }

  static async create(data: {
    nameAr: string;
    nameEn: string;
    type: CourtType;
    governorateId?: string;
    parentCourtId?: string;
  }) {
    const existing = await prisma.court.findFirst({
      where: { nameAr: data.nameAr, type: data.type, governorateId: data.governorateId ?? null },
    });
    if (existing) throw AppError.conflict('Court already exists with the same name and type in this governorate');
    if (data.type !== 'CASSATION' && !data.governorateId) {
      throw AppError.badRequest('governorateId is required for non-cassation courts');
    }
    const court = await prisma.court.create({ data });
    await invalidateCachePrefix('courts:list:');
    return court;
  }

  static async getById(id: string) {
    const court = await prisma.court.findUnique({
      where: { id },
      include: { governorate: true, parentCourt: true }
    });
    if (!court) throw AppError.notFound('Court');
    return court;
  }

  static async list({
    page = 1, limit = 25, type, governorateId,
  }: { page?: number; limit?: number; type?: CourtType; governorateId?: string; }) {
    const cacheKey = `courts:list:${page}:${limit}:${type || 'all'}:${governorateId || 'all'}`;
    return getCached(cacheKey, async () => {
      const where: any = {};
      if (type) where.type = type;
      if (governorateId) where.governorateId = governorateId;
      const [items, total] = await Promise.all([
        prisma.court.findMany({
          where,
          include: { governorate: true },
          orderBy: [{ type: 'asc' }, { nameAr: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.court.count({ where }),
      ]);
      return paginate(items, total, page, limit);
    }, 300);
  }

  static async search(query: string) {
    return prisma.court.findMany({
      where: {
        OR: [
          { nameAr: { contains: query, mode: 'insensitive' } },
          { nameEn: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { governorate: true },
      take: 20,
      orderBy: { nameAr: 'asc' },
    });
  }

  static async getActiveLawyers(courtId: string) {
    const lawyers = await prisma.lawyerCourt.findMany({
      where: { courtId, isActive: true, user: { isActive: true, deletedAt: null } },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });
    return lawyers.map((lc: any) => lc.user);
  }

  static async registerLawyer(userId: string, courtId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User');
    if (!user.isActive) throw AppError.forbidden('Your account is deactivated');
    const court = await prisma.court.findUnique({ where: { id: courtId } });
    if (!court) throw AppError.notFound('Court');
    const existing = await prisma.lawyerCourt.findUnique({
      where: { userId_courtId: { userId, courtId } }
    });
    if (existing && !existing.isActive) {
      return prisma.lawyerCourt.update({
        where: { userId_courtId: { userId, courtId } },
        data: { isActive: true },
        include: { court: { include: { governorate: true } } },
      });
    }
    return prisma.lawyerCourt.upsert({
      where: { userId_courtId: { userId, courtId } },
      update: { isActive: true },
      create: { userId, courtId, isActive: true },
      include: { court: { include: { governorate: true } } },
    });
  }

  static async deactivateLawyer(userId: string, courtId: string) {
    const existing = await prisma.lawyerCourt.findUnique({
      where: { userId_courtId: { userId, courtId } }
    });
    if (!existing) throw AppError.notFound('Court registration');
    return prisma.lawyerCourt.update({
      where: { userId_courtId: { userId, courtId } },
      data: { isActive: false },
    });
  }
}
