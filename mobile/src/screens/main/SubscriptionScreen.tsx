import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { CreditCard, Upload, FileCheck, X, AlertCircle, CheckCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '../../stores/authStore';
import { useSubscriptionPlans, useGetReceiptUploadUrl, useSubmitSubscription, useSubscriptionStatus } from '../../hooks/useSubscription';
import { uploadFileToR2 } from '../../utils/upload';
import { tokens } from '../../theme/tokens';

export const SubscriptionScreen = () => {
  const { user, hydrate, refreshUserProfile } = useAuthStore();
  
  const { data: subscriptionData, isLoading: plansLoading, error } = useSubscriptionPlans();
  const { data: statusData, isLoading: statusLoading } = useSubscriptionStatus();
  const isLoading = plansLoading || statusLoading;
  const getUrl = useGetReceiptUploadUrl();
  const submit = useSubmitSubscription();

  const plans = subscriptionData?.plans || [];
  const instructions = subscriptionData?.paymentInstructions || null;
  
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'MANUAL_BANK_TRANSFER' | 'MANUAL_VODAFONE_CASH'>('MANUAL_VODAFONE_CASH');
  
  const [file, setFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans]);

  useEffect(() => {
    // Always fetch the freshest subscription state when this screen opens —
    // an admin may have just approved the payment while the app was running.
    refreshUserProfile();
  }, []);

  useEffect(() => {
    if (error) {
      Toast.show({ type: 'error', text1: 'خطأ', text2: 'تعذر جلب خطط الاشتراك' });
    }
  }, [error]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setFile(result.assets[0]);
    }
  };

  const proceedSubmit = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Get presigned URL
      const urlData = await getUrl.mutateAsync({
        contentType: file!.mimeType || 'image/jpeg',
      });

      // 2. Upload to R2
      await uploadFileToR2({
        localUri: file!.uri,
        presignedUrl: urlData.uploadUrl,
        contentType: file!.mimeType || 'image/jpeg',
        onProgress: (progress) => setUploadProgress(progress),
      });

      // 3. Submit Subscription
      await submit.mutateAsync({
        planId: selectedPlanId!,
        paymentMethod,
        receiptKey: urlData.fileKey,
      });

      Toast.show({
        type: 'success',
        text1: 'تم استلام طلبك',
        text2: 'جاري مراجعة الإيصال من الإدارة',
      });

      await hydrate();

    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'حدث خطأ', text2: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      Toast.show({ type: 'error', text1: 'مطلوب إيصال', text2: 'يرجى إرفاق صورة إيصال التحويل' });
      return;
    }



    if (user?.subscriptionStatus === 'ACTIVE') {
      const expires = user?.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString('ar-EG') : '';
      Alert.alert(
        'تجديد الاشتراك',
        `لديك اشتراك نشط بالفعل${expires ? ` ينتهي في ${expires}` : ''}. هل أنت متأكد أنك تريد تقديم طلب اشتراك جديد؟ سيتم إضافة المدة الجديدة إلى اشتراكك الحالي.`,
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'متابعة التجديد', onPress: proceedSubmit }
        ]
      );
      return;
    }

    proceedSubmit();
  };

  if (isLoading) {
    return <View className="flex-1 justify-center items-center bg-paper"><ActivityIndicator size="large" color="#1B2A4A" /></View>;
  }

  // Pure POSTER/HIRING accounts should never see this
  if (user?.accountMode === 'HIRING') {
    return (
      <SafeAreaView className="flex-1 bg-paper justify-center items-center p-6">
        <Text className="text-xl font-displayBold text-ink mb-2">غير مصرح</Text>
        <Text className="text-center font-body text-muted">أصحاب حسابات التوظيف غير مطالبين باشتراك.</Text>
      </SafeAreaView>
    );
  }

  const hasPendingPayment = !!statusData?.pendingPayment;
  const isSubscriptionActive = user?.subscriptionStatus === 'ACTIVE';

  if (isSubscriptionActive) {
    const expires = user?.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toLocaleDateString('ar-EG') : '';
    return (
      <SafeAreaView className="flex-1 bg-paper justify-center items-center p-6">
        <View className="w-16 h-16 rounded-full bg-green-100 justify-center items-center mb-4">
          <CheckCircle size={32} color="#38A169" />
        </View>
        <Text className="text-2xl font-displayBold text-ink mb-2">اشتراكك فعال</Text>
        <Text className="text-center font-body text-muted mb-4">أنت الآن تتمتع بكافة ميزات المحامي وتقرأ القضايا المتاحة بكل حرية.</Text>
        {expires ? (
          <View className="bg-white p-4 rounded-xl border border-line w-full shadow-sm">
            <Text className="text-center font-bodySemibold text-ink mb-1">تاريخ انتهاء الاشتراك</Text>
            <Text className="text-center font-displayBold text-signal text-xl">{expires}</Text>
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  if (hasPendingPayment) {
    return (
      <SafeAreaView className="flex-1 bg-paper justify-center items-center p-6">
        <View className="w-16 h-16 rounded-full bg-orange-100 justify-center items-center mb-4">
          <FileCheck size={32} color="#DD6B20" />
        </View>
        <Text className="text-2xl font-displayBold text-ink mb-2">طلب قيد المراجعة</Text>
        <Text className="text-center font-body text-muted">لقد قمت بإرسال إيصال الدفع مسبقاً وهو الآن قيد المراجعة من قبل الإدارة. يرجى الانتظار، سيتم إشعارك فور التفعيل.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-full bg-signal/10 justify-center items-center mb-4">
            <CreditCard size={32} color={tokens.colors.signal} />
          </View>
          <Text className="text-2xl font-displayBold text-ink text-center mb-2">تفعيل الاشتراك</Text>
          <Text className="text-base text-muted text-center font-body">
            حسابك موثق بنجاح. يرجى اختيار الباقة ورفع إيصال الدفع للبدء.
          </Text>
        </View>

        {/* Plans Selection */}
        <Text className="text-sm font-bodySemibold text-muted mb-3">اختر الباقة المناسبة</Text>
        <View className="flex-row flex-wrap gap-4 mb-8">
          {plans.map((plan: any) => (
            <TouchableOpacity
              key={plan.id}
              className={`flex-1 p-4 rounded-xl border-2 ${selectedPlanId === plan.id ? 'border-signal bg-signal/5' : 'border-line bg-white'}`}
              onPress={() => setSelectedPlanId(plan.id)}
            >
              <Text className="text-lg font-bodySemibold text-ink mb-1">{plan.nameAr}</Text>
              <Text className="text-xl font-displayBold text-signal">{(plan.amountPiasters / 100).toFixed(0)} ج.م</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Methods */}
        <Text className="text-sm font-bodySemibold text-muted mb-3">طريقة الدفع (تحويل يدوي)</Text>
        <View className="flex-row gap-4 mb-6">
          <TouchableOpacity 
            className={`px-4 py-2 rounded-full border ${paymentMethod === 'MANUAL_VODAFONE_CASH' ? 'border-signal bg-signal/10' : 'border-line'}`}
            onPress={() => setPaymentMethod('MANUAL_VODAFONE_CASH')}
          >
            <Text className={`font-bodySemibold ${paymentMethod === 'MANUAL_VODAFONE_CASH' ? 'text-signal' : 'text-muted'}`}>فودافون كاش</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`px-4 py-2 rounded-full border ${paymentMethod === 'MANUAL_BANK_TRANSFER' ? 'border-signal bg-signal/10' : 'border-line'}`}
            onPress={() => setPaymentMethod('MANUAL_BANK_TRANSFER')}
          >
            <Text className={`font-bodySemibold ${paymentMethod === 'MANUAL_BANK_TRANSFER' ? 'text-signal' : 'text-muted'}`}>تحويل بنكي</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View className="bg-white p-4 rounded-xl border border-line mb-8">
          {paymentMethod === 'MANUAL_VODAFONE_CASH' && (
            <>
              <Text className="font-body text-ink mb-2">يرجى تحويل المبلغ إلى الرقم التالي:</Text>
              <Text className="text-xl font-monoLarge text-signal text-center my-2 select-all">{instructions?.MANUAL_VODAFONE_CASH?.phoneNumber}</Text>
              <Text className="font-body text-muted text-center text-sm">باسم: {instructions?.MANUAL_VODAFONE_CASH?.accountName}</Text>
            </>
          )}
          {paymentMethod === 'MANUAL_BANK_TRANSFER' && (
            <>
              <Text className="font-body text-ink mb-2">يرجى التحويل إلى الحساب التالي ({instructions?.MANUAL_BANK_TRANSFER?.bankName}):</Text>
              <Text className="font-mono text-signal mt-2">رقم الحساب: {instructions?.MANUAL_BANK_TRANSFER?.accountNumber}</Text>
              <Text className="font-mono text-signal text-xs mt-1">IBAN: {instructions?.MANUAL_BANK_TRANSFER?.iban}</Text>
              <Text className="font-body text-muted text-sm mt-2">باسم: {instructions?.MANUAL_BANK_TRANSFER?.accountName}</Text>
            </>
          )}
        </View>

        {/* Upload Receipt */}
        <Text className="text-sm font-bodySemibold text-muted mb-3">إرفاق إيصال التحويل (سكرين شوت)</Text>
        <TouchableOpacity
          className={`h-40 border-2 rounded-2xl bg-white justify-center items-center mb-8 ${file ? 'border-signal bg-signal/5' : 'border-line border-dashed'}`}
          onPress={pickImage}
        >
          {!file ? (
            <View className="items-center">
              <Upload size={24} color={tokens.colors.signal} className="mb-2" />
              <Text className="font-body text-ink">اضغط لاختيار صورة الإيصال</Text>
            </View>
          ) : (
            <View className="items-center">
              <FileCheck size={28} color="#38A169" className="mb-2" />
              <Text className="font-body text-success">تم اختيار الملف بنجاح</Text>
              <Text className="font-body text-muted text-xs mt-1">اضغط للتغيير</Text>
            </View>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* Footer Action */}
      <View className="absolute bottom-0 w-full p-6 bg-paper border-t border-line">
        <TouchableOpacity
          className={`h-14 rounded-xl justify-center items-center ${!file || isUploading ? 'bg-line opacity-60' : 'bg-signal'}`}
          onPress={handleSubmit}
          disabled={!file || isUploading}
        >
          <Text className="text-white text-base font-bodySemibold">
            {isUploading ? `جاري الإرسال (${uploadProgress}%)...` : 'إرسال طلب التفعيل'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
