import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { tokens } from '../../theme/tokens';
import { StatusPill } from '../StatusPill';
import { formatDate, formatCurrency } from '../../utils/dateUtils';

interface PostedJobCardProps {
  job: {
    id: string;
    title: string;
    description?: string;
    taskType?: string;
    status: string;
    salaryMin?: number;
    salaryMax?: number;
    agreedSalary?: number;
    expiresAt?: string;
    createdAt: string;
    courtNameAr?: string;
    courtGovernorate?: string;
    applications?: Array<{ id: string; status: string }>;
    _count?: { applications: number };
  };
  onPress: (jobId: string) => void;
  onViewApplications?: (jobId: string) => void;
  onOpenChat?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
  onComplete?: (job: any) => void;
}

export const PostedJobCard = ({
  job,
  onPress,
  onViewApplications,
  onOpenChat,
  onCancel,
  onComplete,
}: PostedJobCardProps) => {
  const pendingCount = job.applications?.filter((a: any) => a.status === 'PENDING').length || 0;
  const totalApplications = job._count?.applications ?? job.applications?.length ?? 0;
  
  const courtGovText = [job.courtNameAr, job.courtGovernorate].filter(Boolean).join(' • ');

  let feeText = '';
  if (job.agreedSalary) {
    feeText = formatCurrency(job.agreedSalary);
  } else if (job.salaryMin && job.salaryMax) {
    if (job.salaryMin === job.salaryMax) {
      feeText = formatCurrency(job.salaryMin);
    } else {
      feeText = `${formatCurrency(job.salaryMin)} - ${formatCurrency(job.salaryMax)}`;
    }
  } else if (job.salaryMin) {
    feeText = formatCurrency(job.salaryMin);
  } else {
    feeText = 'غير محدد';
  }

  // Pulsing dot animation
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (pendingCount > 0) {
      opacity.value = withRepeat(
        withTiming(0.3, { duration: 1000 }),
        -1,
        true
      );
    } else {
      opacity.value = 1;
    }
  }, [pendingCount, opacity]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const renderButtons = () => {
    switch (job.status) {
      case 'OPEN':
        return (
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonNavy]} 
              onPress={() => onViewApplications?.(job.id)}
            >
              <Text style={styles.buttonTextWhite}>عرض الطلبات</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.buttonGhostCrimson]} 
              onPress={() => onCancel?.(job.id)}
            >
              <Text style={styles.buttonTextCrimson}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        );
      case 'NEGOTIATING':
      case 'AGREED':
        return (
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonNavy]} 
              onPress={() => onViewApplications?.(job.id)}
            >
              <Text style={styles.buttonTextWhite}>عرض الطلبات</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.buttonNavyOutline]} 
              onPress={() => onOpenChat?.(job.id)}
            >
              <Text style={styles.buttonTextNavy}>فتح المحادثة</Text>
            </TouchableOpacity>
          </View>
        );
      case 'IN_PROGRESS':
        return (
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonGold]} 
              onPress={() => onComplete?.(job)}
            >
              <Text style={styles.buttonTextWhite}>تأكيد الإتمام ✓</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.buttonNavyOutline]} 
              onPress={() => onOpenChat?.(job.id)}
            >
              <Text style={styles.buttonTextNavy}>فتح المحادثة</Text>
            </TouchableOpacity>
          </View>
        );
      case 'COMPLETED':
      case 'CANCELLED':
      default:
        return (
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonNavyOutline, { flex: 1 }]} 
              onPress={() => onPress(job.id)}
            >
              <Text style={styles.buttonTextNavy}>عرض التفاصيل</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress(job.id)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.courtGov} numberOfLines={1}>
          {courtGovText || 'غير محدد'}
        </Text>
        <StatusPill status={job.status as any} />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {job.title}
      </Text>
      
      <Text style={styles.fee}>
        {feeText}
      </Text>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoText}>
            📅 {job.expiresAt ? formatDate(job.expiresAt) : formatDate(job.createdAt)}
          </Text>
        </View>
        <View style={styles.infoItem}>
          {pendingCount > 0 && (
            <Animated.View style={[styles.pulsingDot, dotStyle]} />
          )}
          <Text style={styles.infoText}>
            👥 {totalApplications} طلبات تقديم
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {renderButtons()}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courtGov: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 12,
    flex: 1,
    marginLeft: 8,
    textAlign: 'left',
  },
  title: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'left',
  },
  fee: {
    color: tokens.colors.gold,
    fontFamily: tokens.typography.fonts.mono,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'left',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 12,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.gold,
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.line,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonNavy: {
    backgroundColor: tokens.colors.navy,
  },
  buttonGhostCrimson: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.colors.crimson,
  },
  buttonNavyOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.colors.navy,
  },
  buttonGold: {
    backgroundColor: tokens.colors.gold,
  },
  buttonTextWhite: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14,
  },
  buttonTextCrimson: {
    color: tokens.colors.crimson,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14,
  },
  buttonTextNavy: {
    color: tokens.colors.navy,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14,
  },
});
