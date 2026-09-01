import { useMutation } from '@tanstack/react-query';
import { login, register } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';

export const useLogin = () => {
  const { login: storeLogin } = useAuthStore();
  return useMutation({
    mutationFn: (variables: Parameters<typeof login>) => login(...variables),
    onSuccess: (data) => {    
      storeLogin(data.accessToken, data.refreshToken, data.user);
    },
  });
};

export const useRegister = () => {
  const { login: storeLogin } = useAuthStore();
  return useMutation({
    mutationFn: (variables: Parameters<typeof register>) => register(...variables),
    onSuccess: (data) => {
      storeLogin(data.accessToken, data.refreshToken, data.user);
    },
  });
};
