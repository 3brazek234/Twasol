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
import { PostedJobCard } from '../../components/jobs/PostedJobCard';
import { ActiveJobCard } from '../../components/jobs/ActiveJobCard';
import { CompleteJobModal } from '../../components/jobs/CompleteJobModal';
import { FilterChipRow } from '../../components/FilterChipRow';
import { EmptyState } from '../../components/EmptyState';
import { Briefcase, Activity } from 'lucide-react-native';

const FILTER_OPTIONS = [
  { label: 'الكل', value: undefined },
  { label: 'مفتوح', value: 'OPEN' },
  { label: 'جاري التفاوض', value: 'NEGOTIATING' },
  { label: 'تم الاتفاق', value: 'AGREED' },
  { label: 'جاري التنفيذ', value: 'IN_PROGRESS' },
  { label: 'مكتمل', value: 'COMPLETED' },
  { label: 'ملغي', value: 'CANCELLED' },
];

export const MyJobsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
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
      'إلغاء الطلب',
      'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟',
      [
        { text: 'تراجع', style: 'cancel' },
        {
          text: 'إلغاء الطلب',
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

  const renderPostedJob = ({ item }: { item: any }) => (
    <PostedJobCard
      job={item}
      onPress={(id) => navigation.navigate('JobDetail', { jobId: id })}
      onViewApplications={(id) => navigation.navigate('JobDetail', { jobId: id, initialTab: 'applications' })}
      onOpenChat={() => navigation.navigate('ChatsTab')}
      onCancel={handleCancelJob}
      onComplete={(job) => setCompleteModalJob(job)}
    />
  );

  const renderActiveJob = ({ item }: { item: any }) => (
    <ActiveJobCard
      job={item}
      onPress={(id) => navigation.navigate('JobDetail', { jobId: id })}
      onOpenChat={(job) => {
        if (job.conversationId) {
          navigation.navigate('Chat', { conversationId: job.conversationId });
        }
      }}
      onStartJob={handleStartActiveJob}
    />
  );

  const postedJobs = postedJobsQuery.data?.pages.flatMap((p: any) => p.data || p) || [];
  const activeJobs = activeJobsQuery.data || [];

  const postedCount = postedJobs.length;
  const activeCount = activeJobs.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>مهامي</Text>
      </View>

      {hasBothTabs && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'posted' && styles.tabButtonActive]}
            onPress={() => setActiveTab('posted')}
          >
            <Text style={[styles.tabText, activeTab === 'posted' && styles.tabTextActive]}>
              طلباتي المنشورة
            </Text>
            {postedCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{postedCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              مهامي الجارية
            </Text>
            {activeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'posted' && showPosterTab && (
        <View style={styles.tabContent}>
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
              <FilterChipRow
                options={FILTER_OPTIONS}
                selectedValue={statusFilter}
                onSelect={setStatusFilter}
              />
            </ScrollView>
          </View>
          <View style={styles.postJobBtnContainer}>
            <TouchableOpacity 
              style={styles.postJobBtn}
              onPress={() => navigation.navigate('PostJob')}
            >
              <Text style={styles.postJobBtnText}>نشر طلب جديد +</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={postedJobs}
            keyExtractor={(item) => item.id}
            renderItem={renderPostedJob}
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
              />
            }
            ListEmptyComponent={
              !postedJobsQuery.isFetching && !postedJobsQuery.isFetchingNextPage ? (
                <EmptyState
                  icon={<Briefcase size={48} color={tokens.colors.muted} />}
                  headline="لا توجد طلبات منشورة"
                  body="قم بإضافة طلب جديد للبدء في تلقي العروض."
                  ctaText="نشر طلب جديد +"
                  onCtaPress={() => navigation.navigate('PostJob')}
                />
              ) : null
            }
          />
        </View>
      )}

      {activeTab === 'active' && showGigTab && (
        <View style={styles.tabContent}>
          <FlatList
            data={activeJobs}
            keyExtractor={(item) => item.id}
            renderItem={renderActiveJob}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={activeJobsQuery.isFetching}
                onRefresh={() => activeJobsQuery.refetch()}
              />
            }
            ListEmptyComponent={
              !activeJobsQuery.isFetching ? (
                <EmptyState
                  icon={<Activity size={48} color={tokens.colors.muted} />}
                  headline="لا توجد مهام نشطة حالياً"
                  body="استعرض الطلبات المتاحة للبدء في تلقي العروض."
                  ctaText="استعرض الطلبات"
                  onCtaPress={() => navigation.navigate('JobsTab')}
                />
              ) : null
            }
          />
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
            lawyerId: job.assignedExecutorId,
            lawyerName: job.assignedLawyerName,
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
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.navy,
    textAlign: 'right',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surface,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'transparent',
    flexDirection: 'row',
  },
  tabButtonActive: {
    backgroundColor: tokens.colors.navy,
  },
  tabText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.muted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: tokens.colors.gold,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: tokens.typography.fonts.bodySemibold,
  },
  tabContent: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    height: 40,
  },
  postJobBtnContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  postJobBtn: {
    backgroundColor: tokens.colors.gold,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postJobBtnText: {
    color: '#FFFFFF',
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 40,
    gap: 12,
  },
});
