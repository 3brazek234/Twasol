import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useJob, useApplyToJob, useTranslateJob, useUpdateJobStatus } from '../../hooks/useJobs';
import { useLawyersAtCourt } from '../../hooks/useCourts';
import { useAuthStore } from '../../stores/authStore';
import { VerificationStatusBanner } from '../../components/VerificationStatusBanner';
import { tokens } from '../../theme/tokens';
import { Landmark, Users, Calendar, Gavel, CheckCircle } from 'lucide-react-native';
import { useCompleteJob } from '../../hooks/useJobs';
import { safeFormatDate } from '../../utils/dateUtils';

export const JobDetailScreen = ({ route, navigation }: any) => {
  const { jobId } = route.params || {};

  const { data: job, isLoading, error } = useJob(jobId);
  // Only fetch active lawyers once we have a real courtId — avoids firing with empty string
  const { data: lawyersResponse, isLoading: isLoadingLawyers } = useLawyersAtCourt(job?.courtId ?? '', !!job?.courtId);
  const activeLawyers = lawyersResponse?.data || lawyersResponse || [];
  const { mutate: apply, isPending: isApplying } = useApplyToJob();
  const { mutate: translate, isPending: isTranslating } = useTranslateJob();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateJobStatus();
  const { user } = useAuthStore();
  
  // Backend uses uppercase APPROVED
  const isVerified = (user?.verificationStatus as string) === 'APPROVED' || user?.verificationStatus === 'APPROVED';
  const isOwnJob = user?.id === job?.posterId;

  const [translatedTitle, setTranslatedTitle] = React.useState<string | null>(null);
  const [translatedDescription, setTranslatedDescription] = React.useState<string | null>(null);
  const [isTranslated, setIsTranslated] = React.useState(false);

  const handleTranslate = () => {
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    if (translatedTitle && translatedDescription) {
      setIsTranslated(true);
      return;
    }

    const targetLocale = 'EN';
    translate({ jobId, targetLocale }, {
      onSuccess: (data) => {
        setTranslatedTitle(data.title);
        setTranslatedDescription(data.description);
        setIsTranslated(true);
      },
      onError: (err: any) => {
        Alert.alert('فشل الترجمة', err.message || 'تعذر ترجمة وصف القضية.');
      }
    });
  };

  const handleApply = () => {
    if (!jobId) return;
    apply(jobId, {
      onSuccess: (data: any) => {
        const convId = data?.conversationId;
        if (convId) {
          navigation.navigate('ChatsTab', {
            screen: 'Chat',
            params: { conversationId: convId, conversationType: 'JOB', jobStatus: job?.status, jobTitle: job?.title },
          });
        } else {
          // convId not returned — go to conversations list as fallback
          navigation.navigate('ChatsTab', { screen: 'ConversationsList' });
        }
      },
      onError: (err: any) => {
        Alert.alert('تنبيه النظام', err.message || 'تعذر تقديم العرض.');
      },
    });
  };

  const completeJobHook = useCompleteJob();

  const handleNegotiate = () => {
    Alert.alert(
      "بدء التفاوض",
      "هل تريد تغيير حالة الطلب إلى قيد التفاوض؟ سيؤدي ذلك لإيقاف استقبال طلبات جديدة.",
      [
        { text: "إلغاء", style: "cancel" },
        { 
          text: "تأكيد", 
          onPress: () => {
            updateStatus({ jobId, status: 'NEGOTIATING' }, {
              onSuccess: () => {
                Alert.alert('نجاح', 'تم تحديث حالة الطلب إلى قيد التفاوض');
              },
              onError: (err: any) => {
                Alert.alert('خطأ', err.message || 'لم نتمكن من تحديث الحالة');
              }
            });
          } 
        }
      ]
    );
  };

  const handleComplete = async () => {
    Alert.alert(
      "تأكيد إتمام المهمة",
      "هل تأكد من إتمام المحامي للمهمة المطلوبة؟\nسيتم إرسال إشعار للمحامي لتأكيد استلام المبلغ المتفق عليه.",
      [
        { text: "إلغاء", style: "cancel" },
        { 
          text: "نعم، تم الإتمام", 
          onPress: async () => {
            try {
              await completeJobHook.mutateAsync(jobId);
              // Navigate directly to PosterReview so the poster can rate the lawyer
              navigation.replace('PosterReview', {
                jobId,
                jobTitle: job?.title,
                lawyerId: (job as any)?.assignedLawyerId || (job as any)?.assignedExecutorId,
                lawyerName: (job as any)?.assignedLawyerName || (job as any)?.assignedLawyer?.fullName,
                fee: (job as any)?.agreedSalary || job?.salaryMin,
              });
            } catch (err) {
              Alert.alert('خطأ', 'حدث خطأ أثناء إتمام المهمة');
            }
          } 
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={tokens.colors.signal} />
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>لم يتم العثور على هذا الطلب.</Text>
      </View>
    );
  }

  const formattedAmount = job.salaryMin
    ? new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(job.salaryMin)
    : job.offerAmount
    ? new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(job.offerAmount)
    : 'قابل للتفاوض';

  const courtDisplay = job.courtNameAr ?? job.courtNameEn ?? 'المحكمة';

  // Determine if current user is a participant in this completed job and has already reviewed
  const isParticipant = isOwnJob || user?.id === (job as any)?.assignedLawyerId;
  const myReview = (job as any)?.reviews?.find((r: any) => r.reviewerId === user?.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Job Title & Meta Date */}
      <View style={styles.headerSection}>
        <Text style={styles.jobTitle}>
          {isTranslated && translatedTitle ? translatedTitle : job.title}
        </Text>
        <View style={styles.metaRow}>
          <Calendar size={14} color={tokens.colors.muted} />
          <Text style={styles.metaText}>
            نُشر في {safeFormatDate(job.createdAt)}
          </Text>
          {isTranslated && (
            <Text style={styles.machineTranslatedLabel}>• {'ترجمة آلية'}</Text>
          )}
        </View>
      </View>

      {/* 2. Key Metrics Card (Salary & Court) */}
      <View style={styles.highlightCard}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>المقابل المعروض</Text>
          <Text style={styles.salaryMono}>{formattedAmount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>المحكمة المختصة</Text>
          <View style={styles.courtHeader}>
            <Landmark size={18} color={tokens.colors.navy} style={{ marginEnd: 8 }} />
            <Text style={styles.courtName} numberOfLines={2}>{courtDisplay}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Trust Indicator */}
        <View style={styles.trustIndicator}>
          <Users size={16} color={tokens.colors.signal} style={{ marginEnd: 8 }} />
          <Text style={styles.trustText}>
            {isLoadingLawyers ? (
              'جاري فحص النشاط...'
            ) : (
              `يتوفر ${activeLawyers?.length || 0} محامٍ نشط في هذه المحكمة`
            )}
          </Text>
        </View>
      </View>

      {/* 3. Description Section */}
      <View style={styles.detailsHeaderRow}>
        <Text style={styles.sectionHeader}>{'التفاصيل الكاملة'}</Text>
        <TouchableOpacity 
          onPress={handleTranslate} 
          style={styles.translateBtn}
          disabled={isTranslating}
        >
          {isTranslating ? (
            <ActivityIndicator size="small" color={tokens.colors.signal} />
          ) : (
            <Text style={styles.translateBtnText}>
              {isTranslated ? 'عرض الأصلي' : 'ترجمة الوصف'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.description}>
          {isTranslated && translatedDescription ? translatedDescription : job.description}
        </Text>
      </View>

      {/* 4. Actions — conditional on status */}
      {job.status !== 'OPEN' && !isOwnJob && !isParticipant && (
        <View style={{ marginHorizontal: 24, padding: 16, backgroundColor: tokens.colors.paper, borderRadius: 12, borderWidth: 1, borderColor: tokens.colors.line, marginBottom: 24 }}>
          <Text style={{ fontFamily: tokens.typography.fonts.bodyMedium, fontSize: 14, color: tokens.colors.muted, textAlign: 'center' }}>
            عذراً، هذا الطلب لم يعد متاحاً وتم قبوله من محامٍ آخر.
          </Text>
        </View>
      )}

      {job.status === 'OPEN' && (
        <View style={styles.applyContainer}>
          {!isVerified && !isOwnJob && (
            <View style={{ marginBottom: tokens.spacing.md }}>
              <VerificationStatusBanner />
            </View>
          )}
          {isOwnJob ? (
            <TouchableOpacity 
              style={[styles.applyButton, { backgroundColor: tokens.colors.navy }]} 
              onPress={handleNegotiate}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.applyButtonText}>إيقاف الطلبات (بدء التفاوض)</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.applyButton, (!isVerified || isApplying) && styles.applyButtonDisabled]}
              onPress={handleApply}
              disabled={!isVerified || isApplying}
            >
              {isApplying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Gavel size={18} color="#fff" style={{ marginEnd: 8 }} />
                  <Text style={styles.applyButtonText}>{'تقديم عرض تمثيل قانوني'}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {job.status === 'NEGOTIATING' && isOwnJob && (
        <View style={styles.applyContainer}>
          <TouchableOpacity 
            style={[styles.applyButton, { backgroundColor: tokens.colors.amber }]} 
            onPress={() => {
              Alert.alert(
                "إعادة فتح الطلب",
                "هل تريد التراجع عن التفاوض وإعادة فتح الطلب لاستقبال عروض جديدة؟",
                [
                  { text: "إلغاء", style: "cancel" },
                  { 
                    text: "تأكيد", 
                    onPress: () => updateStatus({ jobId, status: 'OPEN' })
                  }
                ]
              );
            }}
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.applyButtonText}>إعادة فتح الطلب للعامة</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {(job.status === 'IN_PROGRESS' || job.status === 'AGREED') && isOwnJob && (
        <View style={styles.applyContainer}>
          <TouchableOpacity 
            style={[styles.applyButton, { backgroundColor: '#28a745' }]} 
            onPress={handleComplete}
          >
            <CheckCircle size={18} color="#fff" style={{ marginEnd: 8 }} />
            <Text style={styles.applyButtonText}>تأكيد إتمام المهمة</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 5. Review section — only shown on COMPLETED jobs for participants */}
      {job.status === 'COMPLETED' && isParticipant && (
        <View style={styles.applyContainer}>
          {myReview ? (
            /* Already reviewed — show read-only */
            <View style={styles.reviewedBadge}>
              <CheckCircle size={16} color={tokens.colors.verdant} style={{ marginEnd: 8 }} />
              <Text style={styles.reviewedText}>
                قيّمت هذه المهمة بـ {myReview.rating} ⭐{myReview.comment ? ` — "${myReview.comment}"` : ''}
              </Text>
            </View>
          ) : (
            /* Not yet reviewed — show button */
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: tokens.colors.gold }]}
              onPress={() => {
                if (isOwnJob) {
                  navigation.navigate('PosterReview', {
                    jobId,
                    jobTitle: job?.title,
                    lawyerId: (job as any)?.assignedLawyerId || (job as any)?.assignedExecutorId,
                    lawyerName: (job as any)?.assignedLawyerName || (job as any)?.assignedLawyer?.fullName,
                    fee: (job as any)?.agreedSalary || job?.salaryMin,
                  });
                } else {
                  navigation.navigate('JobCompletion', {
                    jobId,
                    posterId: job?.posterId || (job as any)?.postedByUserId,
                    posterName: (job as any)?.posterName,
                    fee: (job as any)?.agreedSalary,
                  });
                }
              }}
            >
              <Text style={[styles.applyButtonText, { color: tokens.colors.white }]}>
                قيّم تجربتك ⭐
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paper },
  content: { padding: tokens.spacing.lg },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.paper },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.paper, padding: tokens.spacing.lg },
  errorText: { color: tokens.colors.docket, fontSize: tokens.typography.sizes.base, fontFamily: tokens.typography.fonts.body },
  
  headerSection: {
    marginBottom: tokens.spacing.lg,
  },
  jobTitle: {
    fontSize: 22,
    fontFamily: tokens.typography.fonts.display,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
    lineHeight: 30,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: tokens.typography.sizes.sm,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    marginStart: 6,
  },
  machineTranslatedLabel: {
    fontSize: tokens.typography.sizes.xs,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    marginStart: 6,
    fontStyle: 'italic',
  },

  highlightCard: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  metricBlock: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: tokens.typography.sizes.xs,
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  courtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courtName: {
    fontSize: tokens.typography.sizes.lg,
    fontFamily: tokens.typography.fonts.display,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.navy,
  },
  salaryMono: {
    fontSize: 24,
    fontFamily: tokens.typography.fonts.mono,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.line,
    marginVertical: tokens.spacing.md,
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 143, 133, 0.08)',
    padding: 10,
    borderRadius: 8,
  },
  trustText: {
    fontSize: tokens.typography.sizes.sm,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.signal,
    fontWeight: tokens.typography.weights.semibold,
  },
  
  detailsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  sectionHeader: {
    fontSize: tokens.typography.sizes.lg,
    fontFamily: tokens.typography.fonts.display,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
  },
  translateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    backgroundColor: tokens.colors.white,
  },
  translateBtnText: {
    fontSize: tokens.typography.sizes.sm,
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.signal,
  },
  
  detailsCard: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  description: {
    fontSize: 16,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.ink,
    lineHeight: 26,
  },
  applyContainer: {
    paddingBottom: tokens.spacing.xl,
  },
  applyButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 14,
    backgroundColor: tokens.colors.signal,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: tokens.colors.signal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonDisabled: {
    backgroundColor: tokens.colors.muted,
    shadowOpacity: 0,
    elevation: 0,
  },
  applyButtonText: {
    color: tokens.colors.white,
    fontSize: 17,
    fontWeight: tokens.typography.weights.bold,
    fontFamily: tokens.typography.fonts.body,
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.verdantBg,
    borderWidth: 1,
    borderColor: tokens.colors.verdant,
    borderRadius: 12,
    padding: tokens.spacing.md,
  },
  reviewedText: {
    flex: 1,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.verdant,
    textAlign: 'right',
  },
});
