import { Alert } from "react-native";
import { getErrorMessage } from "../utils/errorMessages";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { fetchJobs, createJob, applyToJob, declareJobConflict, updateJobStatus, fetchJobById, translateJob, fetchMyPostedJobs, fetchMyActiveJobs, completeJob } from '../api/jobs.api';

export const useJobs = (courtId?: string, status?: string, taskType?: string, sortBy?: string) => {
  return useInfiniteQuery({
    queryKey: ['jobs', 'feed', { courtId, status, taskType, sortBy }],
    queryFn: ({ pageParam = 1 }) => fetchJobs(courtId, status, taskType, sortBy, pageParam, 10),
    getNextPageParam: (lastPage: any, allPages: any) => {
      const nextPage = (allPages?.length || 0) + 1;
      return nextPage <= lastPage.meta?.pages ? nextPage : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes (as specified for offline reads)
  });
};

export const useJob = (jobId: string) => {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => fetchJobById(jobId),
    enabled: !!jobId,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createJob,
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useApplyToJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => applyToJob(jobId),
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useDeclareJobConflict = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => declareJobConflict(jobId),
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useUpdateJobStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: string, status: string }) => updateJobStatus(jobId, status),
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useTranslateJob = () => {
  return useMutation({
    mutationFn: ({ jobId, targetLocale }: { jobId: string, targetLocale: 'EN' | 'AR' }) => translateJob(jobId, targetLocale),
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); }
  });
};

export const useMyPostedJobs = (statusFilter?: string) => {
  return useInfiniteQuery({
    queryKey: ['jobs', 'my-posted', statusFilter],
    queryFn: ({ pageParam = 1 }) => fetchMyPostedJobs(statusFilter, pageParam, 10),
    getNextPageParam: (lastPage: any, allPages: any) => {
      const nextPage = (allPages?.length || 0) + 1;
      return nextPage <= lastPage.meta?.pages ? nextPage : undefined;
    },
    initialPageParam: 1,
  });
};

export const useMyActiveJobs = () => {
  return useQuery({
    queryKey: ['jobs', 'my-active'],
    queryFn: fetchMyActiveJobs,
  });
};

export const useCompleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeJob,
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'my-posted'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'my-active'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};
