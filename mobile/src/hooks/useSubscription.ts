import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { getErrorMessage } from '../utils/errorMessages';
import { Alert } from 'react-native';
import { useAuthStore } from '../stores/authStore';

export const fetchSubscriptionPlans = async () => {
  const res = await apiClient.get('/subscription/plans');
  return res.data;
};

export const fetchSubscriptionStatus = async () => {
  const res = await apiClient.get('/subscription/status');
  return res.data;
};

export const getReceiptUploadUrl = async (variables: { contentType: string }) => {
  const { data } = await apiClient.post('/subscription/receipt-upload-url', variables);
  return data;
};

export const submitSubscription = async (variables: { planId: string; receiptKey: string; paymentMethod: string }) => {
  const payload = {
    planId: variables.planId,
    paymentMethod: variables.paymentMethod,
    receiptFileKey: variables.receiptKey,
  };
  const res = await apiClient.post('/subscription/submit', payload);
  return res.data;
};

export const useSubscriptionPlans = () => {
  return useQuery({
    queryKey: ['subscription', 'plans'],
    queryFn: fetchSubscriptionPlans,
  });
};

export const useGetReceiptUploadUrl = () => {
  return useMutation({
    mutationFn: getReceiptUploadUrl,
    onError: (err) => {
      Alert.alert('خطأ', getErrorMessage(err));
    },
  });
};

export const useSubmitSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', 'status'] });
    },
    onError: (err) => {
      Alert.alert('خطأ', getErrorMessage(err));
    },
  });
};

export const useSubscriptionStatus = () => {
  return useQuery({
    queryKey: ['subscription', 'status'],
    queryFn: fetchSubscriptionStatus,
    refetchInterval: (query) => {
      const status = query.state.data;
      return status?.pendingPayment?.status === 'PENDING' || status?.status === 'PENDING'
        ? 30_000
        : false;
    },
  });
};

export const useSubscriptionAccess = () => {
  const user = useAuthStore((state) => state.user);
  const query = useSubscriptionStatus();
  const status = query.data?.subscriptionStatus ?? user?.subscriptionStatus;
  const expiresAt = query.data?.subscriptionExpiresAt ?? user?.subscriptionExpiresAt;
  const suspendedAt = query.data?.suspendedAt ?? user?.suspendedAt;
  const isSuspended = Boolean(suspendedAt);
  const hasActiveSubscription =
    !isSuspended &&
    (status === 'NOT_REQUIRED' ||
      (status === 'ACTIVE' &&
        expiresAt !== null &&
        expiresAt !== undefined &&
        new Date(expiresAt).getTime() > Date.now()));

  const trial = query.data?.trial ?? user?.trial ?? null;
  const activeSub = !query.isLoading && !query.isError && hasActiveSubscription;
  const canApply = !isSuspended && (activeSub || (trial?.remaining ?? 0) > 0);

  return {
    ...query,
    hasActiveSubscription: activeSub,
    hasPendingPayment:
      query.data?.pendingPayment?.status === 'PENDING' || query.data?.status === 'PENDING',
    trial,
    canApply,
  };
};

