import React, { useState } from 'react';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Award, MapPin, ArrowLeft, Landmark, ChevronLeft, X } from 'lucide-react-native';
import { MotiView, MotiText } from 'moti';
import { useGovernorates } from '../../hooks/useCourts';
import { useAuthStore } from '../../stores/authStore';
import { completeProfile } from '../../api/auth.api';
import { tokens } from '../../theme/tokens';

const completeProfileSchema = z.object({
  barNumber: z.string().min(2, 'رقم العضوية مطلوب'),
  governorateId: z.string().min(1, 'يرجى اختيار مقر المكتب'),
});

type CompleteProfileFormData = z.infer<typeof completeProfileSchema>;

export const CompleteProfileScreen = () => {
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
  });

  const { data: governorates, isLoading: isLoadingGovs } = useGovernorates();
  const [govModalVisible, setGovModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUser, user } = useAuthStore();

  const selectedGovId = watch('governorateId');
  const selectedGovName = governorates?.find((g: any) => g.id === selectedGovId)?.nameAr || 'اختر مقر المكتب';

  const onSubmit = async (data: CompleteProfileFormData) => {
    try {
      setIsSubmitting(true);
      const result = await completeProfile(data.barNumber, data.governorateId);
      // Update user in auth store so RootNavigator re-renders
      if (result.user) {
        setUser(result.user);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'حدث خطأ. يرجى المحاولة مرة أخرى.';
      Alert.alert('خطأ', message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            className="items-center mb-8"
          >
            <View className="w-16 h-16 rounded-full bg-white justify-center items-center mb-3 shadow-sm border border-line">
              <Landmark size={28} color={tokens.colors.navy} />
            </View>
            <MotiText
              from={{ opacity: 0, translateY: 5 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200 }}
              className="text-3xl font-displayBoldAr text-navy tracking-tight"
            >
              أكمل بيانات حسابك
            </MotiText>
            <MotiText
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 350 }}
              className="text-sm font-bodyAr text-muted mt-2 text-center px-4"
            >
              أهلاً {user?.fullName || user?.name || ''}، نحتاج بعض المعلومات الإضافية لإكمال حسابك كمحامي على وكيل
            </MotiText>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 100 }}
            className="p-6 rounded-2xl bg-white shadow-lg border border-line/50"
          >
            {/* Bar Number */}
            <View className="mb-4">
              <Text className="text-xs font-bodySemiboldAr text-navy mb-2 ">رقم العضوية</Text>
              <View className={`flex-row-reverse items-center bg-surface rounded-xl px-4 h-14 border ${errors.barNumber ? 'border-crimson bg-crimsonBg/50' : 'border-transparent'}`}>
                <Award color="#6B7280" size={18} className="ml-3" />
                <Controller
                  control={control}
                  name="barNumber"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="flex-1 text-ink font-bodyAr text-base h-full "
                      placeholder="١٢٣٤٥٦"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.barNumber && <Text className="text-crimson text-xs font-bodyAr mt-1 ">{errors.barNumber.message}</Text>}
            </View>

            {/* Governorate */}
            <View className="mb-8">
              <Text className="text-xs font-bodySemiboldAr text-navy mb-2 ">مقر المكتب</Text>
              <TouchableOpacity
                onPress={() => setGovModalVisible(true)}
                className={`flex-row-reverse items-center bg-surface rounded-xl px-4 h-14 border ${errors.governorateId ? 'border-crimson bg-crimsonBg/50' : 'border-transparent'}`}
              >
                <MapPin color="#6B7280" size={18} className="ml-3" />
                <Text className="flex-1 text-ink font-bodyAr text-base " numberOfLines={1}>
                  {selectedGovName}
                </Text>
              </TouchableOpacity>
              {errors.governorateId && <Text className="text-crimson text-xs font-bodyAr mt-1 ">{errors.governorateId.message}</Text>}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="h-14 rounded-xl bg-navy flex-row justify-center items-center shadow-md"
            >
              {isSubmitting ? (
                <ActivityIndicator color={tokens.colors.white} />
              ) : (
                <>
                  <Text className="text-white text-lg font-bodySemiboldAr mr-2">إكمال الملف الشخصي</Text>
                  <ArrowLeft color={tokens.colors.white} size={20} />
                </>
              )}
            </TouchableOpacity>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Governorate Picker Modal */}
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
    </ScreenContainer>
  );
};
