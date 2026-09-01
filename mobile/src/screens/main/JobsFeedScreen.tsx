import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, RefreshControl, TextInput, Animated, ScrollView, TouchableOpacity } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useJobs } from '../../hooks/useJobs';
import { JobListRow } from '../../components/JobListRow';
import { FilterChipRow } from '../../components/FilterChipRow';
import { EmptyState } from '../../components/EmptyState';
import { VerificationStatusBanner } from '../../components/VerificationStatusBanner';
import { Briefcase, Search, X } from 'lucide-react-native';
import { useSocketStore } from '../../stores/socketStore';
import { useCourtPulseStore } from '../../stores/courtPulseStore';
import { MotiView, AnimatePresence } from 'moti';

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
  const [selectedCourtId, setSelectedCourtId] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>('OPEN');

  const isSearchVisible = route.params?.isSearchVisible ?? false;
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useJobs(selectedCourtId, selectedStatus, searchInput);
  
  const { socket } = useSocketStore();
  const { registerJobEvent, setActiveCount } = useCourtPulseStore();
  
  const queryClient = useQueryClient();
  const flatListRef = useRef<any>(null);

  useEffect(() => {
    if (!socket) return;
    
    const handleJobNew = () => {
      registerJobEvent();
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    };

    socket.on('job:new', handleJobNew);
    
    return () => {
      socket.off('job:new', handleJobNew);
    };
  }, [socket, queryClient, registerJobEvent]);

  useEffect(() => {
    setActiveCount(Math.floor(Math.random() * 15) + 3);
  }, []);

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
          {[1, 2, 3, 4, 5].map(i => <SkeletonJobCard key={i} />)}
        </ScrollView>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-8">
          <Text className="text-docket text-base font-bodyMedium">{'خطأ'}</Text>
        </View>
      ) : (
        <Animated.FlatList
          ref={flatListRef}
          data={jobs}
          keyExtractor={(item: any, index) => item?.id || String(index)}
          renderItem={({ item, index }: any) => (
            <JobListRow
              item={item}
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
              tintColor="#2A8F85"
              colors={["#2A8F85"]}
            />
          }
          ListFooterComponent={() => 
            isFetchingNextPage ? (
              <View className="py-4">
                <SkeletonJobCard />
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
