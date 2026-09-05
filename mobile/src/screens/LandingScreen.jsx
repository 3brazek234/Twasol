import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Landmark, ShieldCheck, Star } from 'lucide-react-native';
import { tokens } from '../theme/tokens';

const { width, height } = Dimensions.get('window');

// --- Mock UI Components ---
const MockJobCard = () => (
  <View style={styles.mockJobCard}>
    <View style={styles.mockRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Landmark size={14} color={tokens.colors.navy} style={{ marginRight: 6 }} />
        <Text style={styles.mockCourtText}>محكمة استئناف القاهرة</Text>
      </View>
      <Text style={styles.mockSalaryText}>٢٥٠٠ ج.م</Text>
    </View>
    <Text style={styles.mockJobTitle}>حضور جلسة وتأجيل إداري</Text>
    <View style={styles.mockApplyBtn}>
      <Text style={styles.mockApplyBtnText}>تقديم عرض تمثيل</Text>
    </View>
  </View>
);

const MockChatScreen = () => (
  <View style={styles.mockChatScreen}>
    <View style={styles.mockChatBubbleLeft}>
      <Text style={styles.mockChatTextLeft}>هل يمكنك استلام المستندات غداً؟</Text>
    </View>
    <View style={styles.mockChatBubbleRight}>
      <Text style={styles.mockChatTextRight}>بالتأكيد، سأتواجد في المحكمة الساعة ٩ صباحاً.</Text>
    </View>
  </View>
);

const MockProfileBadge = () => (
  <View style={styles.mockProfileCard}>
    <View style={styles.mockAvatar}>
      <ShieldCheck size={24} color={tokens.colors.white} />
    </View>
    <Text style={styles.mockProfileName}>أحمد سالم</Text>
    <Text style={styles.mockProfileRole}>محامٍ موثق بجدول الاستئناف</Text>
    <View style={{ flexDirection: 'row', marginTop: 6 }}>
      {[1,2,3,4,5].map(i => <Star key={i} size={12} color={tokens.colors.gold} fill={tokens.colors.gold} />)}
    </View>
  </View>
);

const SLIDES = [
  {
    id: '1',
    title: 'وصّل مهمتك\nبالمحامي المناسب',
    description: 'تصفح آلاف المحامين المسجلين في كافة المحاكم لإنجاز المهام القانونية بسرعة وموثوقية عالية.',
    MockUI: MockJobCard,
  },
  {
    id: '2',
    title: 'تواصل وتنسيق\nمباشر وآمن',
    description: 'تواصل فوراً مع زميلك المحامي عبر محادثات مشفرة لتبادل التوكيلات والمستندات بسهولة تامة.',
    MockUI: MockChatScreen,
  },
  {
    id: '3',
    title: 'أمان، ثقة،\nواحترافية تامة',
    description: 'نوثّق هوية كل محامٍ برقم نقابته بدقة، مع نظام تقييم شفاف يبني سمعتك المهنية ويحمي حقوقك.',
    MockUI: MockProfileBadge,
  }
];

export const LandingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      navigation.navigate('Register');
    }
  };

  const renderSlide = ({ item }) => {
    return (
      <View style={[styles.slide, { width }]}>
        {/* Background decorative shape */}
        <View style={styles.decorativeCircle} />

        <View style={styles.contentContainer}>
          {/* Top Half: UI Mockup Preview */}
          <View style={styles.mockupWrapper}>
            <item.MockUI />
          </View>

          {/* Bottom Half: Text Details */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      <SafeAreaView style={styles.safeArea}>
        
        {/* Top Navigation Row */}
        <View style={styles.topBar}>
          <Text style={styles.logoText}>وكيل</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={styles.skipText}>تخطي</Text>
          </TouchableOpacity>
        </View>

        {/* The Swiper */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          bounces={false}
          inverted // Because we are RTL, scrolling right goes to next
          style={styles.flatList}
        />

        {/* Bottom Footer Overlay */}
        <View style={styles.footerRow}>
          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentIndex === index ? styles.activeDot : styles.inactiveDot
                ]}
              />
            ))}
          </View>

          {/* Next / Start Button */}
          <TouchableOpacity 
            style={styles.nextButton} 
            activeOpacity={0.8}
            onPress={goNext}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === SLIDES.length - 1 ? 'ابدأ الآن' : 'التالي'}
            </Text>
            <ChevronLeft color={tokens.colors.white} size={20} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    direction: 'rtl',
    zIndex: 10,
  },
  logoText: {
    fontSize: 24,
    fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.navy,
    letterSpacing: 1,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(27, 42, 74, 0.05)',
  },
  skipText: {
    fontSize: 14,
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.navy,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  decorativeCircle: {
    position: 'absolute',
    top: -height * 0.1,
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: tokens.colors.navy,
    opacity: 0.03, // Very subtle background shape
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  mockupWrapper: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.navy,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    textAlign: 'center',
    lineHeight: 26,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    direction: 'rtl',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: tokens.colors.gold,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: 'rgba(27, 42, 74, 0.1)',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.navy,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: tokens.colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.white,
  },

  // MOCK UI
  mockJobCard: {
    width: '90%',
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: tokens.colors.navy,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 15 },
    shadowRadius: 30,
    elevation: 15,
    direction: 'rtl',
    transform: [{ rotate: '-2deg' }, { scale: 1.05 }],
    borderWidth: 1,
    borderColor: 'rgba(27, 42, 74, 0.05)',
  },
  mockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mockCourtText: { fontSize: 13, fontFamily: tokens.typography.fonts.bodySemibold, color: tokens.colors.navy },
  mockSalaryText: { fontSize: 16, fontFamily: tokens.typography.fonts.mono, color: tokens.colors.ink },
  mockJobTitle: { fontSize: 18, fontFamily: tokens.typography.fonts.displayBold, color: tokens.colors.ink, marginBottom: 20 },
  mockApplyBtn: { backgroundColor: tokens.colors.gold, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  mockApplyBtnText: { color: tokens.colors.white, fontSize: 14, fontFamily: tokens.typography.fonts.bodySemibold },

  mockChatScreen: {
    width: '90%',
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: tokens.colors.navy,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 15 },
    shadowRadius: 30,
    elevation: 15,
    transform: [{ rotate: '2deg' }, { scale: 1.05 }],
    borderWidth: 1,
    borderColor: 'rgba(27, 42, 74, 0.05)',
  },
  mockChatBubbleLeft: {
    backgroundColor: tokens.colors.paper,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    padding: 14,
    alignSelf: 'flex-start',
    marginBottom: 16,
    maxWidth: '85%',
  },
  mockChatTextLeft: { fontSize: 13, fontFamily: tokens.typography.fonts.body, color: tokens.colors.ink, lineHeight: 20 },
  mockChatBubbleRight: {
    backgroundColor: tokens.colors.navy,
    borderRadius: 12,
    borderTopRightRadius: 4,
    padding: 14,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  mockChatTextRight: { fontSize: 13, fontFamily: tokens.typography.fonts.body, color: tokens.colors.white, lineHeight: 20 },

  mockProfileCard: {
    width: '80%',
    backgroundColor: tokens.colors.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: tokens.colors.navy,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 15 },
    shadowRadius: 30,
    elevation: 15,
    transform: [{ rotate: '-1.5deg' }, { scale: 1.05 }],
    borderWidth: 1,
    borderColor: 'rgba(27, 42, 74, 0.05)',
  },
  mockAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mockProfileName: { fontSize: 20, fontFamily: tokens.typography.fonts.displayBold, color: tokens.colors.navy },
  mockProfileRole: { fontSize: 13, fontFamily: tokens.typography.fonts.body, color: tokens.colors.muted, marginTop: 4 },
});
