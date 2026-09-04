import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { fetchJobs, createJob, applyToJob, updateJobStatus, fetchJobById, translateJob } from '../api/jobs.api';

export const useJobs = (courtId?: string, status?: string, searchQuery?: string) => {
  return useInfiniteQuery({
    queryKey: ['jobs', { courtId, status, searchQuery }],
    queryFn: ({ pageParam = 1 }) => fetchJobs(courtId, status, searchQuery, pageParam, 10),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useApplyToJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => applyToJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useUpdateJobStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: string, status: string }) => updateJobStatus(jobId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useTranslateJob = () => {
  return useMutation({
    mutationFn: ({ jobId, targetLocale }: { jobId: string, targetLocale: 'EN' | 'AR' }) => translateJob(jobId, targetLocale),
  });
};
