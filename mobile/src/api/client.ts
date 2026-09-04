import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use environment variable for physical device testing on Wi-Fi, fallback to localhost/10.0.2.2 for simulators
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:4001/api' : 'http://localhost:4001/api');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 second timeout to prevent infinite loading
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject the access token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor to handle 401 and refresh tokens
apiClient.interceptors.response.use(
  (response) => {
    // Automatically unwrap nested { success, data } from backend
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      if ('meta' in response.data) {
        // Preserve meta object for paginated responses
        response.data = { data: response.data.data, meta: response.data.meta };
      } else {
        response.data = response.data.data;
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If we receive a 401 and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');
        
        // Attempt to refresh
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newAccessToken = res.data.accessToken;
        
        // Save the new token
        await SecureStore.setItemAsync('accessToken', newAccessToken);
        if (res.data.refreshToken) {
          await SecureStore.setItemAsync('refreshToken', res.data.refreshToken);
        }
        
        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        // Refresh failed (e.g. refresh token expired), clear session
        const { useAuthStore } = require('../stores/authStore');
        await useAuthStore.getState().logout();
        
        // Handle refresh error
        const backendErrorMessage = refreshError.response?.data?.message || refreshError.response?.data?.error || 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
        return Promise.reject(new Error(backendErrorMessage));
      }
    }
    
    // Extract actual backend error message if available
    let errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.';
    if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx
      const data = error.response.data;
      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = typeof data.error === 'string' ? data.error : (data.error.message || 'حدث خطأ');
        } else if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
           // Handle Zod validation arrays
           errorMessage = data.errors.map((e: any) => e.message || e).join('\n');
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'لا يمكن الاتصال بالخادم. تأكد من اتصالك بالإنترنت.';
    } else {
      // Something happened in setting up the request
      errorMessage = error.message;
    }

    return Promise.reject(new Error(errorMessage));
  }
);
export default apiClient;
