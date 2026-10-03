import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Briefcase, Plus, Search } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { useMyPostedJobs } from '../../hooks/useJobs';
import { JobCard } from '../../components/jobs/JobCard';
import { JobCardSkeleton } from '../../components/jobs/JobCardSkeleton';
import { EmptyState } from '../../components/EmptyState';

export const HiringHomeScreen = ({ navigation }: any) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMyPostedJobs();

  const jobs = useMemo(
    () => data?.pages.flatMap((page: any) => page.data || page) ?? [],
    [data],
  );
  const openJobsCount = jobs.filter((job: any) => job.status === 'OPEN' || job.status === 'NEGOTIATING').length;
  const activeAssignmentsCount = jobs.filter((job: any) => job.status === 'AGREED' || job.status === 'IN_PROGRESS').length;

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCount}>{openJobsCount}</Text>
          <Text style={styles.summaryLabel}>طلبات مفتوحة</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCount}>{activeAssignmentsCount}</Text>
          <Text style={styles.summaryLabel}>تكليفات جارية</Text>
        </View>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.postButton}
        onPress={() => navigation.navigate('PostJob')}
      >
        <Plus size={18} color={tokens.colors.white} />
        <Text style={styles.postButtonText}>نشر مهمة جديدة</Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.findButton}
        onPress={() => navigation.navigate('FindLawyers')}
      >
        <Search size={16} color={tokens.colors.navy} />
        <Text style={styles.findButtonText}>ابحث عن محامٍ</Text>
      </TouchableOpacity>

      <View style={styles.sectionHeading}>
        <Briefcase size={18} color={tokens.colors.navy} />
        <Text style={styles.sectionTitle}>متابعة مهامي المنشورة</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {[1, 2, 3].map((item) => <JobCardSkeleton key={item} variant="compact" />)}
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>تعذّر تحميل مهامك</Text>
        <Text style={styles.errorMessage}>
          {(error as Error)?.message || 'تحقّق من اتصالك بالإنترنت ثم حاول مجدداً.'}
        </Text>
        <TouchableOpacity accessibilityRole="button" style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }: any) => (
        <JobCard
          job={item}
          variant="compact"
          onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
        />
      )}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        !isFetching ? (
          <EmptyState
            icon={<Briefcase size={48} color={tokens.colors.muted} />}
            headline="ابدأ بإسناد مهامك"
            body="انشر مهمة لتتابع الطلبات والتكليفات من مكان واحد."
            ctaText="نشر مهمة جديدة"
            onCtaPress={() => navigation.navigate('PostJob')}
          />
        ) : null
      }
      ListFooterComponent={
        isFetchingNextPage
          ? <ActivityIndicator style={styles.paginationLoader} color={tokens.colors.navy} />
          : null
      }
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isFetchingNextPage}
          onRefresh={() => refetch()}
          tintColor={tokens.colors.navy}
          colors={[tokens.colors.navy]}
        />
      }
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
    />
  );
};

const styles = {
  listContent: {
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.xxl,
    flexGrow: 1,
  },
  listHeader: {
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  summaryCard: {
    flex: 1,
    padding: tokens.spacing.sm,
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
  },
  summaryCount: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.mono,
    fontSize: tokens.typography.sizes.xl,
    textAlign: 'right' as const,
  },
  summaryLabel: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
    textAlign: 'right' as const,
    marginTop: tokens.spacing.xxs,
  },
  postButton: {
    minHeight: tokens.spacing.xxl,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: tokens.spacing.xs,
    backgroundColor: tokens.colors.navy,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.xs,
  },
  postButtonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
  },
  findButton: {
    minHeight: tokens.spacing.xxl,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: tokens.spacing.xs,
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    marginBottom: tokens.spacing.md,
  },
  findButtonText: {
    color: tokens.colors.navy,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
  },
  sectionHeading: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: tokens.spacing.xs,
    paddingVertical: tokens.spacing.xs,
  },
  sectionTitle: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.base,
  },
  loadingContainer: {
    flex: 1,
    padding: tokens.spacing.md,
    paddingTop: tokens.spacing.lg,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: tokens.spacing.xl,
  },
  errorTitle: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.lg,
    textAlign: 'center' as const,
    marginBottom: tokens.spacing.xs,
  },
  errorMessage: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.sm,
    lineHeight: tokens.typeScale.body.lineHeight,
    textAlign: 'center' as const,
    marginBottom: tokens.spacing.md,
  },
  retryButton: {
    backgroundColor: tokens.colors.navy,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  retryButtonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
  },
  paginationLoader: {
    paddingVertical: tokens.spacing.md,
  },
};
