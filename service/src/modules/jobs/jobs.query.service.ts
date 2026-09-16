import { SAFE_USER_SELECT } from '../users/user-safe-fields';
import { prisma } from '../../prisma';
import { AppError } from '../../common/errors/AppError';
import { Prisma } from '@prisma/client';
import { paginate } from '../../common/schemas/pagination.schema';

export class JobsQueryService {
  static async list({
    page,
    limit,
    status,
    courtId,
    search,
  }: {
    page: number;
    limit: number;
    status?: string;
    courtId?: string;
    search?: string;
  }) {
    const where: Prisma.JobWhereInput = {
      // By default, only list OPEN jobs for public feed unless filtering
      ...(status ? { status: status as any } : { status: "OPEN" }),
    };

    if (courtId) {
      where.courtId = courtId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          court: true,
          // Gap 1: expose poster name so the feed card can show who posted the job
          postedBy: { select: { fullName: true } },
          // Gap 2: expose application count for competition signal on feed cards
          _count: { select: { applications: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    const mappedItems = items.map(item => ({
      ...item,
      courtNameAr: item.court?.nameAr,
      courtNameEn: item.court?.nameEn,
      posterName: item.postedBy?.fullName ?? null,           // Gap 1
      applicantCount: item._count?.applications ?? 0,        // Gap 2
    }));

    return paginate(mappedItems, total, page, limit);
  }

  static async getById(id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        court: true,
        applications: { include: { lawyer: { select: SAFE_USER_SELECT } } },
        postedBy: { select: SAFE_USER_SELECT },
        assignedLawyer: { select: SAFE_USER_SELECT },
      },
    });
    if (!job) throw AppError.notFound("Job");
    return job;
  }

  static async getMyJobs(userId: string) {
    const [posted, assigned] = await Promise.all([
      prisma.job.findMany({ 
        where: { postedByUserId: userId },
        include: {
          applications: { select: { id: true, status: true } },
          court: true,
          // Gap 3: expose hired lawyer name for AGREED/IN_PROGRESS posted cards
          assignedLawyer: { select: { fullName: true } },
        }
      }),
      prisma.job.findMany({
        where: {
          applications: {
            some: {
              lawyerId: userId,
              status: "ACCEPTED",
            },
          },
        },
      }),
    ]);
    return { posted, assigned };
  }

  static async getJobsByLawyerId(lawyerId: string) {
    const jobs = await prisma.job.findMany({ 
      where: { 
        OR: [
          { applications: { some: { lawyerId } } },
          { assignedLawyerId: lawyerId }
        ]
      } 
    });
    return jobs;
  }

  static async getMyActiveJobs(userId: string) {
    const jobs = await prisma.job.findMany({
      where: {
        status: { in: ['AGREED', 'IN_PROGRESS'] },
        OR: [
          { postedByUserId: userId },
          { assignedLawyerId: userId },
          {
            applications: {
              some: { lawyerId: userId, status: 'ACCEPTED' }
            }
          }
        ]
      },
      include: {
        postedBy: { select: { fullName: true } },
        court: { select: { nameAr: true, governorate: true } },
        conversations: { select: { id: true } },
        assignedLawyer: { select: { fullName: true } }
      },
      orderBy: { expiresAt: 'asc' }
    });
    
    // Map to required response shape
    return jobs.map(j => {
      const isPoster = j.postedByUserId === userId;
      return {
        id: j.id,
        title: j.title,
        description: j.description,
        task_type: "UNKNOWN",
        fee: j.agreedSalary || j.salaryMax || 0,
        deadline: j.expiresAt,
        status: j.status,
        created_at: j.createdAt,
        poster_name: isPoster ? (j.assignedLawyer?.fullName || 'المحامي') : (j.postedBy?.fullName || 'Unknown'),
        court_name: j.court?.nameAr || 'Unknown',
        court_governorate: j.court?.governorate?.nameAr || 'Unknown',
        conversationId: j.conversations[0]?.id || null,
        // Gap 4: elapsed-time calculation needs the start timestamp
        agreedAt: j.agreedAt ?? null,
        // Gap 5: fee strike-through needs the original asking fee
        salaryMin: j.salaryMin !== null && j.salaryMin !== undefined ? Number(j.salaryMin) : null,
      };
    });
  }
}
