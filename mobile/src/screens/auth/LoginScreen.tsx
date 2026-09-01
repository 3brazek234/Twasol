import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLogin } from '../../hooks/useAuth';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at lexast 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginScreen = ({ navigation }: any) => {
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate: login, isPending, error } = useLogin();

  const onSubmit = (data: LoginFormData) => {
    login([data.email, data.password]);
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#F9FAFB', '#E2E8F0']}
        className="absolute inset-0"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: -20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            className="items-center mb-8"
          >
            <View className="w-20 h-20 rounded-full bg-white justify-center items-center mb-4 shadow-md">
              <ShieldCheck size={48} color="#2A8F85" />
            </View>
            <MotiText
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 300 }}
              className="text-4xl font-displayBold text-ink tracking-tight"
            >
               تواصل
            </MotiText>
            <MotiText
              from={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 500 }}
              className="text-sm font-body text-ink uppercase tracking-widest mt-1"
            >
شبكة تفويض المحاكم
            </MotiText>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 200 }}
            className="p-6 rounded-2xl bg-white shadow-xl"
          >
            <Text className="text-2xl font-displayBold text-ink mb-6">
              تسجيل الدخول
            </Text>
            
            {error && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-docket/10 p-4 rounded-xl mb-4 border-l-4 border-docket"
              >
                <Text className="text-docket font-bodyMedium text-sm">
                  البريد الإلكتروني أو كلمة المرور غير صحيحة
                </Text>
              </MotiView>
            )}

            <View className="mb-4">
              <Text className="text-[10px] font-bodySemibold text-ink mb-2 uppercase tracking-widest">
                البريد الإلكتروني
              </Text>
              <View className={`flex-row items-center bg-paper rounded-xl px-4 h-14 border ${errors.email ? 'border-docket bg-docket/5' : 'border-transparent'}`}>
                <Mail color="#718096" size={18} className="mr-3" />
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="flex-1 text-ink font-body text-base h-full"
                      placeholder="البريد الإلكتروني"
                      placeholderTextColor="#718096"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.email && <Text className="text-docket text-xs font-body mt-1">{errors.email.message}</Text>}
            </View>

            <View className="mb-6">
              <View className={`flex-row items-center bg-paper rounded-xl px-4 h-14 border ${errors.password ? 'border-docket bg-docket/5' : 'border-transparent'}`}>
                <Lock color="#718096" size={18} className="mr-3" />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="flex-1 text-ink font-body text-base h-full"
                      placeholder="كلمة المرور"
                      placeholderTextColor="#718096"
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.password && <Text className="text-docket text-xs font-body mt-1">{errors.password.message}</Text>}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
              className="h-14 rounded-xl bg-signal flex-row justify-center items-center shadow-md shadow-signal/20"
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <ArrowRight color="#fff" size={20} className="ml-2" />
                  <Text className="text-white font-bodySemibold">
                    تسجيل الدخول
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-muted text-sm font-body">ليس لديك حساب؟</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text className="text-signal text-sm font-bodySemibold ml-1"> إنشاء حساب</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
