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
    const cacheKey = `courts:list:v2:${page}:${limit}:${type || 'all'}:${governorateId || 'all'}`;
    return getCached(cacheKey, async () => {
      const where: any = {};
      if (type) where.type = type;
      if (governorateId) where.governorateId = governorateId;
      const [items, total] = await Promise.all([
        prisma.court.findMany({
          where,
          include: { 
            governorate: true,
            _count: {
              select: {
                lawyers: {
                  where: {
                    isActive: true,
                    user: {
                      verificationStatus: 'APPROVED',
                      isActive: true,
                      deletedAt: null,
                    },
                  },
                },
              },
            },
          },
          orderBy: [{ type: 'asc' }, { nameAr: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.court.count({ where }),
      ]);
      
      const mappedItems = items.map(c => ({
        id: c.id,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        type: c.type,
        governorateId: c.governorateId,
        governorateName: c.governorate?.nameAr,
        lawyerCount: c._count?.lawyers || 0,
      }));
      
      return paginate(mappedItems, total, page, limit);
    }, 60); // 60s TTL since counts change more frequently than court metadata
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

  static async getLawyers(courtId: string, page = 1, limit = 20) {
    // Make sure the court exists
    const court = await prisma.court.findUnique({ where: { id: courtId } });
    if (!court) throw AppError.notFound('Court');

    // Use raw query for aggregating averageRating and totalReviews optimally
    const offset = (page - 1) * limit;
    
    // We only fetch lawyers whose LawyerCourt record is active AND user is active/verified/not deleted
    const lawyers = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u.full_name AS "fullName", 
        u.bar_number AS "barNumber", 
        COALESCE(ROUND(AVG(r.rating), 1), 0) AS "averageRating",
        COUNT(r.id) AS "totalReviews"
      FROM users u
      JOIN lawyer_courts lc ON lc.user_id = u.id
      LEFT JOIN reviews r ON r.reviewee_id = u.id
      WHERE lc.court_id = ${courtId}
        AND lc.is_active = true
        AND u.verification_status = 'APPROVED'
        AND u.is_active = true
        AND u.deleted_at IS NULL
      GROUP BY u.id
      ORDER BY "averageRating" DESC, "totalReviews" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Count total for pagination
    const totalResult: any = await prisma.$queryRaw`
      SELECT COUNT(u.id) as count
      FROM users u
      JOIN lawyer_courts lc ON lc.user_id = u.id
      WHERE lc.court_id = ${courtId}
        AND lc.is_active = true
        AND u.verification_status = 'APPROVED'
        AND u.is_active = true
        AND u.deleted_at IS NULL
    `;
    const total = Number(totalResult[0]?.count || 0);

    return paginate(lawyers as any[], total, page, limit);
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
