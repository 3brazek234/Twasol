import { User } from '@prisma/client';
import { prisma } from '../../prisma';
import { env } from '../../env';

export type AppAccessFields = {
  deletedAt?: Date | null;
  suspendedAt?: Date | null;
};

export const canUseApp = (
  user: AppAccessFields | null | undefined,
): user is AppAccessFields => {
  if (!user) return false;
  return !user.deletedAt && !user.suspendedAt;
};

type SubscriptionFields = AppAccessFields &
  Pick<User, 'subscriptionStatus' | 'subscriptionExpiresAt'>;

export const hasSubscriptionAccess = (
  user: SubscriptionFields | null | undefined,
  now = new Date(),
): boolean => {
  if (!canUseApp(user)) return false;
  if (user.subscriptionStatus === 'NOT_REQUIRED') return true;

  return (
    user.subscriptionStatus === 'ACTIVE' &&
    user.subscriptionExpiresAt !== null &&
    user.subscriptionExpiresAt > now
  );
};

export interface TrialStatus {
  limit: number;
  used: number;
  remaining: number;
}

export const getTrialStatus = async (
  userId: string,
  tx: Pick<typeof prisma, 'jobApplication'> = prisma,
): Promise<TrialStatus> => {
  const limit = env.FREE_JOBS_LIMIT;
  const used = await tx.jobApplication.count({ where: { lawyerId: userId } });
  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
  };
};

