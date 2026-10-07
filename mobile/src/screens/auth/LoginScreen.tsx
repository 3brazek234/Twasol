import React, { useEffect, useState } from 'react';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLogin, useGoogleSignIn } from '../../hooks/useAuth';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { Mail, Lock, ArrowLeft, Landmark } from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import { tokens } from '../../theme/tokens';

const loginSchema = z.object({
  email: z.string().email('عنوان البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginScreen = ({ navigation }: any) => {
  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate: login, isPending, error } = useLogin();
  const { mutate: googleSignIn, isPending: isGooglePending } = useGoogleSignIn();
  const { request, response, promptAsync } = useGoogleAuth();

  // Handle Google sign-in response
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) {
        googleSignIn(idToken);
      } else {
        Alert.alert('خطأ', 'لم يتم استلام رمز التحقق من Google. يرجى المحاولة مرة أخرى.');
      }
    }
  }, [response]);

  const onSubmit = (data: LoginFormData) => {
    login([data.email, data.password]);
  };

  const isAnyPending = isPending || isGooglePending;

  return (
    <ScreenContainer scroll={false} paddingHorizontal={0}>
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
            from={{ opacity: 0, scale: 0.95, translateY: -10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            className="items-center mb-10"
          >
            <View className="w-20 h-20 rounded-full bg-white justify-center items-center mb-4 shadow-sm border border-line">
              <Landmark size={36} color={tokens.colors.navy} />
            </View>
            <MotiText
              from={{ opacity: 0, translateY: 5 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200 }}
              className="text-4xl font-displayBoldAr text-navy tracking-tight"
            >
              وكيل
            </MotiText>
            <MotiText
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 350 }}
              className="text-sm font-bodyAr text-muted mt-2"
            >
              الشبكة المهنية الأولى للمحامين
            </MotiText>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 100 }}
            className="p-6 rounded-2xl bg-white shadow-lg border border-line/50"
          >
            <Text className="text-2xl font-displayBoldAr text-navy mb-6 text-center">
              تسجيل الدخول
            </Text>
            
            {error && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-crimsonBg p-4 rounded-xl mb-4 border-r-4 border-crimson"
              >
                <Text className="text-crimson font-bodyMediumAr text-sm ">
                  البريد الإلكتروني أو كلمة المرور غير صحيحة
                </Text>
              </MotiView>
            )}

            <View className="mb-4">
              <Text className="text-xs font-bodySemiboldAr text-navy mb-2 ">
                البريد الإلكتروني
              </Text>
              <View className={`flex-row-reverse items-center bg-surface rounded-xl px-4 h-14 border ${errors.email ? 'border-crimson bg-crimsonBg/50' : 'border-transparent focus:border-gold'}`}>
                <Mail color="#6B7280" size={18} className="ml-3" />
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="flex-1 text-ink font-bodyAr text-base h-full "
                      placeholder="name@example.com"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.email && <Text className="text-crimson text-xs font-bodyAr mt-1 ">{errors.email.message}</Text>}
            </View>

            <View className="mb-8">
              <Text className="text-xs font-bodySemiboldAr text-navy mb-2 ">
                كلمة المرور
              </Text>
              <View className={`flex-row-reverse items-center bg-surface rounded-xl px-4 h-14 border ${errors.password ? 'border-crimson bg-crimsonBg/50' : 'border-transparent focus:border-gold'}`}>
                <Lock color="#6B7280" size={18} className="ml-3" />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="flex-1 text-ink font-bodyAr text-base h-full "
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.password && <Text className="text-crimson text-xs font-bodyAr mt-1 ">{errors.password.message}</Text>}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit(onSubmit)}
              disabled={isAnyPending}
              className="h-14 rounded-xl bg-navy flex-row justify-center items-center shadow-md"
            >
              {isPending ? (
                <ActivityIndicator color={tokens.colors.white} />
              ) : (
                <>
                  <Text className="text-white font-bodySemiboldAr text-lg mr-2">
                    دخول
                  </Text>
                  <ArrowLeft color={tokens.colors.white} size={20} />
                </>
              )}
            </TouchableOpacity>

            {/* ── Separator ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: tokens.colors.line }} />
              <Text style={{
                marginHorizontal: 12,
                color: tokens.colors.muted,
                fontFamily: tokens.typography.fonts.body,
                fontSize: 13,
              }}>
                أو
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: tokens.colors.line }} />
            </View>

            {/* ── Google Sign-In Button (official branding) ── */}
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={!request || isAnyPending}
              onPress={() => promptAsync()}
              style={{
                height: 52,
                borderRadius: 12,
                backgroundColor: tokens.colors.white,
                flexDirection: 'row-reverse',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#DADCE0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
                opacity: (!request || isAnyPending) ? 0.5 : 1,
              }}
            >
              {isGooglePending ? (
                <ActivityIndicator color="#4285F4" />
              ) : (
                <>
                  {/* Google "G" logo — inline SVG-style text fallback */}
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginLeft: 10,
                  }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#4285F4' }}>G</Text>
                  </View>
                  <Text style={{
                    color: '#3C4043',
                    fontFamily: tokens.typography.fonts.bodySemibold,
                    fontSize: 15,
                  }}>
                    تسجيل الدخول بواسطة Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center mt-6">
               <Text className="text-muted text-sm font-bodyAr ml-1">ليس لديك حساب؟</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text className="text-gold font-bodySemiboldAr text-sm"> إنشاء حساب جديد</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};
