import { apiClient } from './client';
import { AuthResponse } from '../schemas/auth.schema';

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
};

export const register = async (
  email: string, 
  password: string, 
  name: string, 
  barNumber: string,
  governorateId?: string
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/register', { 
    email, 
    password, 
    name, 
    barNumber,
    governorateId
  });
  return response.data;
};
