import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';

const steps = [
  {
    id: 1,
    title: "نشر المهمة",
    description: "يقوم المحامي الموكِّل بنشر تفاصيل المهمة، يحدد المحكمة المطلوبة، الموعد النهائي، والأجر المقترح.",
    icon: "document-text-outline",
    color: "#1B4F72"
  },
  {
    id: 2,
    title: "التقديم على المهمة",
    description: "يتصفح المحامون المسجلون في تلك المحكمة المهام المتاحة ويتقدمون بطلباتهم مع ملاحظة تغطية.",
    icon: "person-add-outline",
    color: "#2E86C1"
  },
  {
    id: 3,
    title: "قبول التوكيل",
    description: "يختار الموكِّل المحامي المناسب ويقبل طلبه. يتم إخطار المحامي فوراً وتبدأ قناة التواصل المباشر بينهما.",
    icon: "checkmark-circle-outline",
    color: "#198754"
  },
  {
    id: 4,
    title: "التنسيق والتنفيذ",
    description: "يتواصل الطرفان عبر المحادثة المباشرة لتبادل المستندات والتعليمات. يُحدِّث المحامي المُوكَّل حالة المهمة إلى جاري التنفيذ.",
    icon: "chatbubbles-outline",
    color: "#C0973B"
  },
  {
    id: 5,
    title: "الإتمام والتقييم",
    description: "يؤكد الموكِّل اكتمال المهمة. يُقرّ المحامي المُوكَّل باستلام الأجر المتفق عليه. يقيّم كلا الطرفين تجربته لبناء سمعة موثوقة.",
    icon: "star-outline",
    color: "#C0973B"
  }
];

export const HowItWorks = ({ isVisible }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>كيف تعمل المنصة؟</Text>
        <Text style={styles.subtitle}>من نشر المهمة إلى اكتمالها في ٥ خطوات</Text>
      </View>

      <View style={styles.timeline}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          
          return (
            <View key={step.id} style={styles.stepRow}>
              {/* Left Column (Timeline) */}
              <View style={styles.timelineColumn}>
                <LinearGradient
                  colors={['#1B4F72', '#C0973B']}
                  style={styles.stepCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.stepNumber}>{step.id.toLocaleString('ar-EG')}</Text>
                </LinearGradient>
                {!isLast && <View style={styles.connector} />}
              </View>

              {/* Right Column (Content) */}
              <View style={styles.contentColumn}>
                {isVisible && (
                  <Animated.View 
                    entering={FadeInRight.delay(index * 200).springify()}
                    style={[styles.card, { borderLeftColor: step.color }]}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: `${step.color}1A` }]}>
                      <Ionicons name={step.icon} size={20} color={step.color} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{step.title}</Text>
                      <Text style={styles.cardDesc}>{step.description}</Text>
                    </View>
                  </Animated.View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Cairo_700Bold',
    color: '#1B4F72',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#6C757D',
    textAlign: 'center',
    marginTop: 8,
  },
  timeline: {
    width: '100%',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    direction: 'rtl',
  },
  timelineColumn: {
    alignItems: 'center',
    width: 40,
    marginRight: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
  },
  connector: {
    width: 2,
    height: 60, // approximate height to connect to next
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(192,151,59,0.4)',
    marginVertical: 4,
    zIndex: 1,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    direction: 'rtl',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Cairo_700Bold',
    color: '#212529',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#6C757D',
    lineHeight: 20,
  }
});
