import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { tokens } from '../../theme/tokens';
import { useAuthStore } from '../../stores/authStore';
import { useMyPostedJobs, useMyActiveJobs, useUpdateJobStatus } from '../../hooks/useJobs';
import { JobCard } from '../../components/jobs/JobCard';
import { JobCardSkeleton } from '../../components/jobs/JobCardSkeleton';

import { CompleteJobModal } from '../../components/jobs/CompleteJobModal';
import { FilterChipRow } from '../../components/FilterChipRow';
import { EmptyState } from '../../components/EmptyState';
import { Briefcase, Activity, LockKeyhole, Plus } from 'lucide-react-native';
import { useSubscriptionAccess } from '../../hooks/useSubscription';
import { SubscriptionAccessCard } from '../../components/SubscriptionAccessCard';

const FILTER_OPTIONS = [
  { label: 'الكل', value: undefined },
  { label: 'مفتوح', value: 'OPEN' },
  { label: 'جاري التفاوض', value: 'NEGOTIATING' },
  { label: 'تم الاتفاق', value: 'AGREED' },
  { label: 'جاري التنفيذ', value: 'IN_PROGRESS' },
  { label: 'مكتمل', value: 'COMPLETED' },
  { label: 'ملغي', value: 'CANCELLED' },
  { label: 'منتهي الصلاحية', value: 'EXPIRED' },
];

export const MyJobsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const subscription = useSubscriptionAccess();
  const accountMode = user?.accountMode || 'BOTH';
  
  const showPosterTab = accountMode === 'HIRING' || accountMode === 'BOTH';
  const showGigTab = accountMode === 'GIG' || accountMode === 'BOTH';
  const hasBothTabs = showPosterTab && showGigTab;

  const [activeTab, setActiveTab] = useState<'posted' | 'active'>(
    showPosterTab ? 'posted' : 'active'
  );
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [completeModalJob, setCompleteModalJob] = useState<any>(null);

  // Tab A - Posted Jobs
  const postedJobsQuery = useMyPostedJobs(statusFilter);
  const updateJobStatus = useUpdateJobStatus();

  // Tab B - Active Jobs
  const activeJobsQuery = useMyActiveJobs();

  const handleCancelJob = (jobId: string) => {
    Alert.alert(
      'إلغاء المهمة',
      'هل أنت متأكد من رغبتك في إلغاء هذه المهمة؟',
      [
        { text: 'تراجع', style: 'cancel' },
        {
          text: 'إلغاء المهمة',
          style: 'destructive',
          onPress: () => {
            updateJobStatus.mutate({ jobId, status: 'CANCELLED' });
          },
        },
      ]
    );
  };

  const handleStartActiveJob = (jobId: string) => {
    updateJobStatus.mutate(
      { jobId, status: 'IN_PROGRESS' },
      {
        onSuccess: () => {
          activeJobsQuery.refetch();
        },
      }
    );
  };

  const renderPostedJob = ({ item }: { item: any }) => {
    const myReview = Array.isArray(item.reviews)
      ? item.reviews.find((r: any) => r.reviewerId === user?.id)
      : undefined;

    return (
      <JobCard
        variant="posted"
        job={item}
        hasReviewed={!!myReview}
        ratingGiven={myReview?.rating}
        onPress={(id) => navigation.navigate('JobDetail', { jobId: id })}
        onViewApplications={(id) => navigation.navigate('JobDetail', { jobId: id, initialTab: 'applications' })}
        onOpenChat={(job) => {
          if (job?.conversationId) {
            navigation.navigate('Chat', {
              conversationId: job.conversationId,
              jobStatus: job.status,
              jobTitle: job.title,
            });
          } else {
            navigation.navigate('ChatsTab');
          }
        }}
        onCancel={handleCancelJob}
        onComplete={(job) => setCompleteModalJob(job)}
        onReview={() => {
          if (myReview) return;
          navigation.navigate('PosterReview', {
            jobId: item.id,
            jobTitle: item.title,
            lawyerId: item.assignedExecutorId || item.assignedLawyerId,
            lawyerName: item.assignedLawyerName || item.assignedLawyer?.fullName,
            fee: item.agreedSalary || item.salaryMin,
          });
        }}
      />
    );
  };

  const renderActiveJob = ({ item }: { item: any }) => {
    const myReview = Array.isArray(item.reviews)
      ? item.reviews.find((r: any) => r.reviewerId === user?.id)
      : undefined;

    return (
      <JobCard
        variant="active"
        job={item}
        hasReviewed={!!myReview}
        ratingGiven={myReview?.rating}
        onPress={(id) => navigation.navigate('JobDetail', { jobId: id })}
        onOpenChat={(job) => {
          if (job?.conversationId) {
            navigation.navigate('Chat', {
              conversationId: job.conversationId,
              jobStatus: job.status,
              jobTitle: job.title,
            });
          } else {
            navigation.navigate('ChatsTab');
          }
        }}
        onStartJob={handleStartActiveJob}
        onReview={() => {
          if (myReview) return;
          navigation.navigate('JobCompletion', {
            jobId: item.id,
            posterId: item.posterId || item.postedByUserId,
            posterName: item.posterName || item.poster_name,
            fee: item.agreedSalary || item.fee,
          });
        }}
      />
    );
  };

  const postedJobs = postedJobsQuery.data?.pages.flatMap((p: any) => p.data || p) || [];
  const activeJobs = activeJobsQuery.data || [];

  const postedCount =
    (postedJobsQuery.data?.pages?.[0] as any)?.meta?.totalAll ?? postedJobs.length;
  const activeCount = activeJobs.length;
  const openSubscription = () => navigation.navigate('SettingsStack', { screen: 'Subscription' });

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>مهامي</Text>
        {activeTab === 'posted' && showPosterTab && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: !subscription.hasActiveSubscription }}
            style={[styles.postJobBtn, !subscription.hasActiveSubscription && styles.postJobBtnDisabled]}
            disabled={!subscription.hasActiveSubscription}
            onPress={() => navigation.navigate('PostJob')}
            activeOpacity={0.8}
          >
            {subscription.hasActiveSubscription ? (
              <View style={styles.postJobBtnInner}>
                <Plus size={15} color={tokens.colors.white} strokeWidth={2.5} />
                <Text style={styles.postJobBtnText}>نشر مهمة جديدة</Text>
              </View>
            ) : (
              <View style={styles.lockedPostLabel}>
                <LockKeyhole size={14} color={tokens.colors.muted} />
                <Text style={styles.postJobBtnTextDisabled}>يتطلب اشتراكاً</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {showPosterTab && !subscription.hasActiveSubscription && (
        <View style={styles.subscriptionCardContainer}>
          <SubscriptionAccessCard
            isLoading={subscription.isLoading}
            isError={subscription.isError}
            hasPendingPayment={subscription.hasPendingPayment}
            onPress={openSubscription}
            onRetry={() => subscription.refetch()}
          />
        </View>
      )}

      {hasBothTabs && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'posted' && styles.tabButtonActive]}
            onPress={() => setActiveTab('posted')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'posted' && styles.tabTextActive]}>
              مهامي المنشورة
            </Text>
            {postedCount > 0 && (
              <View style={[styles.badge, activeTab === 'posted' ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, activeTab === 'posted' ? styles.badgeTextActive : styles.badgeTextInactive]}>
                  {postedCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
            onPress={() => setActiveTab('active')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              مهامي الجارية
            </Text>
            {activeCount > 0 && (
              <View style={[styles.badge, activeTab === 'active' ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, activeTab === 'active' ? styles.badgeTextActive : styles.badgeTextInactive]}>
                  {activeCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'posted' && showPosterTab && (
        <View style={styles.tabContent}>
          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterScrollContent}
            >
              <FilterChipRow
                options={FILTER_OPTIONS}
                selectedValue={statusFilter}
                onSelect={setStatusFilter}
              />
            </ScrollView>
          </View>

          {postedJobsQuery.isLoading ? (
            <ScrollView
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
              contentContainerStyle={styles.listContent}
            >
              {[1, 2, 3].map(i => <JobCardSkeleton key={i} variant="posted" />)}
            </ScrollView>
          ) : (
            <FlatList
              data={postedJobs}
              keyExtractor={(item) => item.id}
              renderItem={renderPostedJob}
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
              contentContainerStyle={styles.listContent}
              onEndReached={() => {
                if (postedJobsQuery.hasNextPage) {
                  postedJobsQuery.fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.5}
              refreshControl={
                <RefreshControl
                  refreshing={postedJobsQuery.isFetching && !postedJobsQuery.isFetchingNextPage}
                  onRefresh={() => postedJobsQuery.refetch()}
                  tintColor={tokens.colors.gold}
                />
              }
              ListEmptyComponent={
                !postedJobsQuery.isFetching && !postedJobsQuery.isFetchingNextPage ? (
                  <EmptyState
                    icon={<Briefcase size={48} color={tokens.colors.muted} />}
                    headline="لا توجد مهام منشورة"
                    body={postedJobsQuery.isError ? "حدث خطأ أثناء تحميل المهام. يرجى سحب الشاشة للأسفل للمحاولة مرة أخرى." : "لم تقم بنشر أي مهام مطابقة لهذا التصنيف حتى الآن."}
                    ctaText={subscription.hasActiveSubscription ? 'نشر مهمة جديدة +' : undefined}
                    onCtaPress={subscription.hasActiveSubscription
                      ? () => navigation.navigate('PostJob')
                      : undefined}
                  />
                ) : null
              }
            />
          )}
        </View>
      )}

      {activeTab === 'active' && showGigTab && (
        <View style={styles.tabContent}>
          {activeJobsQuery.isLoading ? (
            <ScrollView
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
              contentContainerStyle={styles.listContent}
            >
              {[1, 2, 3].map(i => <JobCardSkeleton key={i} variant="active" />)}
            </ScrollView>
          ) : (
            <FlatList
              data={activeJobs}
              keyExtractor={(item) => item.id}
              renderItem={renderActiveJob}
              contentInsetAdjustmentBehavior="never"
              automaticallyAdjustContentInsets={false}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={activeJobsQuery.isFetching}
                  onRefresh={() => activeJobsQuery.refetch()}
                  tintColor={tokens.colors.gold}
                />
              }
              ListEmptyComponent={
                !activeJobsQuery.isFetching ? (
                  <EmptyState
                    icon={<Activity size={48} color={tokens.colors.muted} />}
                    headline="لا توجد مهام نشطة حالياً"
                    body="استعرض المهام المتاحة للبدء في تلقي العروض."
                    ctaText="استعرض المهام"
                    onCtaPress={() => navigation.navigate('JobsTab')}
                  />
                ) : null
              }
            />
          )}
        </View>
      )}

      <CompleteJobModal
        visible={!!completeModalJob}
        job={completeModalJob}
        onClose={() => setCompleteModalJob(null)}
        onSuccess={(job) => {
          setCompleteModalJob(null);
          navigation.navigate('PosterReview', {
            jobId: job.id,
            jobTitle: job.title,
            lawyerId: job.assignedExecutorId || job.assignedLawyerId,
            lawyerName: job.assignedLawyerName || job.assignedLawyer?.fullName,
            fee: job.agreedSalary || job.salaryMin,
          });
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
    direction: 'rtl',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: 24,
    color: tokens.colors.ink,
    textAlign: 'right',
  },
  subscriptionCardContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surface,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: tokens.colors.navy,
  },
  tabText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14,
    color: tokens.colors.muted,
  },
  tabTextActive: {
    color: tokens.colors.white,
  },
  badge: {
    borderRadius: 10,
    minWidth: 22,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeActive: {
    backgroundColor: tokens.colors.gold,
  },
  badgeInactive: {
    backgroundColor: tokens.colors.line,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: tokens.typography.fonts.bodySemibold,
  },
  badgeTextActive: {
    color: tokens.colors.white,
  },
  badgeTextInactive: {
    color: tokens.colors.slate,
  },
  tabContent: {
    flex: 1,
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  postJobBtn: {
    backgroundColor: tokens.colors.gold,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  postJobBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postJobBtnDisabled: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  postJobBtnText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 13,
  },
  lockedPostLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  postJobBtnTextDisabled: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
});
