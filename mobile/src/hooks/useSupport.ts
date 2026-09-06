import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { getErrorMessage } from '../utils/errorMessages';
import { Alert } from 'react-native';

export const getOrCreateSupportConversation = async () => {
  try {
    const res = await apiClient.get('/support/conversations/mine');
    return res.data.id;
  } catch (err: any) {
    if (err.response?.status === 404) {
      const createRes = await apiClient.post('/support/conversations');
      return createRes.data.id;
    }
    throw err;
  }
};

export const useSupportConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getOrCreateSupportConversation,
    onError: (err) => {
      Alert.alert('خطأ', getErrorMessage(err));
    },
  });
};
