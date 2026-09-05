import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp, withRepeat, withSequence, withTiming, useSharedValue, useAnimatedStyle, useEffect } from 'react-native-reanimated';
import { ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export const HeroSection = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  const bounceValue = useSharedValue(0);

  React.useEffect(() => {
    bounceValue.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 600 }),
        withTiming(0, { duration: 600 })
      ),
      -1,
      true
    );
  }, []);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceValue.value }],
  }));

  return (
    <View style={{ height }}>
      <LinearGradient
        colors={['#0D2E4A', '#1B4F72', '#2E86C1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>⚖</Text>
            </View>
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoText}>وكيل</Text>
              <Text style={styles.tagline}>منصة التوكيل القانوني</Text>
            </View>
          </View>

          {/* Center Content */}
          <View style={styles.centerContent}>
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.badge}>
              <Text style={styles.badgeText}>⚖ منصة موثوقة للمحامين في مصر</Text>
            </Animated.View>

            <View style={styles.headlineContainer}>
              <Animated.Text entering={FadeInUp.delay(450).springify()} style={styles.headlineText}>
                وصّل مهمتك
              </Animated.Text>
              <Animated.Text entering={FadeInUp.delay(600).springify()} style={[styles.headlineText, styles.headlineGold]}>
                بالمحامي
              </Animated.Text>
              <Animated.Text entering={FadeInUp.delay(750).springify()} style={styles.headlineText}>
                المناسب
              </Animated.Text>
            </View>

            <Animated.Text entering={FadeIn.delay(800).duration(800)} style={styles.subheadline}>
              منصة رقمية تربط المحامين بزملائهم المسجلين في المحاكم المختلفة لإنجاز المهام القانونية بسرعة وثقة
            </Animated.Text>

            <View style={styles.buttonRow}>
              <Animated.View entering={FadeInUp.delay(1100).springify()} style={{ width: '48%' }}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>تسجيل الدخول</Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(1000).springify()} style={{ width: '48%' }}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>ابدأ الآن مجاناً</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

          {/* Scroll Indicator */}
          <Animated.View style={[styles.scrollIndicator, bounceStyle]}>
            <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.5)" />
            <Text style={styles.scrollText}>اكتشف المزيد</Text>
          </Animated.View>

        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topBar: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 36,
    color: '#C0973B',
  },
  logoTextContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontFamily: 'Cairo_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#C0973B',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(192,151,59,0.15)',
    borderWidth: 1,
    borderColor: '#C0973B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 32,
  },
  badgeText: {
    color: '#C0973B',
    fontSize: 12,
    fontFamily: 'Cairo_600SemiBold',
  },
  headlineContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headlineText: {
    fontSize: 38,
    fontFamily: 'Cairo_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 52,
  },
  headlineGold: {
    color: '#C0973B',
  },
  subheadline: {
    fontSize: 15,
    fontFamily: 'Cairo_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#C0973B',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C0973B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Cairo_700Bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Cairo_600SemiBold',
  },
  scrollIndicator: {
    alignItems: 'center',
    marginBottom: 10,
  },
  scrollText: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
});
