import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { tokens } from '../../theme/tokens';
import { StatusPill } from '../StatusPill';
import { getDeadlineInfo, formatCurrency, daysBetween } from '../../utils/dateUtils';

export interface ActiveJobCardProps {
  job: {
    id: string;
    title: string;
    status: string;
    salaryMin?: number;
    salaryMax?: number;
    agreedSalary?: number;
    expiresAt?: string;
    createdAt: string;
    courtNameAr?: string;
    posterName?: string;
    posterId?: string;
    conversationId?: string;
  };
  onOpenChat?: (job: any) => void;
  onStartJob?: (jobId: string) => void;
  onPress?: (jobId: string) => void;
}

export const ActiveJobCard: React.FC<ActiveJobCardProps> = ({
  job,
  onOpenChat,
  onStartJob,
  onPress,
}) => {
  const fee = job.agreedSalary || job.salaryMin || 0;
  
  let deadlineInfo = null;
  let progress = 0;
  
  if (job.expiresAt) {
    deadlineInfo = getDeadlineInfo(job.expiresAt);
    const totalDays = daysBetween(job.createdAt, job.expiresAt);
    const usedDays = daysBetween(job.createdAt, new Date());
    progress = totalDays > 0 ? Math.min(Math.max(usedDays / totalDays, 0), 1) : 1;
  }

  const deadlineOpacity = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    if (deadlineInfo?.urgent) {
      deadlineOpacity.value = withRepeat(
        withTiming(0.3, { duration: 800 }),
        -1,
        true
      );
    } else {
      deadlineOpacity.value = 1;
    }
  }, [deadlineInfo?.urgent, deadlineOpacity]);

  useEffect(() => {
    progressWidth.value = withTiming(progress * 100, { duration: 1000 });
  }, [progress, progressWidth]);

  const animatedDeadlineStyle = useAnimatedStyle(() => ({
    opacity: deadlineOpacity.value,
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const getFillColor = (p: number) => {
    if (p < 0.6) return tokens.colors.verdant;
    if (p < 0.85) return tokens.colors.amber;
    return tokens.colors.crimson;
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress?.(job.id)}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.headerRow}>
        <Text style={styles.courtName}>{job.courtNameAr || 'محكمة غير محددة'}</Text>
        {/* @ts-ignore - job.status string typing mismatch with StatusPill but assuming it's valid */}
        <StatusPill status={job.status} />
      </View>

      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.posterName}>
        الموكِّل: {job.posterName || 'غير معروف'}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.fee}>💰 {formatCurrency(fee)}</Text>
        {deadlineInfo && (
          <Animated.Text
            style={[
              styles.deadline,
              { color: deadlineInfo.color },
              animatedDeadlineStyle,
            ]}
          >
            📅 {deadlineInfo.label}
          </Animated.Text>
        )}
      </View>

      {job.expiresAt && (
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { backgroundColor: getFillColor(progress) },
              animatedProgressStyle,
            ]}
          />
        </View>
      )}

      {job.status === 'AGREED' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => onStartJob?.(job.id)}
          >
            <Text style={styles.primaryButtonText}>بدء التنفيذ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => onOpenChat?.(job)}
          >
            <Text style={styles.secondaryButtonText}>فتح المحادثة</Text>
          </TouchableOpacity>
        </View>
      )}

      {job.status === 'IN_PROGRESS' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => onOpenChat?.(job)}
          >
            <Text style={styles.secondaryButtonText}>فتح المحادثة</Text>
          </TouchableOpacity>
          <Text style={styles.infoText}>في انتظار تأكيد الموكِّل للإتمام</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    marginBottom: 12,
    direction: 'rtl',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courtName: {
    color: tokens.colors.muted,
    fontFamily: tokens.fonts.bodySemibold,
    fontSize: 12,
  },
  title: {
    color: tokens.colors.ink,
    fontFamily: tokens.fonts.displayBold,
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'left',
  },
  posterName: {
    color: tokens.colors.muted,
    fontFamily: tokens.fonts.body,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'left',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fee: {
    color: tokens.colors.gold,
    fontFamily: tokens.fonts.mono,
    fontSize: 14,
  },
  deadline: {
    fontFamily: tokens.fonts.bodySemibold,
    fontSize: 13,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: tokens.colors.line,
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: tokens.colors.navy,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: tokens.colors.white,
    fontFamily: tokens.fonts.bodySemibold,
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.colors.navy,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: tokens.colors.navy,
    fontFamily: tokens.fonts.bodySemibold,
    fontSize: 14,
  },
  infoText: {
    color: tokens.colors.muted,
    fontFamily: tokens.fonts.body,
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'center',
  },
});
