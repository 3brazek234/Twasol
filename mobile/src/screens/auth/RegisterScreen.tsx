import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User, Award, ArrowRight, ShieldCheck, MapPin, ChevronRight, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboardingState } from '../../screens/Onboarding/useOnboardingState';
import { useNavigation } from '@react-navigation/native';
import { useGovernorates } from '../../hooks/useCourts';
import { tokens } from '../../theme/tokens';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../api/client';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name is required'),
  barNumber: z.string().min(2, 'Bar number is required'),
  governorateId: z.string().min(1, 'Office location is required'),
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
  const selectedGovName = governorates?.find(g => g.id === selectedGovId)?.nameAr || 'اختر مقر المكتب';

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
        'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <View className="flex-1">
      <LinearGradient colors={['#F9FAFB', '#E2E8F0']} className="absolute inset-0" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <MotiView from={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} className="items-center mb-6 mt-10">
            <View className="w-16 h-16 rounded-full bg-white justify-center items-center mb-2 shadow-md">
              <ShieldCheck size={40} color="#2A8F85" />
            </View>
            <Text className="text-3xl font-displayBold text-ink tracking-tight">تواصل</Text>
            <Text className="text-[10px] font-body text-ink uppercase tracking-[1.5px]">شبكة تفويض المحاكم</Text>
          </MotiView>

          <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 100 }} className="p-6 rounded-2xl bg-white shadow-xl">
            <Text className="text-2xl font-displayBold text-ink mb-6 text-center">إنشاء حساب</Text>

            {/* Full Name */}
            <View className="mb-4">
              <View className={`flex-row items-center bg-paper rounded-xl px-4 h-13 border ${errors.name ? 'border-docket bg-docket/5' : 'border-transparent'}`}>
                <User color="#718096" size={18} className="mr-3" />
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="flex-1 text-ink font-body text-base h-full"
                      placeholder="الاسم الكامل"
                      placeholderTextColor="#718096"
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.name && <Text className="text-docket text-[10px] font-body mt-1">{errors.name.message}</Text>}
            </View>

            {/* Email */}
            <View className="mb-4">
              <View className={`flex-row items-center bg-paper rounded-xl px-4 h-13 border ${errors.email ? 'border-docket bg-docket/5' : 'border-transparent'}`}>
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
              {errors.email && <Text className="text-docket text-[10px] font-body mt-1">{errors.email.message}</Text>}
            </View>

            {/* Bar Number & Governorate */}
            <View className="flex-row mb-4 gap-3">
              <View className="flex-1">
                <View className={`flex-row items-center bg-paper rounded-xl px-4 h-13 border ${errors.barNumber ? 'border-docket bg-docket/5' : 'border-transparent'}`}>
                  <Award color="#718096" size={18} className="mr-3" />
                  <Controller
                    control={control}
                    name="barNumber"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        className="flex-1 text-ink font-body text-sm h-full"
                        placeholder="رقم العضوية"
                        placeholderTextColor="#718096"
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                </View>
                {errors.barNumber && <Text className="text-docket text-[10px] font-body mt-1">{errors.barNumber.message}</Text>}
              </View>

              <View className="flex-1">
                <TouchableOpacity 
                  onPress={() => setGovModalVisible(true)}
                  className={`flex-row items-center bg-paper rounded-xl px-4 h-14 border ${errors.governorateId ? 'border-docket bg-docket/5' : 'border-transparent'}`}
                >
                  <MapPin color="#718096" size={18} className="mr-3" />
                  <Text className="flex-1 text-ink font-body text-sm" numberOfLines={1}>
                    {selectedGovName}
                  </Text>
                </TouchableOpacity>
                {errors.governorateId && <Text className="text-docket text-[10px] font-body mt-1">{errors.governorateId.message}</Text>}
              </View>
            </View>

            {/* Password */}
            <View className="mb-6">
              <View className={`flex-row items-center bg-paper rounded-xl px-4 h-13 border ${errors.password ? 'border-docket bg-docket/5' : 'border-transparent'}`}>
                <Lock color="#718096" size={18} className="mr-3" />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="flex-1 text-ink font-body text-sm h-full"
                      placeholder="كلمة المرور"
                      placeholderTextColor="#718096"                    
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.password && <Text className="text-docket text-[10px] font-body mt-1">{errors.password.message}</Text>}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit(onSubmit)}
              className="h-14 rounded-xl bg-signal flex-row justify-center items-center shadow-md shadow-signal/20"
            >
              <Text className="text-white text-lg font-body font-bold">{'تسجيل'}</Text>
              <ArrowRight color="#fff" size={20} className="ml-2" />
            </TouchableOpacity>

            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-muted text-sm font-body">{'لديك حساب بالفعل؟ سجل دخولك'}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text className="text-signal text-sm font-bodySemibold ml-1">تسجيل الدخول</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={govModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: tokens.colors.paper }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: tokens.spacing.md, borderBottomWidth: 1, borderBottomColor: tokens.colors.line }}>
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
              keyExtractor={(g) => g.id}
              contentContainerStyle={{ padding: tokens.spacing.md }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: tokens.spacing.md, borderBottomWidth: 1, borderBottomColor: tokens.colors.line }}
                  onPress={() => {
                    setValue('governorateId', item.id, { shouldValidate: true });
                    setGovModalVisible(false);
                  }}
                >
                  <Text style={{ fontFamily: tokens.typography.fonts.bodySemibold, fontSize: tokens.typography.sizes.base, color: tokens.colors.ink }}>{item.nameAr}</Text>
                  <ChevronRight size={20} color={tokens.colors.muted} />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};
