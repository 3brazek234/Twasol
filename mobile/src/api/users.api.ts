import { apiClient } from './client';

export const usersApi = {
  updateProfile: async (data: { name?: string; email?: string; barNumber?: string }): Promise<void> => {
    await apiClient.patch('/users/me', data);
  },
  updateAccountMode: async (mode: 'GIG' | 'HIRING' | 'BOTH'): Promise<void> => {
    await apiClient.patch('/users/me/account-mode', { mode });
  },
  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/users/me');
  }
};
