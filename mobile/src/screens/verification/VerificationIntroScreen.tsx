import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { ShieldCheck, FileText, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useAuthStore } from '../../stores/authStore';

export const VerificationIntroScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();

  const steps = [
    {
      icon: <FileText size={24} color="#2A8F85" />,
      title: 'التحقق من الهوية',
      desc: 'مطلوب هوية حكومية سارية أو جواز سفر لجميع المستشارين.',
    },
    {
      icon: <ShieldCheck size={24} color="#2A8F85" />,
      title: 'حالة نقابة المحامين',
      desc: 'نتحقق من تسجيلك النشط في نقابة المحامين.',
    },
    {
      icon: <CheckCircle2 size={24} color="#2A8F85" />,
      title: 'شبكة موثوقة',
      desc: 'الحفاظ على معايير عالية للتمثيل والسلوك المهني.',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <ScrollView contentContainerStyle={{ padding: 32, paddingBottom: 120 }}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="items-center mb-12"
        >
          <View className="w-20 h-20 rounded-full bg-signal justify-center items-center mb-4 shadow-md">
            <ShieldCheck size={48} color="#FFFFFF" />
          </View>
          <Text className="text-3xl font-displayBold text-ink text-center mb-2">التحقق من الهوية مطلوب</Text>
          <Text className="text-base font-body text-muted text-center leading-6 mb-4">
            لحماية مجتمعنا القانوني، يجب التحقق من هويتك قبل البدء في استخدام وكيل.
          </Text>
          {user && (
            <View className="bg-white px-4 py-2 rounded-lg border border-line">
              <Text className="text-sm font-bodySemibold text-ink text-center">{user.name}</Text>
              <Text className="text-xs font-body text-muted text-center">{user.email}</Text>
            </View>
          )}
        </MotiView>

        <View className="gap-8">
          {steps.map((step, index) => (
            <MotiView
              key={index}
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: 200 + index * 100 }}
              className="flex-row-reverse items-start"
            >
              <View className="w-12 h-12 rounded-xl bg-white justify-center items-center ml-6 shadow-sm border border-line">
                {step.icon}
              </View>
              <View className="flex-1 items-end">
                <Text className="text-base font-bodySemibold text-ink mb-1">{step.title}</Text>
                <Text className="text-sm font-body text-muted leading-5 ">{step.desc}</Text>
              </View>
            </MotiView>
          ))}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-8 bg-paper border-t border-line">
        <TouchableOpacity
          className="h-14 bg-signal rounded-xl flex-row justify-center items-center gap-2 shadow-md"
          onPress={() => navigation.navigate('DocumentUpload')}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-bodySemibold">ابدأ التحقق</Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
