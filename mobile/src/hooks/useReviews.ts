import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { getErrorMessage } from '../utils/errorMessages';
import { Alert } from 'react-native';

interface CreateReviewInput {
  jobId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}

// ─── API function ─────────────────────────────────────────────────────────────
// Correct endpoint: POST /api/jobs/:jobId/reviews  (NOT /reviews)
const createReviewApi = async ({ jobId, rating, comment }: CreateReviewInput) => {
  const res = await apiClient.post(`/jobs/${jobId}/reviews`, { rating, comment });
  return res.data;
};

// ─── Canonical hook ───────────────────────────────────────────────────────────
export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReviewApi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'my-posted'] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'my-active'] });
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.revieweeId] });
    },
    onError: (err) => {
      console.error('[useCreateReview] Failed:', err);
      Alert.alert('خطأ', getErrorMessage(err));
    },
  });
};

// ─── Alias — keeps existing callers working ───────────────────────────────────
export const useSubmitReview = useCreateReview;

export const useUserReviews = (userId: string, page = 1) => {
  return useQuery({
    queryKey: ["reviews", userId, page],
    queryFn: async () => {
      const res = await apiClient.get(`/users/${userId}/reviews?page=${page}`);
      return res.data?.data;
    },
    enabled: !!userId,
  });
};
