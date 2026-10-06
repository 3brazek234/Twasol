import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolateColor,
} from "react-native-reanimated";
import { Landmark, Gavel, Clock, Users } from "lucide-react-native";
import { tokens } from "../../theme/tokens";
import { StatusPill } from "../StatusPill";
import { Avatar } from "../Avatar";
import { getDeadlineInfo, formatCurrency, daysBetween, formatDate } from "../../utils/dateUtils";

const TASK_TYPE_LABELS: Record<string, string> = {
  ATTEND_SESSION: "حضور جلسة",
  OBTAIN_DOCUMENT: "استخراج مستند",
  FILE_PLEADING: "إيداع مذكرة",
  REGISTER_PROPERTY: "تسجيل عقار",
  REVIEW_DOCKET: "مراجعة ملف",
  OTHER: "مهمة قانونية",
};

// ─────────────────────────────────────────────────────────────────────────────
// JobCard
// ─────────────────────────────────────────────────────────────────────────────

interface JobCardProps {
  job: any;
  variant: "feed" | "posted" | "active" | "compact";
  onPress?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  onViewApplications?: (jobId: string) => void;
  onOpenChat?: (job: any) => void;
  onCancel?: (jobId: string) => void;
  onComplete?: (job: any) => void;
  onStartJob?: (jobId: string) => void;
  onReview?: (jobId: string) => void;
  hasReviewed?: boolean;
}

const getStatusFlashColor = (status: string): string => {
  "worklet";
  switch (status) {
    case "NEGOTIATING": return tokens.colors.amber;
    case "AGREED":
    case "IN_PROGRESS": return tokens.colors.verdant;
    case "EXPIRED": return tokens.colors.crimson;
    case "COMPLETED": return tokens.colors.slate;
    default: return tokens.colors.navy;
  }
};

const getStatusAccentColor = (status: string): string => {
  switch (status) {
    case "NEGOTIATING": return tokens.colors.amber;
    case "AGREED":
    case "IN_PROGRESS": return tokens.colors.verdant;
    case "COMPLETED": return tokens.colors.slate;
    case "CANCELLED": return tokens.colors.muted;
    case "EXPIRED": return tokens.colors.crimson;
    default: return tokens.colors.navy;
  }
};

const getStatusCardBg = (status: string, variant: string): string => {
  if (variant === "feed" || variant === "compact") return tokens.colors.white;
  switch (status) {
    case "NEGOTIATING": return tokens.colors.amberBg;
    case "AGREED":
    case "IN_PROGRESS": return tokens.colors.verdantBg;
    case "COMPLETED": return tokens.colors.slateBg;
    case "EXPIRED": return tokens.colors.crimsonBg;
    case "CANCELLED": return tokens.colors.surface;
    default: return tokens.colors.white;
  }
};

const getProgressColor = (p: number): string => {
  if (p < 0.6) return tokens.colors.verdant;
  if (p < 0.85) return tokens.colors.amber;
  return tokens.colors.crimson;
};

const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED", "EXPIRED"]);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const JobCard: React.FC<JobCardProps> = ({
  job,
  variant,
  onPress,
  onApply,
  onViewApplications,
  onOpenChat,
  onCancel,
  onComplete,
  onStartJob,
  onReview,
  hasReviewed = false,
}) => {
  const isCompact = variant === "compact";
  const isPostedOrActive = variant === "posted" || variant === "active";
  const isTerminalStatus = TERMINAL_STATUSES.has(job.status);
  const showAccentStrip = isPostedOrActive && !isTerminalStatus;

  const agreedFee = Number(job.agreedSalary ?? job.fee ?? 0);
  const askingFee = Number(job.salaryMin ?? 0);
  const displayFee = agreedFee > 0 ? agreedFee : askingFee;
  const showStrikethrough = variant === "posted" && agreedFee > 0 && askingFee > 0 && Math.abs(agreedFee - askingFee) > 0.01;

  const clientName: string | null = job.poster_name ?? job.posterName ?? job.postedBy?.fullName ?? null;
  const clientBarNumber: string | null = job.postedBy?.barNumber ?? job.posterBarNumber ?? null;
  const hiredLawyerName: string | null = job.assignedLawyer?.fullName ?? null;
  const hiredLawyerBarNumber: string | null = job.assignedLawyer?.barNumber ?? null;
  
  // Applicant count can now be used by both posted and feed variants
  const applicantCount: number | undefined = job._count?.applications ?? (Array.isArray(job.applications) ? job.applications.length : undefined);

  const courtName = job.courtNameAr ?? job.court_name ?? job.court?.nameAr ?? "محكمة غير محددة";
  const govSuffix = (() => {
    const g = job.court?.governorate?.nameAr ?? job.court_governorate ?? null;
    return g ? ` · ${g}` : "";
  })();

  const cardBg = getStatusCardBg(job.status, variant);
  const expiresAt = job.expiresAt ?? job.deadline ?? null;
  const createdAt = job.createdAt ?? job.created_at ?? null;
  const deadlineLabel = (() => {
    if (!expiresAt) return "دون موعد محدد";
    const days = daysBetween(new Date(), expiresAt);
    if (days < 0) return "انتهى الموعد";
    if (days === 0) return "اليوم";
    if (days === 1) return "غداً";
    if (days <= 7) return `خلال ${days} أيام`;
    return formatDate(expiresAt);
  })();
  const applicantLabel = applicantCount === undefined
    ? ""
    : applicantCount === 0
      ? "لا يوجد متقدمون بعد"
      : applicantCount === 1
        ? "متقدم واحد"
        : applicantCount === 2
          ? "متقدمان"
          : applicantCount <= 10
            ? `${applicantCount} متقدمين`
            : `${applicantCount} متقدماً`;
  
  let deadlineInfo: ReturnType<typeof getDeadlineInfo> | null = null;
  let progress = 0;

  if (expiresAt) {
    deadlineInfo = getDeadlineInfo(expiresAt);
    if (variant === "active") {
      const totalDays = createdAt ? daysBetween(createdAt, expiresAt) : 0;
      const usedDays = createdAt ? daysBetween(createdAt, new Date()) : 0;
      progress = totalDays > 0 ? Math.min(Math.max(usedDays / totalDays, 0), 1) : 1;
    }
  }

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

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      flashValue.value,
      [0, 1],
      [tokens.colors.line, getStatusFlashColor(job.status)]
    ),
    borderWidth: flashValue.value > 0.01 ? 2 : 1,
  }));

  // ════════════════════════════════════════════════════════════════════════════
  // FEED VARIANT — Upwork-style Marketplace Layout
  // ════════════════════════════════════════════════════════════════════════════
  if (variant === "feed") {
    return (
      <AnimatedTouchableOpacity
        style={[styles.card, styles.feedCard, animatedBorderStyle]}
        onPress={() => onPress?.(job.id)}
        activeOpacity={0.7}
      >
        <View style={styles.feedTopRow}>
          <Text style={styles.feedTitle} numberOfLines={2}>
            {job.title}
          </Text>
          <View style={styles.feedPriceStack}>
            <Text style={styles.feedFee}>{formatCurrency(displayFee)}</Text>
            <StatusPill status={job.status || "OPEN"} />
          </View>
        </View>

        <View style={styles.feedMetadata}>
          <View style={[styles.feedMetaItem, styles.feedMetaCourt]}>
            <Landmark size={12} color={tokens.colors.navy} />
            <Text style={styles.feedSubText} numberOfLines={1}>
              {courtName}{govSuffix}
            </Text>
          </View>
          <View style={styles.feedMetaItem}>
            <Gavel size={12} color={tokens.colors.muted} />
            <Text style={styles.feedSubText} numberOfLines={1}>
              {TASK_TYPE_LABELS[job.taskType] ?? "مهمة قانونية"}
            </Text>
          </View>
          <View style={styles.feedMetaItem}>
            <Clock size={12} color={tokens.colors.muted} />
            <Text style={styles.feedSubText} numberOfLines={1}>{deadlineLabel}</Text>
          </View>
        </View>

        {job.description ? (
          <Text style={styles.feedDescription} numberOfLines={1}>
            {job.description}
          </Text>
        ) : null}

        <View style={styles.feedFooterRow}>
          <View style={styles.feedPosterIdentity}>
            <Avatar name={clientName} size={24} />
            <Text style={styles.feedPosterName} numberOfLines={1}>
              {clientName ?? "غير معروف"}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={(event) => {
              event.stopPropagation();
              onApply?.(job.id);
            }}
            style={styles.feedApplyButton}
            activeOpacity={0.8}
          >
            <Text style={styles.feedApplyText}>التفاصيل والتقديم</Text>
          </TouchableOpacity>
        </View>
      </AnimatedTouchableOpacity>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // POSTED / ACTIVE / COMPACT VARIANTS
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <AnimatedTouchableOpacity
      style={[
        styles.card,
        isCompact && styles.cardCompact,
        showAccentStrip && styles.cardWithAccent,
        isTerminalStatus && styles.cardTerminal,
        { backgroundColor: cardBg },
        animatedBorderStyle,
      ]}
      onPress={() => onPress?.(job.id)}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* ── Right-edge accent strip (posted/active, non-terminal) ── */}
      {showAccentStrip && (
        <View
          style={[
            styles.accentStrip,
            { backgroundColor: getStatusAccentColor(job.status) },
          ]}
        />
      )}

      {/* ══════════════ HEADER ROW: court name + status pill ══════════════ */}
      <View style={styles.headerRow}>
        {/* In RTL flexRow, first child appears on the RIGHT (reading entry) */}
        <Text
          style={[styles.courtName, isCompact && styles.courtNameCompact]}
          numberOfLines={1}
        >
          {courtName}{govSuffix}
        </Text>
        <StatusPill status={job.status || "OPEN"} isTerminal={isTerminalStatus} />
      </View>

      {/* ══════════════ TITLE ══════════════ */}
      <Text
        style={[styles.title, isCompact && styles.titleCompact]}
        numberOfLines={2}
      >
        {job.title}
      </Text>

      {/* ══════════════ PERSON ROW ══════════════ */}

      {/* Active: show client/poster name with avatar */}
      {!isCompact && variant === "active" && (
        <View style={styles.personRow}>
          <Avatar name={clientName} size={26} />
          <View>
            <Text style={styles.personLabel} numberOfLines={1}>
              الموكِّل:{" "}
              <Text style={styles.personValue}>
                {clientName ?? "غير معروف"}
              </Text>
            </Text>
            {clientBarNumber ? (
              <Text style={{ fontFamily: tokens.typography.fonts.body, fontSize: 11, color: tokens.colors.muted, textAlign: 'right' }}>
                رقم القيد: {clientBarNumber}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Posted OPEN/NEGOTIATING: applicant count badge */}
      {!isCompact &&
        variant === "posted" &&
        ["OPEN", "NEGOTIATING"].includes(job.status) &&
        applicantCount !== undefined && (
          <View style={styles.applicantRow}>
            <View style={styles.applicantBadge}>
              <Text style={styles.applicantBadgeText}>
                {applicantCount}{" "}
                {applicantCount === 1 ? "متقدم" : "متقدمين"}
              </Text>
            </View>
          </View>
        )}

      {/* Posted AGREED / IN_PROGRESS: hired lawyer avatar */}
      {!isCompact &&
        variant === "posted" &&
        ["AGREED", "IN_PROGRESS"].includes(job.status) && (
          <View style={styles.personRow}>
            <Avatar
              name={hiredLawyerName}
              size={26}
              bgColor={tokens.colors.verdant}
            />
            <View>
              <Text style={styles.personLabel} numberOfLines={1}>
                المحامي المُعيَّن:{" "}
                <Text style={styles.personValue}>
                  {hiredLawyerName ?? "—"}
                </Text>
              </Text>
              {hiredLawyerBarNumber ? (
                <Text style={{ fontFamily: tokens.typography.fonts.body, fontSize: 11, color: tokens.colors.muted, textAlign: 'right' }}>
                  رقم القيد: {hiredLawyerBarNumber}
                </Text>
              ) : null}
            </View>
          </View>
        )}

      {/* ══════════════ FEE ROW ══════════════ */}
      <View style={styles.metaRow}>
        {/* Fee block — left side in RTL (first child = right edge) */}
        <View style={styles.feeBlock}>
          <Text style={[styles.fee, isCompact && styles.feeCompact]}>
            {formatCurrency(displayFee)}
          </Text>
          {/* Strike-through asking fee if negotiated down — posted variant only */}
          {showStrikethrough && (
            <Text style={styles.feeStrike}>{formatCurrency(askingFee)}</Text>
          )}
        </View>
      </View>

      {isCompact && ["OPEN", "NEGOTIATING"].includes(job.status) && (
        <View style={styles.compactInfoRow}>
          {applicantCount !== undefined && (
            <View style={styles.compactApplicantBadge}>
              <Users size={14} color={tokens.colors.navy} />
              <Text style={styles.compactApplicantText}>{applicantLabel}</Text>
            </View>
          )}
          {expiresAt && (
            <View style={styles.compactDeadline}>
              <Clock size={14} color={tokens.colors.muted} />
              <Text style={styles.compactDeadlineText}>{deadlineLabel}</Text>
            </View>
          )}
        </View>
      )}

      {/* ══════════════ POSTED: INLINE DEADLINE PILL ══════════════ */}
      {/* Small dot + colored label. Verdant → amber → crimson as urgency rises. */}
      {!isCompact &&
        variant === "posted" &&
        expiresAt &&
        deadlineInfo &&
        !isTerminalStatus && (
          <View style={styles.deadlinePillRow}>
            <View
              style={[
                styles.deadlineDot,
                { backgroundColor: deadlineInfo.color },
              ]}
            />
            <Text
              style={[styles.deadlinePillText, { color: deadlineInfo.color }]}
            >
              {deadlineInfo.label}
            </Text>
          </View>
        )}

      {/* ══════════════ ACTIVE: PROGRESS BAR ══════════════ */}
      {!isCompact && variant === "active" && expiresAt && (
        <>
          {deadlineInfo && (
            <View style={styles.progressLabelRow}>
              <Text
                style={[styles.progressLabel, { color: deadlineInfo.color }]}
              >
                {deadlineInfo.label}
              </Text>
            </View>
          )}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: getProgressColor(progress),
                  width: `${progress * 100}%`,
                },
              ]}
            />
          </View>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ACTION ROWS
          ══════════════════════════════════════════════════════════════════
          Feed variant: NO buttons — card itself is the tap target.
          Button taxonomy:
            btnPrimary    navy filled    — navigate / primary action
            btnGold       gold filled    — positive/rewarding (review, confirm)
            btnSecondary  navy outlined  — secondary chat / view
            btnDestructive crimson outlined — destructive (cancel only)
            btnGhost      no border, muted — terminal low-priority navigation
          ══════════════════════════════════════════════════════════════════ */}

      {/* ── POSTED actions ── */}
      {!isCompact && variant === "posted" && (
        <View style={styles.actionRow}>
          {/* OPEN: primary view applications + destructive cancel */}
          {job.status === "OPEN" && (
            <>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => onViewApplications?.(job.id)}
              >
                <Text style={styles.btnPrimaryText}>عرض الطلبات</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnDestructive}
                onPress={() => onCancel?.(job.id)}
              >
                <Text style={styles.btnDestructiveText}>إلغاء</Text>
              </TouchableOpacity>
            </>
          )}

          {/* NEGOTIATING / AGREED: view applications + open chat */}
          {(job.status === "NEGOTIATING" || job.status === "AGREED") && (
            <>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => onViewApplications?.(job.id)}
              >
                <Text style={styles.btnPrimaryText}>عرض الطلبات</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => onOpenChat?.(job)}
              >
                <Text style={styles.btnSecondaryText}>المحادثة</Text>
              </TouchableOpacity>
            </>
          )}

          {/* IN_PROGRESS: gold confirm completion (positive) + secondary chat */}
          {job.status === "IN_PROGRESS" && (
            <>
              <TouchableOpacity
                style={styles.btnGold}
                onPress={() => onComplete?.(job)}
              >
                <Text style={styles.btnPrimaryText}>تأكيد الإتمام ✓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => onOpenChat?.(job)}
              >
                <Text style={styles.btnSecondaryText}>المحادثة</Text>
              </TouchableOpacity>
            </>
          )}

          {/* COMPLETED: gold review (if unreviewed) + ghost details */}
          {job.status === "COMPLETED" && (
            <>
              {hasReviewed ? (
                <View style={styles.reviewedBadge}>
                  <Text style={styles.reviewedBadgeText}>تقييمك: ★★★★★</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.btnGold}
                  onPress={() => onReview?.(job.id)}
                >
                  <Text style={styles.btnPrimaryText}>قيّم المحامي ⭐</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() => onPress?.(job.id)}
              >
                <Text style={styles.btnGhostText}>التفاصيل</Text>
              </TouchableOpacity>
            </>
          )}

          {/* CANCELLED / EXPIRED: ghost details only — card is already visually "closed" */}
          {(job.status === "CANCELLED" || job.status === "EXPIRED") && (
            <TouchableOpacity
              style={styles.btnGhost}
              onPress={() => onPress?.(job.id)}
            >
              <Text style={styles.btnGhostText}>عرض التفاصيل</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── ACTIVE actions ── */}
      {!isCompact && variant === "active" && (
        <View style={styles.actionRow}>
          {/* AGREED: primary start + secondary chat */}
          {job.status === "AGREED" && (
            <>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => onStartJob?.(job.id)}
              >
                <Text style={styles.btnPrimaryText}>بدء التنفيذ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => onOpenChat?.(job)}
              >
                <Text style={styles.btnSecondaryText}>المحادثة</Text>
              </TouchableOpacity>
            </>
          )}

          {/* IN_PROGRESS: secondary chat + waiting info text */}
          {job.status === "IN_PROGRESS" && (
            <>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => onOpenChat?.(job)}
              >
                <Text style={styles.btnSecondaryText}>فتح المحادثة</Text>
              </TouchableOpacity>
              <Text style={styles.infoText}>في انتظار تأكيد الموكِّل</Text>
            </>
          )}

          {/* COMPLETED: gold review (if unreviewed) + ghost details */}
          {job.status === "COMPLETED" && (
            <>
              {hasReviewed ? (
                <View style={styles.reviewedBadge}>
                  <Text style={styles.reviewedBadgeText}>تقييمك: ★★★★★</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.btnGold}
                  onPress={() => onReview?.(job.id)}
                >
                  <Text style={styles.btnPrimaryText}>قيّم الموكِّل ⭐</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() => onPress?.(job.id)}
              >
                <Text style={styles.btnGhostText}>التفاصيل</Text>
              </TouchableOpacity>
            </>
          )}

          {/* CANCELLED / EXPIRED: ghost details */}
          {(job.status === "CANCELLED" || job.status === "EXPIRED") && (
            <TouchableOpacity
              style={styles.btnGhost}
              onPress={() => onPress?.(job.id)}
            >
              <Text style={styles.btnGhostText}>عرض التفاصيل</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ══════════════ TERMINAL STATE FOOTER ══════════════ */}
      {/* Upgraded to 14px bodySemibold — on a terminal card this IS the headline. */}
      {!isCompact && job.status === "COMPLETED" && (
        <Text style={styles.terminalFooter}>تم إنجاز المهمة بنجاح ✓</Text>
      )}
      {!isCompact && job.status === "CANCELLED" && (
        <Text style={styles.terminalFooter}>تم الإلغاء بواسطة الموكِّل</Text>
      )}
      {!isCompact && job.status === "EXPIRED" && (
        <Text style={[styles.terminalFooter, { color: tokens.colors.crimson }]}>
          {job.agreedAt
            ? "انتهت المهلة أثناء التنفيذ"
            : "انتهت المهلة دون اتفاق"}
        </Text>
      )}
    </AnimatedTouchableOpacity>
  );
};

// ─── Memo: re-render only when functionally meaningful data changes ───────────
export default React.memo(JobCard, (prev, next) => {
  return (
    prev.job.id === next.job.id &&
    prev.job.status === next.job.status &&
    prev.job.version === next.job.version &&
    prev.variant === next.variant &&
    prev.hasReviewed === next.hasReviewed
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT_STRIP_WIDTH = 4;

const styles = StyleSheet.create({
  // ── Card shell ──────────────────────────────────────────────────────────────
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.xl,      // 12 — slightly tighter than original 16
    padding: tokens.spacing.md,          // 16
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: tokens.colors.line,
    marginBottom: tokens.spacing.sm,     // 12
    overflow: "hidden",                  // clips accent strip to card corners
    direction: "rtl",
    ...tokens.shadows.sm,
  },
  // Feed stays at sm shadow (many cards; shouldn't dominate). Posted/active
  // get the same shadow for now — elevation is expressed via accent strip instead.

  cardCompact: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    marginBottom: tokens.spacing.sm,
  },

  // Extra right padding to prevent text from sliding under the accent strip
  cardWithAccent: {
    paddingEnd: tokens.spacing.md + ACCENT_STRIP_WIDTH + 2,
  },

  // Terminal cards fade to ~82% opacity — subtly signals "closed/archived"
  cardTerminal: {
    opacity: 0.82,
  },

  // ── Right-edge accent strip ─────────────────────────────────────────────────
  // Absolutely positioned 4px strip matching status color.
  // Shows only on posted/active non-terminal cards.
  // overflow: "hidden" on the card clips it cleanly to the card radius.
  accentStrip: {
    position: "absolute",
    end: 0,
    top: 0,
    bottom: 0,
    width: ACCENT_STRIP_WIDTH,
  },

  // ── Header row ──────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: "row",
    direction: "rtl",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacing.xxs,   // 4
  },
  courtName: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 11,
    flex: 1,
    textAlign: "right",
    paddingRight: tokens.spacing.xs,    // gap between court text and pill
  },
  courtNameCompact: {
    fontSize: 10,
  },

  // ── Title ───────────────────────────────────────────────────────────────────
  title: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: tokens.spacing.xs,    // 8
    textAlign: "right",
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: tokens.spacing.xxs,   // 4
  },

  // ── Person row (poster/lawyer/client) ───────────────────────────────────────
  personRow: {
    flexDirection: "row",               // RTL: first child → RIGHT, second → LEFT
    direction: "rtl",
    alignItems: "center",
    gap: tokens.spacing.xxs,            // 4
    marginBottom: tokens.spacing.xs,    // 8
    // No explicit justifyContent — defaults to flex-start (= right in RTL)
  },
  personLabel: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 13,
    flexShrink: 1,
    textAlign: "right",
  },
  personValue: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 13,
  },

  // ── Applicant count badge ────────────────────────────────────────────────────
  applicantRow: {
    flexDirection: "row",
    direction: "rtl",
    marginBottom: tokens.spacing.xxs,   // 4
    // Default flex-start = right in RTL
  },
  applicantBadge: {
    backgroundColor: tokens.colors.slateBg,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: 3,
    borderRadius: tokens.radius.sm,
    overflow: "hidden",
  },
  applicantBadgeText: {
    color: tokens.colors.slate,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 12,
  },

  // ── Fee row ─────────────────────────────────────────────────────────────────
  metaRow: {
    flexDirection: "row",
    direction: "rtl",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: tokens.spacing.xxs,      // 4
    marginBottom: tokens.spacing.xxs,   // 4
  },
  feeBlock: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  // Fee is the visual focal point of the card — 18px mono in gold.
  // Upgraded from 14px to make it scannable across a list without close reading.
  fee: {
    color: tokens.colors.gold,
    fontFamily: tokens.typography.fonts.mono,
    fontSize: 18,
    fontWeight: "600",
  },
  feeCompact: {
    fontSize: 16,
  },
  compactInfoRow: {
    flexDirection: "row",
    direction: "rtl",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.line,
    paddingTop: tokens.spacing.xs,
    marginTop: tokens.spacing.xxs,
  },
  compactApplicantBadge: {
    flexDirection: "row",
    direction: "rtl",
    alignItems: "center",
    gap: tokens.spacing.xxs,
    backgroundColor: tokens.colors.slateBg,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing.xxs,
    borderRadius: tokens.radius.sm,
  },
  compactApplicantText: {
    color: tokens.colors.navy,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.xs,
  },
  compactDeadline: {
    flexDirection: "row",
    direction: "rtl",
    alignItems: "center",
    gap: tokens.spacing.xxs,
    flexShrink: 1,
  },
  compactDeadlineText: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
    textAlign: "right",
  },
  // Strike-through asking fee when negotiation resulted in a different amount.
  feeStrike: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.mono,
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  // Inline deadline text — used in feed variant only
  deadlineText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 12,
  },

  // ── Posted: inline deadline pill ────────────────────────────────────────────
  // A 6px colored dot + text. Uses same verdant/amber/crimson logic as progress bar.
  // Shows only on posted non-terminal cards that have an expiresAt date.
  deadlinePillRow: {
    flexDirection: "row",
    direction: "rtl",
    alignItems: "center",
    gap: tokens.spacing.xxs,            // 4
    marginBottom: tokens.spacing.xxs,
    // Default flex-start = right-aligned in RTL
  },
  deadlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  deadlinePillText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 12,
  },

  // ── Active: progress bar ─────────────────────────────────────────────────────
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "flex-end",         // right in LTR context; will mirror in RTL
    marginTop: tokens.spacing.xxs,
  },
  progressLabel: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 12,
  },
  progressBarContainer: {
    width: "100%",
    height: 4,
    backgroundColor: tokens.colors.line,
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },

  // ── Action row ───────────────────────────────────────────────────────────────
  actionRow: {
    flexDirection: "row",
    direction: "rtl",
    alignItems: "center",
    gap: tokens.spacing.xs,             // 8 — enough breathing room between buttons
    marginTop: tokens.spacing.sm,       // 12
  },

  // ── Button tier: Primary — navy filled ──────────────────────────────────────
  btnPrimary: {
    backgroundColor: tokens.colors.navy,
    paddingVertical: 9,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    flex: 1,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 13,
  },

  // ── Button tier: Gold — positive/rewarding actions ───────────────────────────
  // Review and confirm-completion actions. Visually warm and inviting.
  btnGold: {
    backgroundColor: tokens.colors.gold,
    paddingVertical: 9,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    flex: 1,
    alignItems: "center",
  },

  // ── Button tier: Secondary — navy outlined ───────────────────────────────────
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: tokens.colors.navy,
    paddingVertical: 9,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    flex: 1,
    alignItems: "center",
  },
  btnSecondaryText: {
    color: tokens.colors.navy,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 13,
  },

  // ── Button tier: Destructive — crimson outlined (cancel only) ────────────────
  btnDestructive: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: tokens.colors.crimson,
    paddingVertical: 9,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    flex: 1,
    alignItems: "center",
  },
  btnDestructiveText: {
    color: tokens.colors.crimson,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 13,
  },

  // ── Button tier: Ghost — no border, muted text ───────────────────────────────
  // Used for low-priority navigation on terminal cards. Recedes visually so it
  // doesn't compete with the terminal footer text.
  btnGhost: {
    backgroundColor: "transparent",
    paddingVertical: 9,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    flex: 1,
    alignItems: "center",
  },
  btnGhostText: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 13,
  },

  // ── Info text (waiting-state label in active IN_PROGRESS) ───────────────────
  infoText: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 12,
    fontStyle: "italic",
    flex: 1,
    textAlign: "center",
  },

  // ── Terminal footer ──────────────────────────────────────────────────────────
  // Upgraded from 12px italic muted → 14px bodySemibold.
  // On a closed card, the outcome IS the headline — it should be the most
  // legible line, not the most buried.
  terminalFooter: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14,
    textAlign: "center",
    marginTop: tokens.spacing.xs,       // 8
  },

  // ── Reviewed badge ───────────────────────────────────────────────────────────
  reviewedBadge: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
    paddingVertical: 9,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: tokens.colors.goldLight,
  },
  reviewedBadgeText: {
    color: tokens.colors.gold,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 13,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // Feed Variant Specific Styles (Upwork Style)
  // ════════════════════════════════════════════════════════════════════════════
  feedCard: {
    padding: tokens.spacing.sm,
    marginHorizontal: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
    borderRadius: tokens.radius.lg,
  },
  feedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.xs,
  },
  feedPriceStack: {
    alignItems: 'flex-end',
    gap: tokens.spacing.xxs,
    marginStart: tokens.spacing.xs,
  },
  feedTitle: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: tokens.typography.sizes.lg,
    lineHeight: tokens.typography.sizes.xxl,
    flex: 1,
  },
  feedFee: {
    color: tokens.colors.navy,
    fontFamily: tokens.typography.fonts.mono,
    fontSize: tokens.typography.sizes.base,
    fontWeight: "700",
    backgroundColor: tokens.colors.goldLight,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing.xxs,
    borderRadius: tokens.radius.sm,
  },
  feedMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
  },
  feedMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xxs,
    flex: 1,
    minWidth: 0,
  },
  feedMetaCourt: {
    flex: 1.5,
  },
  feedSubText: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 10,
    flex: 1,
  },
  feedDescription: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
    lineHeight: tokens.typeScale.caption.lineHeight,
    marginBottom: tokens.spacing.xs,
  },
  feedFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  feedPosterIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xxs,
    flex: 1,
    minWidth: 0,
  },
  feedPosterName: {
    color: tokens.colors.slate,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 12,
  },
  feedApplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.xxs,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.navy,
    minHeight: tokens.spacing.xxl,
  },
  feedApplyText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 12,
  },
});
