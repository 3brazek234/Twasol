import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Award, ArrowLeft, Landmark, MapPin, ChevronLeft, X } from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import { useOnboardingState } from '../../screens/Onboarding/useOnboardingState';
import { useNavigation } from '@react-navigation/native';
import { useGovernorates } from '../../hooks/useCourts';
import { tokens } from '../../theme/tokens';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../api/client';

const registerSchema = z.object({
  email: z.string().email('عنوان البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  name: z.string().min(2, 'الاسم مطلوب'),
  barNumber: z.string().min(2, 'رقم العضوية مطلوب'),
  governorateId: z.string().min(1, 'يرجى اختيار مقر المكتب'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onboarding = useOnboardingState();
  const { data: governorates, isLoading: isLoadingGovs } = useGovernorates();
  const [govModalVisible, setGovModalVisible] = useState(false);

  const selectedGovId = watch('governorateId');
  const selectedGovName = governorates?.find((g: any) => g.id === selectedGovId)?.nameAr || 'اختر مقر المكتب';

  const [isRegistering, setIsRegistering] = useState(false);
  const { login: storeLogin } = useAuthStore();

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsRegistering(true);
      const registerRes = await apiClient.post('/auth/register', {
        email: data.email,
        password: data.password,
        name: data.name,
        fullName: data.name,
        barNumber: data.barNumber,
        governorateId: data.governorateId,
        preferredLocale: 'AR',
      });

      const { accessToken, refreshToken, user } = registerRes.data;
      await storeLogin(accessToken, refreshToken, user);
      onboarding.reset();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.';
      Alert.alert('خطأ في التسجيل', message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <View className="flex-1 bg-paper">
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
            className="items-center mb-8 mt-10"
          >
            <View className="w-16 h-16 rounded-full bg-white justify-center items-center mb-3 shadow-sm border border-line">
              <Landmark size={28} color="#1B2A4A" />
            </View>
            <MotiText
              from={{ opacity: 0, translateY: 5 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200 }}
              className="text-3xl font-displayBoldAr text-navy tracking-tight"
            >
              إنشاء حساب جديد
            </MotiText>
          </MotiView>

          <MotiView from={{ opacity: 0, translateY: 15 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 100 }} className="p-6 rounded-2xl bg-white shadow-lg border border-line/50">
            {/* Full Name */}
            <View className="mb-4">
              <Text className="text-xs font-bodySemiboldAr text-navy mb-2 text-right">الاسم الكامل</Text>
              <View className={`flex-row-reverse items-center bg-surface rounded-xl px-4 h-13 border ${errors.name ? 'border-crimson bg-crimsonBg/50' : 'border-transparent focus:border-gold'}`}>
                <User color="#6B7280" size={18} className="ml-3" />
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="flex-1 text-ink font-bodyAr text-base h-full text-right"
                      placeholder="أحمد سالم"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.name && <Text className="text-crimson text-xs font-bodyAr mt-1 text-right">{errors.name.message}</Text>}
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-xs font-bodySemiboldAr text-navy mb-2 text-right">البريد الإلكتروني</Text>
              <View className={`flex-row-reverse items-center bg-surface rounded-xl px-4 h-13 border ${errors.email ? 'border-crimson bg-crimsonBg/50' : 'border-transparent focus:border-gold'}`}>
                <Mail color="#6B7280" size={18} className="ml-3" />
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="flex-1 text-ink font-bodyAr text-base h-full text-right"
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
              {errors.email && <Text className="text-crimson text-xs font-bodyAr mt-1 text-right">{errors.email.message}</Text>}
            </View>

            {/* Bar Number & Governorate */}
            <View className="flex-row-reverse mb-4 gap-3">
              <View className="flex-1">
                <Text className="text-xs font-bodySemiboldAr text-navy mb-2 text-right">رقم العضوية</Text>
                <View className={`flex-row-reverse items-center bg-surface rounded-xl px-4 h-13 border ${errors.barNumber ? 'border-crimson bg-crimsonBg/50' : 'border-transparent focus:border-gold'}`}>
                  <Award color="#6B7280" size={18} className="ml-3" />
                  <Controller
                    control={control}
                    name="barNumber"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        className="flex-1 text-ink font-bodyAr text-sm h-full text-right"
                        placeholder="١٢٣٤٥٦"
                        placeholderTextColor="#9CA3AF"
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                </View>
                {errors.barNumber && <Text className="text-crimson text-xs font-bodyAr mt-1 text-right">{errors.barNumber.message}</Text>}
              </View>

              <View className="flex-1">
                <Text className="text-xs font-bodySemiboldAr text-navy mb-2 text-right">مقر المكتب</Text>
                <TouchableOpacity 
                  onPress={() => setGovModalVisible(true)}
                  className={`flex-row-reverse items-center bg-surface rounded-xl px-4 h-13 border ${errors.governorateId ? 'border-crimson bg-crimsonBg/50' : 'border-transparent focus:border-gold'}`}
                >
                  <MapPin color="#6B7280" size={18} className="ml-3" />
                  <Text className="flex-1 text-ink font-bodyAr text-sm text-right" numberOfLines={1}>
                    {selectedGovName}
                  </Text>
                </TouchableOpacity>
                {errors.governorateId && <Text className="text-crimson text-xs font-bodyAr mt-1 text-right">{errors.governorateId.message}</Text>}
              </View>
            </View>

            {/* Password */}
            <View className="mb-8">
              <Text className="text-xs font-bodySemiboldAr text-navy mb-2 text-right">كلمة المرور</Text>
              <View className={`flex-row-reverse items-center bg-surface rounded-xl px-4 h-13 border ${errors.password ? 'border-crimson bg-crimsonBg/50' : 'border-transparent focus:border-gold'}`}>
                <Lock color="#6B7280" size={18} className="ml-3" />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="flex-1 text-ink font-bodyAr text-sm h-full text-right"
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.password && <Text className="text-crimson text-xs font-bodyAr mt-1 text-right">{errors.password.message}</Text>}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit(onSubmit)}
              disabled={isRegistering}
              className="h-14 rounded-xl bg-navy flex-row justify-center items-center shadow-md"
            >
              {isRegistering ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text className="text-white text-lg font-bodySemiboldAr mr-2">تسجيل</Text>
                  <ArrowLeft color="#FFFFFF" size={20} />
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center mt-6">
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text className="text-gold text-sm font-bodySemiboldAr">تسجيل الدخول</Text>
              </TouchableOpacity>
              <Text className="text-muted text-sm font-bodyAr ml-1">لديك حساب بالفعل؟</Text>
            </View>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={govModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: tokens.colors.paper }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: tokens.spacing.md, borderBottomWidth: 1, borderBottomColor: tokens.colors.line }}>
            <TouchableOpacity onPress={() => setGovModalVisible(false)} style={{ padding: tokens.spacing.xs }}>
              <X size={24} color={tokens.colors.ink} />
            </TouchableOpacity>
            <Text style={{ fontFamily: tokens.typography.fonts.displayBold, fontSize: tokens.typography.sizes.lg, color: tokens.colors.navy }}>مقر المكتب</Text>
            <View style={{ width: 40 }} />
          </View>
          
          {isLoadingGovs ? (
            <ActivityIndicator style={{ marginTop: tokens.spacing.xl }} color={tokens.colors.navy} />
          ) : (
            <FlatList
              data={governorates}
              keyExtractor={(g: any) => g.id}
              contentContainerStyle={{ padding: tokens.spacing.md }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: tokens.spacing.md, borderBottomWidth: 1, borderBottomColor: tokens.colors.line }}
                  onPress={() => {
                    setValue('governorateId', item.id, { shouldValidate: true });
                    setGovModalVisible(false);
                  }}
                >
                  <Text style={{ fontFamily: tokens.typography.fonts.bodySemibold, fontSize: tokens.typography.sizes.base, color: tokens.colors.ink }}>{item.nameAr}</Text>
                  <ChevronLeft size={20} color={tokens.colors.muted} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};
