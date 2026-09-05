import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 48;

const testimonials = [
  {
    id: 1,
    name: "المحامي / أحمد سالم",
    court: "محكمة القاهرة الابتدائية",
    rating: "★★★★★",
    quote: "وفّرت عليّ ساعات من البحث عن محامٍ في الإسكندرية. وجدت من أحتاجه خلال دقائق وأنجزنا العمل باحترافية.",
    initials: "أس"
  },
  {
    id: 2,
    name: "المحامية / منى عبد الرحمن",
    court: "محكمة الجيزة الابتدائية",
    rating: "★★★★★",
    quote: "المنصة أضافت لي مصدر دخل إضافي من مهام قريبة مني. التواصل مع الزملاء سلس ومريح جداً.",
    initials: "مع"
  },
  {
    id: 3,
    name: "المحامي / كريم منصور",
    court: "محكمة الإسكندرية الابتدائية",
    rating: "★★★★☆",
    quote: "نظام التقييم يحفز الجميع على الاحترافية. أنصح كل محامٍ يريد توسيع شبكة عمله باستخدامها.",
    initials: "كم"
  }
];

const TestimonialCard = React.memo(({ item }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.quoteMark}>"</Text>
      <Text style={styles.quoteText}>{item.quote}</Text>
      <Text style={styles.ratingText}>{item.rating}</Text>
      
      <View style={styles.footerRow}>
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.court}>{item.court}</Text>
        </View>
        <LinearGradient
          colors={['#0D2E4A', '#C0973B']}
          style={styles.avatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.initials}>{item.initials}</Text>
        </LinearGradient>
      </View>
    </View>
  );
});

export const Testimonials = () => {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= testimonials.length) {
        nextIndex = 0;
      }
      scrollRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeIndex]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <LinearGradient
      colors={['#0D2E4A', '#1B4F72']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>ماذا يقول المحامون؟</Text>
        <Text style={styles.subtitle}>آراء حقيقية من مستخدمي المنصة</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        style={styles.carousel}
      >
        {testimonials.map((item) => (
          <View key={item.id} style={styles.cardWrapper}>
            <TestimonialCard item={item} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {testimonials.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.dotActive : styles.dotInactive
            ]}
          />
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Cairo_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 8,
  },
  carousel: {
    flexDirection: 'row',
  },
  cardWrapper: {
    width: screenWidth,
    alignItems: 'center',
  },
  card: {
    width: cardWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    direction: 'rtl',
  },
  quoteMark: {
    position: 'absolute',
    top: 10,
    right: 20,
    fontSize: 48,
    fontFamily: 'Cairo_700Bold',
    color: '#C0973B',
    opacity: 0.4,
  },
  quoteText: {
    fontSize: 15,
    fontFamily: 'Cairo_400Regular',
    color: '#FFFFFF',
    lineHeight: 24,
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'left',
  },
  ratingText: {
    color: '#C0973B',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'left',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  initials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#FFFFFF',
  },
  court: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#C0973B',
    width: 12,
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
