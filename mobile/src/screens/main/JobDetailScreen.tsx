import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useJob, useApplyToJob, useTranslateJob } from '../../hooks/useJobs';
import { useActiveLawyers } from '../../hooks/useCourts';
import { useAuthStore } from '../../stores/authStore';
import { VerificationStatusBanner } from '../../components/VerificationStatusBanner';
import { tokens } from '../../theme/tokens';
import { Landmark, Users, Calendar, Gavel } from 'lucide-react-native';

export const JobDetailScreen = ({ route, navigation }: any) => {
  const { jobId } = route.params || {};

  const { data: job, isLoading, error } = useJob(jobId);
  const { data: activeLawyers, isLoading: isLoadingLawyers } = useActiveLawyers(job?.courtId || '');
  const { mutate: apply, isPending: isApplying } = useApplyToJob();
  const { mutate: translate, isPending: isTranslating } = useTranslateJob();
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
        Alert.alert('Translation failed', err.message || 'Could not translate case description.');
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
            params: { conversationId: convId, conversationType: 'DIRECT_INQUIRY' },
          });
        } else {
          // convId not returned — go to conversations list as fallback
          navigation.navigate('ChatsTab', { screen: 'ConversationsList' });
        }
      },
      onError: (err: any) => {
        Alert.alert('System Alert', err.message || 'Application could not be submitted.');
      },
    });
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
        <Text style={styles.errorText}>Brief not found. Check identifier link.</Text>
      </View>
    );
  }

  const formattedAmount = job.offerAmount ? `$${job.offerAmount}` : 'Negotiable';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Court & Price Highlights (The two crucial decision facts UP TOP) */}
      <View style={styles.highlightCard}>
        <View style={styles.headerInfo}>
          <View style={styles.courtHeader}>
            <Landmark size={20} color={tokens.colors.ink} style={{ marginEnd: 8 }} />
            <Text style={styles.courtName}>Court {job.courtId.substring(0, 8).toUpperCase()}</Text>
          </View>
          <Text style={styles.salaryMono}>{formattedAmount}</Text>
        </View>

        <View style={styles.divider} />

        {/* Active lawyers indicator (Core trust signal) */}
        <View style={styles.trustIndicator}>
          <Users size={16} color={tokens.colors.signal} style={{ marginEnd: 8 }} />
          <Text style={styles.trustText}>
            {isLoadingLawyers ? (
              'جاري فحص وجود المحامين...'
            ) : (
              `المحامون النشطون في هذه المحكمة: ${activeLawyers?.length || 0}`
            )}
          </Text>
        </View>
      </View>

      {/* Case Details below the fold */}
      <Text style={styles.sectionHeader}>{'الوصف'.toUpperCase()}</Text>
      <View style={styles.detailsCard}>
        <View style={styles.titleRow}>
          <Text style={styles.jobTitle}>{isTranslated && translatedTitle ? translatedTitle : job.title}</Text>
          <TouchableOpacity 
            onPress={handleTranslate} 
            style={styles.translateBtn}
            disabled={isTranslating}
          >
            {isTranslating ? (
              <ActivityIndicator size="small" color={tokens.colors.signal} />
            ) : (
              <Text style={styles.translateBtnText}>
                {isTranslated ? 'Show Original' : 'ترجمة الوصف'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.metaRow}>
          <Calendar size={14} color={tokens.colors.muted} />
          <Text style={styles.metaText}>Posted on {new Date(job.createdAt).toLocaleDateString()}</Text>
          {isTranslated && (
            <Text style={styles.machineTranslatedLabel}>• {'ترجمة آلية'}</Text>
          )}
        </View>
        
        <Text style={styles.description}>{isTranslated && translatedDescription ? translatedDescription : job.description}</Text>
      </View>

      {job.status === 'OPEN' && (
        <View style={styles.applyContainer}>
          {!isVerified && !isOwnJob && (
            <View style={{ marginBottom: tokens.spacing.md }}>
              <VerificationStatusBanner />
            </View>
          )}
          {isOwnJob ? (
            <View style={[styles.applyButton, { backgroundColor: tokens.colors.paper, borderWidth: 1, borderColor: tokens.colors.line }]}>
              <Text style={[styles.applyButtonText, { color: tokens.colors.ink }]}>This is your brief</Text>
            </View>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paper },
  content: { padding: tokens.spacing.md },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.paper },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.paper, padding: tokens.spacing.lg },
  errorText: { color: tokens.colors.docket, fontSize: tokens.typography.sizes.base, fontFamily: tokens.typography.fonts.body },
  
  highlightCard: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: 16,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  courtName: {
    fontSize: tokens.typography.sizes.xl,
    fontFamily: tokens.typography.fonts.display,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
  },
  salaryMono: {
    fontSize: tokens.typography.sizes.xxl,
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
  },
  trustText: {
    fontSize: tokens.typography.sizes.sm,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.signal,
    fontWeight: tokens.typography.weights.semibold,
  },
  
  sectionHeader: {
    fontSize: tokens.typography.sizes.xs - 1,
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.muted,
    letterSpacing: 1,
    marginBottom: tokens.spacing.xs,
    marginStart: 4,
  },
  detailsCard: {
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: 16,
    padding: tokens.spacing.lg,
    marginBottom: tokens.spacing.xl,
  },
  jobTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontFamily: tokens.typography.fonts.display,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  metaText: {
    fontSize: tokens.typography.sizes.xs,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    marginStart: 6,
  },
  description: {
    fontSize: tokens.typography.sizes.base,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.ink,
    lineHeight: 22,
  },
  applyContainer: {
    paddingBottom: tokens.spacing.xl,
  },
  applyButton: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 12,
    backgroundColor: tokens.colors.signal,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: tokens.colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonDisabled: {
    backgroundColor: tokens.colors.muted,
    opacity: 0.7,
  },
  applyButtonText: {
    color: tokens.colors.white,
    fontSize: tokens.typography.sizes.base,
    fontWeight: tokens.typography.weights.bold,
    fontFamily: tokens.typography.fonts.body,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  translateBtn: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    backgroundColor: tokens.colors.paper,
  },
  translateBtnText: {
    fontSize: tokens.typography.sizes.xs - 1,
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.signal,
  },
  machineTranslatedLabel: {
    fontSize: tokens.typography.sizes.xs,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    marginStart: 6,
    fontStyle: 'italic',
  },
});
