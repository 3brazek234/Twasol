import { apiClient } from './client';

export const usersApi = {
  updateProfile: async (data: { name?: string; email?: string; barNumber?: string }): Promise<void> => {
    await apiClient.patch('/users/me', data);
  }
};
