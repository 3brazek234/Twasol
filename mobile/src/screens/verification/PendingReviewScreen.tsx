import React, { useEffect } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { Clock, CheckCircle2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import { TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { verificationApi } from '../../api/verification.api';

export const PendingReviewScreen = ({ navigation }: any) => {
  const { submitVerification, logout } = useAuthStore();

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const data = await verificationApi.getStatus();
        if (data.verificationStatus === 'APPROVED' || data.verificationStatus === 'REJECTED') {
          await submitVerification(data.verificationStatus);
        }
      } catch (err) {
        console.error('Failed to poll verification status', err);
      }
    };

    const interval = setInterval(pollStatus, 30000); // 30s
    pollStatus(); // Initial check

    return () => clearInterval(interval);
  }, [submitVerification]);

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="flex-1 p-8 justify-center items-center">
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
          className="w-24 h-24 rounded-full bg-docket justify-center items-center mb-12 shadow-md"
        >
          <Clock size={48} color="#FFFFFF" />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 300 }}
          className="items-center mb-12"
        >
          <Text className="text-2xl font-displayBold text-ink mb-4 text-center">جارٍ مراجعة مستنداتك</Text>
          <Text className="text-base font-body text-muted text-center leading-6 px-6">
            تم رفع مستنداتك بنجاح. سيتم مراجعتها خلال ٢٤–٤٨ ساعة. سنخطرك عند الموافقة.
          </Text>
        </MotiView>

        <View className="w-full bg-white rounded-2xl p-8 border border-line gap-6">
          <View className="flex-row-reverse items-center gap-4">
            <CheckCircle2 size={20} color="#38A169" />
            <Text className="text-sm font-bodyMedium text-ink ">تم رفع مستند الهوية</Text>
          </View>
          <View className="flex-row-reverse items-center gap-4">
            <Clock size={20} color="#E08A4F" />
            <Text className="text-sm font-bodyMedium text-ink ">بانتظار فحص نقابة المحامين</Text>
          </View>
        </View>

        <View className="flex-row gap-4 mt-8">
          <TouchableOpacity 
            className="flex-1 px-6 py-3 rounded-xl bg-signal justify-center items-center" 
            onPress={() => (navigation as any)?.goBack()}
          >
            <Text className="text-white font-bodySemibold">العودة للرئيسية</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="px-6 py-3 rounded-xl bg-line/50 justify-center items-center" 
            onPress={() => logout()}
          >
            <Text className="text-ink font-bodyMedium">تسجيل الخروج</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};
