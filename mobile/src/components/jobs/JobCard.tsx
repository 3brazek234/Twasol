import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { tokens } from "../../theme/tokens";
import { StatusPill } from "../StatusPill";
import { getDeadlineInfo, formatCurrency, daysBetween } from "../../utils/dateUtils";

interface JobCardProps {
  job: any;
  variant: "feed" | "posted" | "active" | "compact";
  onPress?: (jobId: string) => void;
  // Specific callbacks for standard buttons across states
  onViewApplications?: (jobId: string) => void;
  onOpenChat?: (job: any) => void;
  onCancel?: (jobId: string) => void;
  onComplete?: (job: any) => void;
  onStartJob?: (jobId: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  variant,
  onPress,
  onViewApplications,
  onOpenChat,
  onCancel,
  onComplete,
  onStartJob,
}) => {
  const fee = job.agreedSalary || job.salaryMin || 0;
  
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

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onPress?.(job.id)}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Shared Header: Court + Status */}
      <View style={styles.headerRow}>
        <Text style={styles.courtName} numberOfLines={1}>
          {courtName}{govName}
        </Text>
        <StatusPill status={job.status || "OPEN"} />
      </View>

      {/* Shared Title */}
      <Text style={styles.title} numberOfLines={2}>{job.title}</Text>

      {/* Variant Specific: Poster Name */}
      {(variant === "feed" || variant === "active") && (
        <Text style={styles.posterName} numberOfLines={1}>
          الموكِّل: {job.posterName || job.postedBy?.fullName || "غير معروف"}
        </Text>
      )}

      {/* Shared Meta: Fee + Deadline */}
      <View style={styles.metaRow}>
        <Text style={styles.fee}>💰 {formatCurrency(fee)}</Text>
        
        {variant === "posted" && job._count?.applications !== undefined && (
          <Text style={styles.applicantBadge}>
            👥 {job._count.applications} {job._count.applications === 1 ? "متقدم" : "متقدمين"}
          </Text>
        )}

        {deadlineInfo && variant !== "compact" && (
          <Text style={[styles.deadline, { color: deadlineInfo.color }]}>
            📅 {deadlineInfo.label}
          </Text>
        )}
      </View>

      {/* Variant Specific: Active Progress Bar */}
      {variant === "active" && job.expiresAt && (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { backgroundColor: getProgressColor(progress), width: `${progress * 100}%` },
            ]}
          />
        </View>
      )}

      {/* Variant Specific: Action Buttons */}
      {variant === "feed" && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => onPress?.(job.id)}>
            <Text style={styles.primaryButtonText}>عرض التفاصيل</Text>
          </TouchableOpacity>
        </View>
      )}

      {variant === "posted" && (
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
          {(job.status === "COMPLETED" || job.status === "CANCELLED" || job.status === "EXPIRED") && (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => onPress?.(job.id)}>
              <Text style={styles.secondaryButtonText}>عرض التفاصيل</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {variant === "active" && (
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
          {(job.status === "COMPLETED" || job.status === "CANCELLED" || job.status === "EXPIRED") && (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => onPress?.(job.id)}>
              <Text style={styles.secondaryButtonText}>عرض التفاصيل</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

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
  title: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: 16,
    marginBottom: 4,
    textAlign: "right",
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
});
