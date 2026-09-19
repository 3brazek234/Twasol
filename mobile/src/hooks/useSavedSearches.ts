import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSavedSearches, createSavedSearch, deleteSavedSearch } from '../api/saved-searches.api';

export const useSavedSearches = () => {
  return useQuery({
    queryKey: ['savedSearches'],
    queryFn: fetchSavedSearches,
  });
};

export const useCreateSavedSearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, criteria }: { name: string; criteria: Record<string, any> }) =>
      createSavedSearch(name, criteria),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
    },
  });
};

export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedSearches'] });
    },
  });
};
