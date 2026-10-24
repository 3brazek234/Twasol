import { User } from '@prisma/client';

type SubscriptionFields = Pick<
  User,
  'isActive' | 'subscriptionStatus' | 'subscriptionExpiresAt'
>;

export const hasSubscriptionAccess = (
  user: SubscriptionFields,
  now = new Date(),
): boolean => {
  if (user.subscriptionStatus === 'NOT_REQUIRED') return true;

  return (
    user.isActive &&
    user.subscriptionStatus === 'ACTIVE' &&
    user.subscriptionExpiresAt !== null &&
    user.subscriptionExpiresAt > now
  );
};
