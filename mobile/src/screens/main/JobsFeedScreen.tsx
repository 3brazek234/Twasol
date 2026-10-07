import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, RefreshControl, ScrollView, TouchableOpacity, ActivityIndicator, I18nManager } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { useJobs } from '../../hooks/useJobs';
import { JobCard } from '../../components/jobs/JobCard';
import { FilterChipRow } from '../../components/FilterChipRow';
import { EmptyState } from '../../components/EmptyState';

import { MotiView } from 'moti';
import { tokens } from '../../theme/tokens';
import { JobFiltersBottomSheet } from '../../components/jobs/JobFiltersBottomSheet';

import { EmptyStateIllustration } from '../../components/EmptyStateIllustration';

const SkeletonJobCard = () => {
  return (
    <MotiView
      from={{ opacity: 0.3 }}
      animate={{ opacity: 0.7 }}
      transition={{ type: 'timing', duration: 1000, loop: true }}
      className="bg-white mx-6 mb-4 p-6 rounded-2xl shadow-sm border border-line"
    >
      <View className="h-4 bg-line rounded w-3/5" />
      <View className="h-4 bg-line rounded w-2/5 mt-2" />
      <View className="h-4 bg-line rounded w-4/5 mt-3" />
    </MotiView>
  );
};

export const JobsFeedScreen = ({ navigation, route }: any) => {
  const [selectedCourtId, setSelectedCourtId] = useState<string | undefined>(route.params?.courtId ?? undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>('OPEN');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [taskType, setTaskType] = useState<string | undefined>(route.params?.taskType ?? undefined);
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);


  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useJobs(selectedCourtId, selectedStatus, taskType, sortBy);

  // ── Refetch when the screen comes back into focus ──────────────────────────
  // This handles: navigating back from JobDetail, returning from PostJob, etc.
  // staleTime on the query (5 min) prevents a redundant network call if the
  // data is still fresh.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // ── Optional 60-second background poll while screen is visible ─────────────
  // Non-redundant with staleTime=5min: the poll fires every 60s, but React
  // Query will skip the network call if data is still within the 5-min window.
  // This gives a lightweight freshness guarantee without sockets.
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused) return;
    const interval = setInterval(() => {
      refetch();
    }, 60_000);
    return () => clearInterval(interval);
  }, [isFocused, refetch]);

  const jobs = useMemo(() => {
    return data?.pages.flatMap((page) => page.data).filter(Boolean) || [];
  }, [data]);

  const filterOptions = [
    { label: 'المهام النشطة', value: 'OPEN' },
    { label: 'قيد التفاوض', value: 'NEGOTIATING' },
    { label: 'كل المهام', value: undefined },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: tokens.colors.paper }}>


      <View className="bg-white border-b border-line py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, alignItems: 'center', gap: 8, flexDirection: 'row' }}
        >
          <FilterChipRow
            options={filterOptions}
            selectedValue={selectedStatus}
            onSelect={setSelectedStatus}
          />
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, alignItems: 'center', marginTop: 8, gap: 8, flexDirection: 'row' }}
        >
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: taskType ? tokens.colors.signal : tokens.colors.line,
              backgroundColor: taskType ? tokens.colors.signal + '15' : tokens.colors.paper,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 4
            }}
            onPress={() => setIsFilterSheetVisible(true)}
          >
            <Text style={{ fontSize: 13, fontFamily: tokens.typography.fonts.bodyMedium, color: taskType ? tokens.colors.signal : tokens.colors.muted }}>
              تصفية بالمهمة {taskType && '•'}
            </Text>
          </TouchableOpacity>
          <View style={{ width: 1, height: 20, backgroundColor: tokens.colors.line, marginHorizontal: 4 }} />
          <FilterChipRow
            options={[
              { label: 'الأحدث', value: 'newest' },
              { label: 'الأعلى أجراً', value: 'fee_desc' },
              { label: 'الأقرب موعداً', value: 'deadline_asc' },
            ]}
            selectedValue={sortBy}
            onSelect={(val) => setSortBy(val || 'newest')}
          />
        </ScrollView>
      </View>

      {isLoading ? (
        <ScrollView className="pt-4">
          {[1, 2, 3, 4, 5].map(i => <SkeletonJobCard key={i} />)}
        </ScrollView>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-8">
          <Text className="text-ink text-lg font-displayBold mb-2">حدث خطأ</Text>
          <Text className="text-muted text-base font-body text-center mb-6">
            {(error as any)?.message || 'تعذّر تحميل المهام. تحقّق من اتصالك بالإنترنت.'}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="bg-signal px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-bodySemibold">إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={jobs}
          keyExtractor={(item: any, index) => item?.id || String(index)}
          renderItem={({ item }: any) => (
            <JobCard
              job={item}
              variant="feed"
              onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
              onApply={() => navigation.navigate('JobDetail', { jobId: item.id })}
            />
          )}
          contentContainerStyle={{ paddingTop: 16, flexGrow: jobs.length === 0 ? 1 : 0 }}
          scrollEventThrottle={16}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#1B4F72"
              colors={["#1B4F72"]}
            />
          }
          ListFooterComponent={() =>
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#1B4F72" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              illustration={<EmptyStateIllustration kind="jobs" />}
              headline="لا توجد مهام تطابق هذه التصفية"
              body="جرّب تغيير التصفية أو أضف محاكم أخرى لتوسيع نطاق بحثك."
              ctaText="إدارة المحاكم"
              onCtaPress={() => navigation.navigate('ProfileTab', { screen: 'MyCourts' })}
            />
          }
        />
      )}

      <JobFiltersBottomSheet
        isVisible={isFilterSheetVisible}
        onClose={() => setIsFilterSheetVisible(false)}
        currentTaskType={taskType}
        onApply={(type) => setTaskType(type)}
      />
    </View>
  );
};
