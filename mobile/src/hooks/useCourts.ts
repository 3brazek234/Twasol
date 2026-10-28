import { getErrorMessage } from "../utils/errorMessages";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import {
  getAllCourts, getMyCourts, registerCourt, removeCourt,
  toggleCourtStatus, getLawyers, getGovernorates, searchCourts,
} from '../api/courts.api';
import { CourtType } from '../schemas/court.schema';

// ─── Governorates ─────────────────────────────────────────────────────────────

export const useGovernorates = () => {
  return useQuery({
    queryKey: ['governorates'],
    queryFn: getGovernorates,
    staleTime: 1000 * 60 * 60, // 1 hour — this data never changes
  });
};

// ─── Courts by Governorate (Single Governorate Selection) ────────────────────

export const useAllCourts = (filters?: { type?: CourtType; governorateId?: string }) => {
  const isCassation = filters?.type === 'CASSATION';
  const hasGovernorate = Boolean(filters?.governorateId);

  return useQuery({
    queryKey: ['courts', 'by-gov', filters?.governorateId ?? 'none', filters?.type ?? 'all'],
    queryFn: () => getAllCourts(filters),
    // Never fetch all courts globally — only fetch when a single governorate is selected (or national Cassation)
    enabled: isCassation || hasGovernorate,
    staleTime: 1000 * 60 * 5,
  });
};

// ─── Court Search ─────────────────────────────────────────────────────────────

export const useCourtSearch = (query: string) => {
  return useQuery({
    queryKey: ['courts', 'search', query],
    queryFn: () => searchCourts(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 30,
  });
};

// ─── My Courts ────────────────────────────────────────────────────────────────

export const useMyCourts = () => {
  return useQuery({
    queryKey: ['courts', 'my'],
    queryFn: getMyCourts,
  });
};

// ─── Register Court ───────────────────────────────────────────────────────────

export const useRegisterCourt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerCourt,
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courts', 'my'] });
    },
  });
};

// ─── Remove Court ─────────────────────────────────────────────────────────────

export const useRemoveCourt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCourt,
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courts', 'my'] });
    },
  });
};

// ─── Toggle Active Status ─────────────────────────────────────────────────────

export const useToggleCourtStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleCourtStatus(id, isActive),
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courts', 'my'] });
    },
  });
};

// ─── Lawyers at a Court ───────────────────────────────────────────────────────

export const useLawyersAtCourt = (courtId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['courts', courtId, 'lawyers'],
    queryFn: () => getLawyers(courtId),
    enabled: !!courtId && enabled,
    staleTime: 60_000,
  });
};
