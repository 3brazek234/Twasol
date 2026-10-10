import { Alert } from "react-native";
import { getErrorMessage } from "../utils/errorMessages";

import { useMutation } from '@tanstack/react-query';
import { login, register, googleSignIn } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';

export const useLogin = () => {
  const { login: storeLogin } = useAuthStore();
  return useMutation({
    mutationFn: (variables: Parameters<typeof login>) => login(...variables),
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
    onSuccess: (data) => {    
      storeLogin(data.accessToken, data.refreshToken, data.user);
    },
  });
};

export const useRegister = () => {
  const { login: storeLogin } = useAuthStore();
  return useMutation({
    mutationFn: (variables: Parameters<typeof register>) => register(...variables),
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
    onSuccess: (data) => {
      storeLogin(data.accessToken, data.refreshToken, data.user);
    },
  });
};

export const useGoogleSignIn = () => {
  const { login: storeLogin } = useAuthStore();
  return useMutation({
    mutationFn: (idToken: string) => googleSignIn(idToken),
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
    onSuccess: (data) => {
      storeLogin(data.accessToken, data.refreshToken, data.user);
    },
  });
};

import { requestPasswordReset, verifyOtp, resetPassword } from '../api/auth.api';

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: (data: { email: string; otp: string }) => verifyOtp(data.email, data.otp),
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data: { resetToken: string; newPassword: string }) => resetPassword(data.resetToken, data.newPassword),
    onError: (err: any) => { Alert.alert('خطأ', getErrorMessage(err)); },
  });
};
