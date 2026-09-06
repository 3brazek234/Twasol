import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { getErrorMessage } from '../utils/errorMessages';
import { Alert } from 'react-native';

export const fetchSubscriptionPlans = async () => {
  const res = await apiClient.get('/subscription/plans');
  return res.data.data;
};

export const getReceiptUploadUrl = async (variables: { contentType: string }) => {
  const { data } = await apiClient.post('/subscription/receipt-upload-url', variables);
  return data;
};

export const submitSubscription = async (variables: { planId: string; receiptKey: string; paymentMethod: string }) => {
  const res = await apiClient.post('/subscription/submit', variables);
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
    },
    onError: (err) => {
      Alert.alert('خطأ', getErrorMessage(err));
    },
  });
};
