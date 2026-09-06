import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { getErrorMessage } from '../utils/errorMessages';
import { Alert } from 'react-native';

export const submitReview = async (variables: { jobId: string; revieweeId: string; rating: number; comment?: string }) => {
  const res = await apiClient.post('/reviews', variables);
  return res.data;
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitReview,
    onSuccess: () => {
      // Optional: invalidate queries if we display reviews on profiles
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      Alert.alert('خطأ', getErrorMessage(err));
    },
  });
};
