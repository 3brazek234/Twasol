import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, RefreshControl, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { useJobs } from '../../hooks/useJobs';
import { JobCard } from '../../components/jobs/JobCard';
import { FilterChipRow } from '../../components/FilterChipRow';
import { EmptyState } from '../../components/EmptyState';
import { VerificationStatusBanner } from '../../components/VerificationStatusBanner';
import { Briefcase, Search, X } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import { JobCardSkeleton } from "../../components/jobs/JobCardSkeleton";



export const JobsFeedScreen = ({ navigation, route }: any) => {
  const [selectedCourtId, setSelectedCourtId] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>('OPEN');

  const isSearchVisible = route.params?.isSearchVisible ?? false;
  const [searchInput, setSearchInput] = useState('');

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useJobs(selectedCourtId, selectedStatus, searchInput);

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
    { label: 'القضايا النشطة', value: 'OPEN' },
    { label: 'قيد التفاوض', value: 'NEGOTIATING' },
    { label: 'كل الطلبات', value: undefined },
  ];

  return (
    <View className="flex-1 bg-paper">
      <VerificationStatusBanner />

      <AnimatePresence>
        {isSearchVisible && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 64 }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 justify-center bg-white border-b border-line"
          >
            <View className="flex-row items-center bg-paper rounded-xl px-4 h-11">
              <Search color="#718096" size={18} />
              <TextInput
                className="flex-1 ml-2 text-base font-bodyMedium text-ink h-full"
                placeholder={'البحث عن الطلبات بالكلمات المفتاحية...'}
                value={searchInput}
                onChangeText={setSearchInput}
                placeholderTextColor="#718096"
                autoFocus
              />
              <TouchableOpacity onPress={() => navigation.setParams({ isSearchVisible: false })}>
                <X size={20} color="#718096" />
              </TouchableOpacity>
            </View>
          </MotiView>
        )}
      </AnimatePresence>

      <View className="bg-white border-b border-line py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, alignItems: 'center' }}
        >
          <FilterChipRow
            options={filterOptions}
            selectedValue={selectedStatus}
            onSelect={setSelectedStatus}
          />
        </ScrollView>
      </View>

      {isLoading ? (
        <ScrollView className="pt-4">
          {[1, 2, 3, 4, 5].map(i => <JobCardSkeleton key={i} variant="feed" />)}
        </ScrollView>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-8">
          <Text className="text-ink text-lg font-displayBold mb-2">حدث خطأ</Text>
          <Text className="text-muted text-base font-body text-center mb-6">
            {(error as any)?.message || 'تعذّر تحميل الطلبات. تحقّق من اتصالك بالإنترنت.'}
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
            <JobCard variant="feed"
              job={item}
              onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
            />
          )}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
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
              icon={<Briefcase size={64} color="#E2E8F0" />}
              headline={'لم يتم العثور على أي طلبات'}
              body={'لا توجد طلبات مفتوحة في المحاكم المسجل بها حالياً. يمكنك إضافة محكمة أخرى لتوسيع نطاق بحثك.'}
              ctaText={'إدارة الاختصاصات القضائية'}
              onCtaPress={() => navigation.navigate('ProfileTab', { screen: 'MyCourts' })}
            />
          }
        />
      )}
    </View>
  );
};
