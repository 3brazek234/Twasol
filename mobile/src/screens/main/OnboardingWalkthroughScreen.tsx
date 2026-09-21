import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, StatusBar, FlatList } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { tokens } from '../../theme/tokens';
import { ChevronLeft, Search, Users, Handshake, Briefcase, Star, PlusCircle, CheckCircle, FileText, Activity } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

type StepData = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

export const OnboardingWalkthroughScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFromSettings = route.params?.fromSettings || false;
  
  const { user, setHasSeenOnboarding } = useAuthStore();
  const accountMode = user?.accountMode || 'BOTH';

  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mark as seen immediately so it doesn't show again
  useEffect(() => {
    if (!isFromSettings) {
      setHasSeenOnboarding(true);
      AsyncStorage.setItem('@has_seen_onboarding', 'true').catch(console.error);
    }
  }, [isFromSettings, setHasSeenOnboarding]);

  const getSteps = (): StepData[] => {
    switch (accountMode) {
      case 'GIG':
        return [
          {
            id: '1',
            title: 'تصفح المهام',
            description: 'ابحث في جدول القضايا عن المهام المتاحة في نطاق المحاكم التي تعمل بها.',
            icon: <Search color={tokens.colors.navy} size={32} />
          },
          {
            id: '2',
            title: 'تقديم العروض',
            description: 'قدم عروضك على المهام المناسبة وحدد أتعابك ووقت التنفيذ المقترح.',
            icon: <FileText color={tokens.colors.navy} size={32} />
          },
          {
            id: '3',
            title: 'التفاوض والاتفاق',
            description: 'تواصل مع صاحب المهمة عبر المحادثة المباشرة للوصول إلى اتفاق نهائي.',
            icon: <Handshake color={tokens.colors.navy} size={32} />
          },
          {
            id: '4',
            title: 'تنفيذ المهمة',
            description: 'قم بإنجاز العمل المطلوب بدقة واحترافية في الوقت المتفق عليه.',
            icon: <Briefcase color={tokens.colors.navy} size={32} />
          },
          {
            id: '5',
            title: 'الإتمام والتقييم',
            description: 'يؤكد الموكِّل إتمام المهمة، وتؤكد استلامك للأجر المتفق عليه، ثم شارك تقييمك.',
            icon: <Star color={tokens.colors.gold} size={32} />
          }
        ];
      case 'HIRING':
        return [
          {
            id: '1',
            title: 'نشر المهمة',
            description: 'انشر طلبك بوضوح وحدد المحكمة والوقت والميزانية المقترحة لتنفيذها.',
            icon: <PlusCircle color={tokens.colors.navy} size={32} />
          },
          {
            id: '2',
            title: 'مراجعة المتقدمين',
            description: 'استقبل عروض الزملاء، راجع ملفاتهم الشخصية، واختر المحامي الأنسب.',
            icon: <Users color={tokens.colors.navy} size={32} />
          },
          {
            id: '3',
            title: 'التفاوض والاتفاق',
            description: 'تواصل مع المحامي المختار عبر المحادثة المباشرة للاتفاق على التفاصيل النهائية.',
            icon: <Handshake color={tokens.colors.navy} size={32} />
          },
          {
            id: '4',
            title: 'متابعة التنفيذ',
            description: 'تابع حالة المهمة وتواصل مع المحامي الموكل أثناء فترة التنفيذ.',
            icon: <Activity color={tokens.colors.navy} size={32} />
          },
          {
            id: '5',
            title: 'الإتمام والتقييم',
            description: 'راجع ما يثبت إنهاء المهمة وقم بتقييم أداء المحامي لضمان جودة المنصة.',
            icon: <CheckCircle color={tokens.colors.gold} size={32} />
          }
        ];
      case 'BOTH':
      default:
        return [
          {
            id: '1',
            title: 'نشر وتصفح المهام',
            description: 'انشر مهامك للزملاء، أو تصفح المهام المتاحة لتنفيذها لزيادة دخلك.',
            icon: <Briefcase color={tokens.colors.navy} size={32} />
          },
          {
            id: '2',
            title: 'التقديم والمراجعة',
            description: 'قدم عروضك على مهام الآخرين، وراجع العروض المقدمة على مهامك.',
            icon: <Users color={tokens.colors.navy} size={32} />
          },
          {
            id: '3',
            title: 'التفاوض والاتفاق',
            description: 'استخدم المحادثة المباشرة لمناقشة تفاصيل المهام والوصول إلى اتفاق واضح.',
            icon: <Handshake color={tokens.colors.navy} size={32} />
          },
          {
            id: '4',
            title: 'التنفيذ والمتابعة',
            description: 'نفذ المهام الموكلة إليك، وتابع سير العمل في المهام التي وكلتها للغير.',
            icon: <Activity color={tokens.colors.navy} size={32} />
          },
          {
            id: '5',
            title: 'الإتمام والتقييم',
            description: 'أغلق المهام المنجزة، وشارك تقييمك لبناء بيئة عمل موثوقة واحترافية.',
            icon: <Star color={tokens.colors.gold} size={32} />
          }
        ];
    }
  };

  const steps = getSteps();

  const handleFinish = () => {
    if (isFromSettings) {
      navigation.goBack();
    } else {
      navigation.replace('MainTabs');
    }
  };

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  };

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item, index }: { item: StepData, index: number }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.contentContainer}>
          <View style={styles.mockupWrapper}>
            <View style={styles.mockCard}>
              <View style={styles.iconWrapper}>
                {item.icon}
              </View>
              <Text style={styles.stepNumber}>الخطوة {index + 1}</Text>
            </View>
          </View>

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
          <TouchableOpacity onPress={handleFinish} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={styles.skipText}>{isFromSettings ? "إغلاق" : "تخطي"}</Text>
          </TouchableOpacity>
        </View>

        {/* The Swiper */}
        <FlatList
          ref={flatListRef}
          data={steps}
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
            {steps.map((_, index) => (
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
              {currentIndex === steps.length - 1 ? (isFromSettings ? "تم" : "ابدأ الآن") : "التالي"}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    direction: "rtl",
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
    backgroundColor: "rgba(27, 42, 74, 0.05)",
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
    width, // Each slide takes exactly screen width
    justifyContent: "flex-start",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
  },
  mockupWrapper: {
    flex: 1.2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    width: "100%",
  },
  mockCard: {
    width: "70%",
    backgroundColor: tokens.colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: tokens.colors.navy,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 15 },
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 1,
    borderColor: "rgba(27, 42, 74, 0.05)",
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(27, 42, 74, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 18,
    fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.navy,
  },
  textContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: tokens.typography.fonts.displayBold,
    color: tokens.colors.navy,
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.muted,
    textAlign: "center",
    lineHeight: 26,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    direction: "rtl",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
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
    backgroundColor: "rgba(27, 42, 74, 0.1)",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
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
});
