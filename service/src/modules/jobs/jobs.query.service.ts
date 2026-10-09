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
    taskType,
    sortBy = 'newest',
    userId,
    role,
  }: {
    page: number;
    limit: number;
    status?: string;
    courtId?: string;
    taskType?: string;
    sortBy?: 'newest' | 'fee_desc' | 'deadline_asc';
    userId: string;
    role: string;
  }) {
    let isLawyerWithRestrictedCourts = false;
    let userCourtIds: string[] = [];

    // If no specific courtId is requested, and the user is a lawyer, restrict to their registered courts
    if (!courtId && role === 'LAWYER') {
      isLawyerWithRestrictedCourts = true;
      const userCourts = await prisma.lawyerCourt.findMany({
        where: { userId, isActive: true },
        select: { courtId: true }
      });
      userCourtIds = userCourts.map(c => c.courtId);
      
      // If a lawyer has no registered courts, they shouldn't see any jobs
      if (userCourtIds.length === 0) {
        return paginate([], 0, page, limit);
      }
    }
    const SORT_MAP: Record<string, Prisma.JobOrderByWithRelationInput> = {
      newest: { createdAt: 'desc' },
      fee_desc: { salaryMax: 'desc' },
      deadline_asc: { expiresAt: 'asc' },
    };

    let items: any[] = [];
    let total = 0;

    // ─── STANDARD FILTER & SORT PATH ───────────────────────────────────────
    // Privacy guard: the public feed ONLY ever shows OPEN jobs. Any `status`
    // query param (e.g. a stale client sending NEGOTIATING) is intentionally
    // ignored — participants see their non-OPEN jobs via /jobs/my-jobs.
    void status;
    const where: Prisma.JobWhereInput = { status: "OPEN" };

    if (courtId) {
      where.courtId = courtId;
    } else if (isLawyerWithRestrictedCourts) {
      where.courtId = { in: userCourtIds };
    }
    if (taskType) where.taskType = taskType as any;

    const orderBy = SORT_MAP[sortBy] || SORT_MAP['newest'];

    const [prismaItems, prismaTotal] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          court: true,
          postedBy: { select: { fullName: true } },
          _count: { select: { applications: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);
    items = prismaItems;
    total = prismaTotal;


    const mappedItems = items.map(item => ({
      ...item,
      courtNameAr: item.court?.nameAr,
      courtNameEn: item.court?.nameEn,
      posterName: item.postedBy?.fullName ?? null,
      applicantCount: item._count?.applications ?? 0,
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
        where: { assignedLawyerId: userId },
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
