import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { Search, Plus, Briefcase } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchJobs } from '../../api/jobs.api';
import { useAuthStore } from '../../stores/authStore';
import { JobCard } from '../../components/jobs/JobCard';
import { Job } from '../../schemas/job.schema';

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyPostedJobs = ({ onPost }: { onPost: () => void }) => (
  <View style={styles.emptyState}>
    <Briefcase size={64} color={tokens.colors.line} style={{ marginBottom: tokens.spacing.md }} />
    <Text style={styles.emptyTitle}>لا توجد طلبات نشطة حالياً</Text>
    <Text style={styles.emptyDesc}>
      انشر طلباً أو ابحث عن محامين مباشرةً لتغطية جلسة قضائية.
    </Text>
    <TouchableOpacity style={styles.postBtn} onPress={onPost}>
      <Plus size={20} color={tokens.colors.white} style={{ marginEnd: 8 }} />
      <Text style={styles.postBtnText}>انشر طلباً جديداً</Text>
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export const HiringHomeScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();

  // Fetch jobs posted by this user
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['myPostedJobs', user?.id],
    queryFn: () => fetchJobs(undefined, undefined, undefined, 1, 20),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Filter to only jobs the current user posted
  const myJobs: Job[] = (data?.data ?? []).filter(
    (job: Job) => job.posterId === user?.id
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>طلباتي المنشورة</Text>
        <TouchableOpacity
          style={styles.findBtn}
          onPress={() => navigation.navigate('FindLawyers')}
        >
          <Search size={16} color={tokens.colors.navy} style={{ marginEnd: 6 }} />
          <Text style={styles.findBtnText}>ابحث عن محامين</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tokens.colors.navy} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>حدث خطأ في تحميل الطلبات</Text>
          <Text style={styles.errorSubText}>
            {(error as any)?.message || 'تحقّق من اتصالك بالإنترنت.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : myJobs.length === 0 ? (
        <EmptyPostedJobs onPost={() => navigation.navigate('PostJob')} />
      ) : (
        <FlatList
          data={myJobs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JobCard variant="feed"
              job={item}
              onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
            />
          )}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={tokens.colors.navy}
              colors={[tokens.colors.navy]}
            />
          }
          ListFooterComponent={() => (
            <TouchableOpacity
              style={styles.postBtnInline}
              onPress={() => navigation.navigate('PostJob')}
            >
              <Plus size={18} color={tokens.colors.white} style={{ marginEnd: 8 }} />
              <Text style={styles.postBtnText}>انشر طلباً جديداً</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
  },
  title: {
    fontSize: tokens.typography.sizes.xl,
    fontFamily: tokens.typography.fonts.display,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.ink,
  },
  findBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.slateBg,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  findBtnText: {
    color: tokens.colors.navy,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  errorText: {
    fontSize: tokens.typography.sizes.lg,
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.xs,
    textAlign: 'center',
  },
  errorSubText: {
    fontSize: tokens.typography.sizes.base,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    textAlign: 'center',
    marginBottom: tokens.spacing.lg,
  },
  retryBtn: {
    backgroundColor: tokens.colors.navy,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryBtnText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.base,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  emptyTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.sm,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: tokens.typography.sizes.base,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    textAlign: 'center',
    marginBottom: tokens.spacing.xl,
    lineHeight: 24,
  },
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.navy,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    borderRadius: 8,
  },
  postBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.navy,
    marginHorizontal: tokens.spacing.xl,
    marginBottom: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    borderRadius: 8,
  },
  postBtnText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.base,
  },
});
