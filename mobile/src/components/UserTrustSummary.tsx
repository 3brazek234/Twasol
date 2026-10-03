import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, Shield } from 'lucide-react-native';
import { Avatar } from './Avatar';
import { StarRating } from './StarRating';
import { tokens } from '../theme/tokens';

interface UserTrustSummaryProps {
  name: string;
  verificationStatus?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  compact?: boolean;
}

export const UserTrustSummary = ({
  name,
  verificationStatus,
  averageRating,
  reviewCount,
  compact = false,
}: UserTrustSummaryProps) => {
  const isVerified = verificationStatus === 'APPROVED';
  const rating = Number(averageRating);
  const reviews = Number(reviewCount ?? 0);

  return (
    <View style={styles.container}>
      <Avatar name={name} size={compact ? 32 : 40} bgColor={isVerified ? tokens.colors.verdant : tokens.colors.navy} />
      <View style={styles.details}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, compact && styles.compactName]} numberOfLines={1}>
            {name}
          </Text>
          <View style={[styles.verificationBadge, isVerified ? styles.verifiedBadge : styles.neutralBadge]}>
            {isVerified
              ? <ShieldCheck size={compact ? 13 : 14} color={tokens.colors.verdant} />
              : <Shield size={compact ? 13 : 14} color={tokens.colors.muted} />}
            <Text style={[styles.verificationText, isVerified ? styles.verifiedText : styles.neutralText]}>
              {isVerified
                ? 'موثق'
                : verificationStatus === 'PENDING' || verificationStatus === 'PENDING_UPLOAD'
                  ? 'قيد التحقق'
                  : verificationStatus
                    ? 'غير موثق'
                    : 'غير متاح'}
            </Text>
          </View>
        </View>
        <View style={styles.ratingRow}>
          {reviews > 0 && averageRating != null && Number.isFinite(rating) ? (
            <>
              <StarRating rating={rating} size={compact ? 12 : 14} />
              <Text style={styles.ratingText}>
                {rating.toFixed(1)} · {reviews} {reviews === 1 ? 'تقييم' : 'تقييمات'}
              </Text>
            </>
          ) : reviewCount === 0 ? (
            <Text style={styles.ratingText}>لا توجد تقييمات بعد</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  details: {
    flex: 1,
    minWidth: 0,
    gap: tokens.spacing.xxs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: tokens.spacing.xs,
  },
  name: {
    flexShrink: 1,
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
    textAlign: 'right',
  },
  compactName: {
    fontSize: tokens.typography.sizes.xs,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xxs,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing.xxs,
    borderRadius: tokens.radius.pill,
  },
  verifiedBadge: {
    backgroundColor: tokens.colors.verdantBg,
  },
  neutralBadge: {
    backgroundColor: tokens.colors.surface,
  },
  verificationText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 10,
  },
  verifiedText: {
    color: tokens.colors.verdant,
  },
  neutralText: {
    color: tokens.colors.muted,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: tokens.spacing.xs,
  },
  ratingText: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 10,
  },
});
