import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

import { HeroSection } from '../components/landing/HeroSection';
import { StatsBar } from '../components/landing/StatsBar';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Features } from '../components/landing/Features';
import { Testimonials } from '../components/landing/Testimonials';
import { FinalCTA } from '../components/landing/FinalCTA';

export const LandingScreen = ({ navigation }) => {
  const scrollY = useSharedValue(0);

  const [visibleSections, setVisibleSections] = useState({
    stats: false,
    howItWorks: false,
    features: false,
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const checkVisibility = (section, yPosition) => {
    // If scrolled past a threshold, mark it visible
    // 300 is an arbitrary offset to trigger animations slightly before element is at top
    if (scrollY.value > yPosition - 600 && !visibleSections[section]) {
      setVisibleSections(prev => ({ ...prev, [section]: true }));
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          bounces={false}
        >
          {/* HERO */}
          <HeroSection navigation={navigation} />

          {/* STATS */}
          <View onLayout={(e) => checkVisibility('stats', e.nativeEvent.layout.y)}>
            <StatsBar isVisible={visibleSections.stats} />
          </View>

          {/* HOW IT WORKS */}
          <View onLayout={(e) => checkVisibility('howItWorks', e.nativeEvent.layout.y)}>
            <HowItWorks isVisible={visibleSections.howItWorks} />
          </View>

          {/* FEATURES */}
          <View onLayout={(e) => checkVisibility('features', e.nativeEvent.layout.y)}>
            <Features isVisible={visibleSections.features} />
          </View>

          {/* TESTIMONIALS */}
          <Testimonials />

          {/* FINAL CTA */}
          <FinalCTA navigation={navigation} />
          
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D2E4A', // Matches top of hero gradient
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Fallback for bottom safe area
  }
});
