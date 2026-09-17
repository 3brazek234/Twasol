import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

export const LegalScreen = ({ route }: any) => {
  const { type } = route.params;

  const content = type === 'terms' 
    ? `شروط الخدمة

1. قبول الشروط
باستخدامك لتطبيقنا، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، فلا يحق لك استخدام التطبيق.

2. استخدام التطبيق
- يجب أن تكون معلوماتك دقيقة ومحدثة.
- يمنع استخدام التطبيق لأي أغراض غير قانونية.
- نحتفظ بالحق في إنهاء أو تعليق حسابك في حال انتهاك الشروط.

3. المسؤولية
تطبيقنا هو منصة للربط بين العملاء والمحامين. نحن لسنا طرفاً في أي اتفاق يتم بين المستخدمين ولا نتحمل مسؤولية جودة الخدمات المقدمة.

4. التعديلات
نحتفظ بالحق في تعديل هذه الشروط في أي وقت. استمرارك في استخدام التطبيق يعتبر قبولاً للشروط المعدلة.`
    : `سياسة الخصوصية

1. جمع البيانات
نحن نجمع المعلومات التي تقدمها لنا مباشرة عند إنشاء حساب، مثل الاسم، البريد الإلكتروني، ورقم الهاتف. كما نجمع بيانات الاستخدام لتحسين خدماتنا.

2. استخدام البيانات
نستخدم بياناتك من أجل:
- تقديم وتحسين خدماتنا.
- تخصيص تجربتك في التطبيق.
- التواصل معك بخصوص حسابك أو الخدمات الجديدة.

3. حماية البيانات
نحن نتخذ إجراءات أمنية لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الإفشاء. لا نقوم ببيع أو تأجير معلوماتك الشخصية لأطراف ثالثة.

4. حقوقك
يحق لك طلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها. يمكنك القيام بذلك عبر إعدادات التطبيق أو التواصل مع الدعم الفني.`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.text}>{content}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
  },
  text: {
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.body,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'right',
  },
});
