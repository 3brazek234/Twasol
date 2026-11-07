import { describe, it, expect, afterEach } from 'vitest';
import { prisma } from '../../src/prisma';
import { JobsLifecycleService } from '../../src/modules/jobs/jobs.lifecycle.service';
import { v4 as uuidv4 } from 'uuid';

describe('Real-Postgres Trial Concurrency & Ban Seed/Backfill Integration', () => {
  const createdUserIds: string[] = [];
  const createdJobIds: string[] = [];
  const createdCourtIds: string[] = [];
  const createdGovIds: string[] = [];
  const createdAuditIds: string[] = [];

  afterEach(async () => {
    if (createdJobIds.length > 0) {
      await prisma.message.deleteMany({
        where: { conversation: { jobId: { in: createdJobIds } } },
      });
      await prisma.conversationParticipant.deleteMany({
        where: { conversation: { jobId: { in: createdJobIds } } },
      });
      await prisma.conversation.deleteMany({
        where: { jobId: { in: createdJobIds } },
      });
      await prisma.jobApplication.deleteMany({
        where: { jobId: { in: createdJobIds } },
      });
      await prisma.conflictDeclaration.deleteMany({
        where: { jobId: { in: createdJobIds } },
      });
    }
    if (createdUserIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: {
          OR: [
            { actorId: { in: createdUserIds } },
            { entityId: { in: createdUserIds } },
          ],
        },
      });
    }
    if (createdAuditIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: { id: { in: createdAuditIds } },
      });
    }
    if (createdJobIds.length > 0) {
      await prisma.job.deleteMany({
        where: { id: { in: createdJobIds } },
      });
    }
    if (createdCourtIds.length > 0) {
      await prisma.court.deleteMany({
        where: { id: { in: createdCourtIds } },
      });
    }
    if (createdGovIds.length > 0) {
      await prisma.governorate.deleteMany({
        where: { id: { in: createdGovIds } },
      });
    }
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
    createdJobIds.length = 0;
    createdCourtIds.length = 0;
    createdGovIds.length = 0;
    createdAuditIds.length = 0;
    createdUserIds.length = 0;
  });

  it('serializes concurrent apply() calls via pg_advisory_xact_lock when used = 2 so at most 3 applications are created', async () => {
    const suffix = uuidv4().slice(0, 8);
    const gov = await prisma.governorate.create({
      data: {
        nameAr: `محافظة اختبار ${suffix}`,
        nameEn: `Test Gov ${suffix}`,
      },
    });
    createdGovIds.push(gov.id);

    const court = await prisma.court.create({
      data: {
        nameAr: `محكمة اختبار ${suffix}`,
        nameEn: `Test Court ${suffix}`,
        type: 'PRIMARY',
        governorateId: gov.id,
      },
    });
    createdCourtIds.push(court.id);

    const poster = await prisma.user.create({
      data: {
        email: `poster-${suffix}@example.com`,
        passwordHash: 'hashed',
        fullName: 'Poster Lawyer',
        barNumber: `P-${suffix}`,
        role: 'LAWYER',
        isActive: true,
        suspendedAt: null,
        verificationStatus: 'APPROVED',
        subscriptionStatus: 'PENDING_PAYMENT',
      },
    });
    createdUserIds.push(poster.id);

    const trialLawyer = await prisma.user.create({
      data: {
        email: `trial-${suffix}@example.com`,
        passwordHash: 'hashed',
        fullName: 'Trial Lawyer',
        barNumber: `T-${suffix}`,
        role: 'LAWYER',
        isActive: true,
        suspendedAt: null,
        verificationStatus: 'APPROVED',
        subscriptionStatus: 'PENDING_PAYMENT',
        subscriptionExpiresAt: null,
      },
    });
    createdUserIds.push(trialLawyer.id);

    const jobs = await Promise.all(
      [1, 2, 3, 4].map((idx) =>
        prisma.job.create({
          data: {
            title: `Concurrent Trial Job ${idx} ${suffix}`,
            description: 'Test description for concurrent trial serialization',
            taskType: 'ATTEND_SESSION',
            status: 'OPEN',
            postedByUserId: poster.id,
            courtId: court.id,
          },
        }),
      ),
    );
    jobs.forEach((j) => createdJobIds.push(j.id));

    // Seed 2 existing applications so used = 2, remaining = 1
    await prisma.jobApplication.createMany({
      data: [
        { jobId: jobs[0].id, lawyerId: trialLawyer.id, status: 'PENDING' },
        { jobId: jobs[1].id, lawyerId: trialLawyer.id, status: 'PENDING' },
      ],
    });

    // Fire 2 concurrent applies to job 3 and job 4 when only 1 free slot remains
    const results = await Promise.allSettled([
      JobsLifecycleService.apply(jobs[2].id, trialLawyer.id, '127.0.0.1', true),
      JobsLifecycleService.apply(jobs[3].id, trialLawyer.id, '127.0.0.1', true),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatchObject({
      code: 'SUBSCRIPTION_REQUIRED',
      statusCode: 403,
      details: {
        trial: { limit: 3, used: 3, remaining: 0 },
      },
    });

    const totalApplications = await prisma.jobApplication.count({
      where: { lawyerId: trialLawyer.id },
    });
    expect(totalApplications).toBe(3);

    // Re-applying to the job that succeeded (when used = 3, remaining = 0) must return
    // the existing application & conversationId idempotently and consume no additional slot
    const firstSuccess = (
      fulfilled[0] as PromiseFulfilledResult<
        Awaited<ReturnType<typeof JobsLifecycleService.apply>>
      >
    ).value;
    const reapplyRes = await JobsLifecycleService.apply(
      firstSuccess.application.jobId,
      trialLawyer.id,
      '127.0.0.1',
      true,
    );
    expect(reapplyRes.application.id).toBe(firstSuccess.application.id);
    expect(reapplyRes.conversationId).toBe(firstSuccess.conversationId);

    const totalApplicationsAfterReapply = await prisma.jobApplication.count({
      where: { lawyerId: trialLawyer.id },
    });
    expect(totalApplicationsAfterReapply).toBe(3);
  });

  it('correctly seeds suspended_at from audit_logs and excludes suspended & deleted users from C4 backfill', async () => {
    const suffix = uuidv4().slice(0, 8);

    // 1. Banned user: latest audit event is user.deactivated
    const bannedUser = await prisma.user.create({
      data: {
        email: `banned-${suffix}@example.com`,
        passwordHash: 'hashed',
        fullName: 'Banned User',
        barNumber: `B-${suffix}`,
        role: 'LAWYER',
        isActive: false,
        suspendedAt: null,
        verificationStatus: 'APPROVED',
        subscriptionStatus: 'PENDING_PAYMENT',
      },
    });
    createdUserIds.push(bannedUser.id);

    // 2. Re-activated user: deactivated then later activated
    const reactivatedUser = await prisma.user.create({
      data: {
        email: `reactivated-${suffix}@example.com`,
        passwordHash: 'hashed',
        fullName: 'Reactivated User',
        barNumber: `R-${suffix}`,
        role: 'LAWYER',
        isActive: false,
        suspendedAt: null,
        verificationStatus: 'APPROVED',
        subscriptionStatus: 'PENDING_PAYMENT',
      },
    });
    createdUserIds.push(reactivatedUser.id);

    // 3. Approved unpaid lawyer: is_active = false from legacy verification approval, never banned
    const approvedUnpaidUser = await prisma.user.create({
      data: {
        email: `unpaid-${suffix}@example.com`,
        passwordHash: 'hashed',
        fullName: 'Approved Unpaid User',
        barNumber: `U-${suffix}`,
        role: 'LAWYER',
        isActive: false,
        suspendedAt: null,
        verificationStatus: 'APPROVED',
        subscriptionStatus: 'PENDING_PAYMENT',
      },
    });
    createdUserIds.push(approvedUnpaidUser.id);

    // 4. Soft-deleted user: deleted_at is set
    const deletedUser = await prisma.user.create({
      data: {
        email: `deleted-${suffix}@example.com`,
        passwordHash: 'hashed',
        fullName: 'Deleted User',
        barNumber: `D-${suffix}`,
        role: 'LAWYER',
        isActive: false,
        suspendedAt: null,
        deletedAt: new Date(),
        verificationStatus: 'APPROVED',
        subscriptionStatus: 'PENDING_PAYMENT',
      },
    });
    createdUserIds.push(deletedUser.id);

    const t1 = new Date('2026-09-30T00:12:00.000Z');
    const t2 = new Date('2026-09-30T00:15:00.000Z');

    const audit1 = await prisma.auditLog.create({
      data: {
        action: 'user.deactivated',
        entityType: 'User',
        entityId: bannedUser.id,
        after: { isActive: false, reason: 'Admin ban' },
        createdAt: t1,
      },
    });
    const audit2 = await prisma.auditLog.create({
      data: {
        action: 'user.deactivated',
        entityType: 'User',
        entityId: reactivatedUser.id,
        after: { isActive: false, reason: 'Temporary ban' },
        createdAt: t1,
      },
    });
    const audit3 = await prisma.auditLog.create({
      data: {
        action: 'user.activated',
        entityType: 'User',
        entityId: reactivatedUser.id,
        after: { isActive: true },
        createdAt: t2,
      },
    });
    createdAuditIds.push(audit1.id, audit2.id, audit3.id);

    // Run the exact seed SQL from 20261107000001_seed_suspended_at
    await prisma.$executeRaw`
      WITH latest_admin_action AS (
        SELECT DISTINCT ON (entity_id)
          entity_id AS user_id,
          action,
          created_at
        FROM audit_logs
        WHERE entity_type = 'User'
          AND action IN ('user.deactivated', 'user.activated')
        ORDER BY entity_id, created_at DESC
      )
      UPDATE users u
      SET suspended_at = la.created_at
      FROM latest_admin_action la
      WHERE u.id = la.user_id
        AND la.action = 'user.deactivated'
        AND u.deleted_at IS NULL
        AND u.suspended_at IS NULL
        AND u.id IN (${bannedUser.id}, ${reactivatedUser.id}, ${approvedUnpaidUser.id}, ${deletedUser.id})
    `;

    // Run the C4 backfill SQL scoped to these 4 test users
    await prisma.$executeRaw`
      UPDATE users
      SET is_active = true
      WHERE is_active = false
        AND deleted_at IS NULL
        AND suspended_at IS NULL
        AND verification_status = 'APPROVED'
        AND id IN (${bannedUser.id}, ${reactivatedUser.id}, ${approvedUnpaidUser.id}, ${deletedUser.id})
    `;

    const [bannedAfter, reactivatedAfter, unpaidAfter, deletedAfter] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: bannedUser.id } }),
      prisma.user.findUniqueOrThrow({ where: { id: reactivatedUser.id } }),
      prisma.user.findUniqueOrThrow({ where: { id: approvedUnpaidUser.id } }),
      prisma.user.findUniqueOrThrow({ where: { id: deletedUser.id } }),
    ]);

    expect(bannedAfter.suspendedAt?.toISOString()).toBe(t1.toISOString());
    expect(bannedAfter.isActive).toBe(false);

    expect(reactivatedAfter.suspendedAt).toBeNull();
    expect(reactivatedAfter.isActive).toBe(true);

    expect(unpaidAfter.suspendedAt).toBeNull();
    expect(unpaidAfter.isActive).toBe(true);

    expect(deletedAfter.suspendedAt).toBeNull();
    expect(deletedAfter.isActive).toBe(false);
  });
});
