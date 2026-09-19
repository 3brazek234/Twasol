import { apiClient } from './client';

export interface SavedSearch {
  id: string;
  name: string;
  criteria: Record<string, any>;
  createdAt: string;
}

export const fetchSavedSearches = async (): Promise<SavedSearch[]> => {
  const { data } = await apiClient.get('/saved-searches');
  return data.data;
};

export const createSavedSearch = async (name: string, criteria: Record<string, any>): Promise<SavedSearch> => {
  const { data } = await apiClient.post('/saved-searches', { name, criteria });
  return data.data;
};

export const deleteSavedSearch = async (id: string): Promise<void> => {
  await apiClient.delete(`/saved-searches/${id}`);
};
