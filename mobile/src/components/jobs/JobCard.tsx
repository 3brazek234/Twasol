import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, interpolateColor } from "react-native-reanimated";
import { tokens } from "../../theme/tokens";
import { StatusPill } from "../StatusPill";
import { getDeadlineInfo, formatCurrency, daysBetween } from "../../utils/dateUtils";

interface JobCardProps {
  job: any;
  variant: "feed" | "posted" | "active" | "compact";
  onPress?: (jobId: string) => void;
  onViewApplications?: (jobId: string) => void;
  onOpenChat?: (job: any) => void;
  onCancel?: (jobId: string) => void;
  onComplete?: (job: any) => void;
  onStartJob?: (jobId: string) => void;
  onReview?: (jobId: string) => void;
  hasReviewed?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const JobCard: React.FC<JobCardProps> = ({
  job,
  variant,
  onPress,
  onViewApplications,
  onOpenChat,
  onCancel,
  onComplete,
  onStartJob,
  onReview,
  hasReviewed = false,
}) => {
  const fee = job.agreedSalary || job.salaryMin || 0;
  
  // Status change animation tracking
  const prevStatusRef = React.useRef(job.status);
  const flashValue = useSharedValue(0);

  useEffect(() => {
    if (prevStatusRef.current !== job.status) {
      prevStatusRef.current = job.status;
      flashValue.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 800 })
      );
    }
  }, [job.status, flashValue]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEGOTIATING": return tokens.colors.amber;
      case "IN_PROGRESS": return tokens.colors.verdant;
      case "EXPIRED": return tokens.colors.crimson;
      default: return tokens.colors.navy;
    }
  };

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor: interpolateColor(
        flashValue.value,
        [0, 1],
        [tokens.colors.line, getStatusColor(job.status)]
      ),
      borderWidth: flashValue.value > 0.01 ? 2 : 1, // slightly thicker when flashing
    };
  });

  let deadlineInfo = null;
  let progress = 0;
  
  if (job.expiresAt && variant === "active") {
    deadlineInfo = getDeadlineInfo(job.expiresAt);
    const totalDays = daysBetween(job.createdAt, job.expiresAt);
    const usedDays = daysBetween(job.createdAt, new Date());
    progress = totalDays > 0 ? Math.min(Math.max(usedDays / totalDays, 0), 1) : 1;
  } else if (job.expiresAt) {
    deadlineInfo = getDeadlineInfo(job.expiresAt);
  }

  const getProgressColor = (p: number) => {
    if (p < 0.6) return tokens.colors.verdant;
    if (p < 0.85) return tokens.colors.amber;
    return tokens.colors.crimson;
  };

  const courtName = job.courtNameAr || job.court?.nameAr || "محكمة غير محددة";
  const govName = job.court?.governorate?.nameAr ? ` - ${job.court.governorate.nameAr}` : "";

  const isCompact = variant === "compact";

  return (
    <AnimatedTouchableOpacity 
      style={[styles.card, isCompact && styles.cardCompact, animatedBorderStyle]} 
      onPress={() => onPress?.(job.id)}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.courtName, isCompact && styles.courtNameCompact]} numberOfLines={1}>
          {courtName}{govName}
        </Text>
        <StatusPill status={job.status || "OPEN"} />
      </View>

      <Text style={[styles.title, isCompact && styles.titleCompact]} numberOfLines={2}>{job.title}</Text>

      {!isCompact && (variant === "feed" || variant === "active") && (
        <Text style={styles.posterName} numberOfLines={1}>
          الموكِّل: {job.posterName || job.postedBy?.fullName || "غير معروف"}
        </Text>
      )}

      <View style={[styles.metaRow, isCompact && { marginTop: 4, marginBottom: 0 }]}>
        <Text style={[styles.fee, isCompact && styles.feeCompact]}>💰 {formatCurrency(fee)}</Text>
        
        {!isCompact && variant === "posted" && job._count?.applications !== undefined && (
          <Text style={styles.applicantBadge}>
            👥 {job._count.applications} {job._count.applications === 1 ? "متقدم" : "متقدمين"}
          </Text>
        )}

        {!isCompact && deadlineInfo && (
          <Text style={[styles.deadline, { color: deadlineInfo.color }]}>
            📅 {deadlineInfo.label}
          </Text>
        )}
      </View>

      {!isCompact && variant === "active" && job.expiresAt && (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { backgroundColor: getProgressColor(progress), width: `${progress * 100}%` },
            ]}
          />
        </View>
      )}

      {!isCompact && variant === "feed" && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => onPress?.(job.id)}>
            <Text style={styles.primaryButtonText}>عرض التفاصيل</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isCompact && variant === "posted" && (
        <View style={styles.actionRow}>
          {job.status === "OPEN" && (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={() => onViewApplications?.(job.id)}>
                <Text style={styles.primaryButtonText}>عرض الطلبات</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryButton, { borderColor: tokens.colors.crimson }]} onPress={() => onCancel?.(job.id)}>
                <Text style={[styles.secondaryButtonText, { color: tokens.colors.crimson }]}>إلغاء</Text>
              </TouchableOpacity>
            </>
          )}
          {(job.status === "NEGOTIATING" || job.status === "AGREED") && (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={() => onViewApplications?.(job.id)}>
                <Text style={styles.primaryButtonText}>عرض الطلبات</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => onOpenChat?.(job)}>
                <Text style={styles.secondaryButtonText}>فتح المحادثة</Text>
              </TouchableOpacity>
            </>
          )}
          {job.status === "IN_PROGRESS" && (
            <>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tokens.colors.gold }]} onPress={() => onComplete?.(job)}>
                <Text style={styles.primaryButtonText}>تأكيد الإتمام ✓</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => onOpenChat?.(job)}>
                <Text style={styles.secondaryButtonText}>فتح المحادثة</Text>
              </TouchableOpacity>
            </>
          )}
          {job.status === "COMPLETED" && (
            <>
              {hasReviewed ? (
                <View style={styles.reviewedBadge}>
                  <Text style={styles.reviewedBadgeText}>تقييمك: ★★★★★</Text>
                </View>
              ) : (
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tokens.colors.gold }]} onPress={() => onReview?.(job.id)}>
                  <Text style={styles.primaryButtonText}>قيّم المحامي ⭐</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.secondaryButton} onPress={() => onPress?.(job.id)}>
                <Text style={styles.secondaryButtonText}>عرض التفاصيل</Text>
              </TouchableOpacity>
            </>
          )}
          {(job.status === "CANCELLED" || job.status === "EXPIRED") && (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => onPress?.(job.id)}>
              <Text style={styles.secondaryButtonText}>عرض التفاصيل</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!isCompact && variant === "active" && (
        <View style={styles.actionRow}>
          {job.status === "AGREED" && (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={() => onStartJob?.(job.id)}>
                <Text style={styles.primaryButtonText}>بدء التنفيذ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => onOpenChat?.(job)}>
                <Text style={styles.secondaryButtonText}>فتح المحادثة</Text>
              </TouchableOpacity>
            </>
          )}
          {job.status === "IN_PROGRESS" && (
            <>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => onOpenChat?.(job)}>
                <Text style={styles.secondaryButtonText}>فتح المحادثة</Text>
              </TouchableOpacity>
              <Text style={styles.infoText}>في انتظار تأكيد الموكِّل للإتمام</Text>
            </>
          )}
          {job.status === "COMPLETED" && (
            <>
              {hasReviewed ? (
                <View style={styles.reviewedBadge}>
                  <Text style={styles.reviewedBadgeText}>تقييمك: ★★★★★</Text>
                </View>
              ) : (
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tokens.colors.gold }]} onPress={() => onReview?.(job.id)}>
                  <Text style={styles.primaryButtonText}>قيّم الموكِّل ⭐</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.secondaryButton} onPress={() => onPress?.(job.id)}>
                <Text style={styles.secondaryButtonText}>عرض التفاصيل</Text>
              </TouchableOpacity>
            </>
          )}
          {(job.status === "CANCELLED" || job.status === "EXPIRED") && (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => onPress?.(job.id)}>
              <Text style={styles.secondaryButtonText}>عرض التفاصيل</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Terminal State Footer */}
      {!isCompact && job.status === "CANCELLED" && (
        <Text style={styles.terminalFooterText}>تم الإلغاء بواسطة الموكِّل</Text>
      )}
      {!isCompact && job.status === "EXPIRED" && (
        <Text style={[styles.terminalFooterText, { color: tokens.colors.crimson }]}>
          {job.agreedAt ? "انتهت المهلة أثناء التنفيذ" : "انتهت المهلة دون اتفاق"}
        </Text>
      )}
    </AnimatedTouchableOpacity>
  );
};

export default React.memo(JobCard, (prev, next) => {
  return (
    prev.job.id === next.job.id &&
    prev.job.status === next.job.status &&
    prev.job.version === next.job.version &&
    prev.variant === next.variant &&
    prev.hasReviewed === next.hasReviewed
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    marginBottom: 12,
    direction: "rtl",
    ...tokens.shadows.sm,
  },
  cardCompact: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  courtName: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 12,
    flex: 1,
    textAlign: "right",
    paddingLeft: 8,
  },
  courtNameCompact: {
    fontSize: 11,
  },
  title: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: 16,
    marginBottom: 4,
    textAlign: "right",
  },
  titleCompact: {
    fontSize: 14,
    marginBottom: 0,
  },
  posterName: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 13,
    marginBottom: 12,
    textAlign: "right",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  fee: {
    color: tokens.colors.gold,
    fontFamily: tokens.typography.fonts.mono,
    fontSize: 14,
  },
  feeCompact: {
    fontSize: 13,
  },
  applicantBadge: {
    backgroundColor: tokens.colors.paper,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.navy,
    overflow: "hidden",
  },
  deadline: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 13,
  },
  progressBarContainer: {
    width: "100%",
    height: 4,
    backgroundColor: tokens.colors.line,
    borderRadius: 2,
    marginTop: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: tokens.colors.navy,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  primaryButtonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: tokens.colors.navy,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: tokens.colors.navy,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14,
  },
  infoText: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 12,
    fontStyle: "italic",
    flex: 1,
    textAlign: "center",
  },
  terminalFooterText: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  reviewedBadge: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  reviewedBadgeText: {
    color: tokens.colors.gold,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14,
  },
});
