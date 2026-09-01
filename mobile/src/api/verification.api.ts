import { apiClient } from './client';

export const verificationApi = {
  getStatus: async () => {
    const res = await apiClient.get('/verification/status');
    return res.data.data;
  },
};
