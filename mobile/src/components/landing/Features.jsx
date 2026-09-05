import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { ShieldCheck, MapPin, MessageCircle, Bell, Star, Clock } from 'lucide-react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming, useSharedValue, useEffect } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const cardWidth = (width - 52) / 2;

const features = [
  {
    id: 1,
    title: "توثيق هوية المحامين",
    body: "كل محامٍ مُتحقق منه برقم نقابته قبل القبول في المنصة",
    Icon: ShieldCheck,
    color: "#1B4F72"
  },
  {
    id: 2,
    title: "تطابق جغرافي دقيق",
    body: "نظام مطابقة يعرض فقط المحامين المسجلين في المحكمة المطلوبة",
    Icon: MapPin,
    color: "#2E86C1"
  },
  {
    id: 3,
    title: "تواصل مباشر وآمن",
    body: "محادثة مشفرة بين الطرفين لكل مهمة على حدة",
    Icon: MessageCircle,
    color: "#C0973B"
  },
  {
    id: 4,
    title: "إشعارات فورية",
    body: "تنبيهات لحظية عند كل تحديث على مهمتك أو طلبك",
    Icon: Bell,
    color: "#198754"
  },
  {
    id: 5,
    title: "نظام تقييم شفاف",
    body: "تقييمات حقيقية بعد كل مهمة تبني سمعة موثوقة للجميع",
    Icon: Star,
    color: "#C0973B"
  },
  {
    id: 6,
    title: "إدارة المواعيد النهائية",
    body: "تنبيهات ذكية للمواعيد الحرجة حتى لا تفوتك مهمة",
    Icon: Clock,
    color: "#DC3545"
  }
];

const FeatureCard = ({ item, index, isVisible }) => {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        scale.value = withTiming(1, { duration: 400 });
        opacity.value = withTiming(1, { duration: 400 });
      }, index * 100);
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}1A` }]}>
        <item.Icon size={28} color={item.color} />
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardBody}>{item.body}</Text>
    </Animated.View>
  );
};

export const Features = ({ isVisible }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>لماذا وكيل؟</Text>
        <Text style={styles.subtitle}>مزايا تجعل التوكيل القانوني أسهل وأسرع</Text>
      </View>

      <View style={styles.grid}>
        {features.map((feat, index) => (
          <FeatureCard key={feat.id} item={feat} index={index} isVisible={isVisible} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    direction: 'rtl',
  },
  card: {
    width: cardWidth,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    direction: 'rtl',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#212529',
    marginBottom: 6,
    textAlign: 'left',
  },
  cardBody: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#6C757D',
    lineHeight: 18,
    textAlign: 'left',
  }
});
