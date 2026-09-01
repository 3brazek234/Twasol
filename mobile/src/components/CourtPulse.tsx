import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolateColor,
  useDerivedValue,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import { useCourtPulseStore, ActivityLevel } from '../stores/courtPulseStore';
import { colors, fonts, spacing, radius, shadows } from '../theme/tokens';

interface CourtPulseProps {
  onPress: () => void;
}

export const CourtPulse = ({ onPress }: CourtPulseProps) => {
  const { activeCount, unseenCount, activityLevel } = useCourtPulseStore();
  const shouldReduceMotion = useReducedMotion();
  
  // Track previous unseen count to trigger spikes
  const [prevUnseen, setPrevUnseen] = useState(unseenCount);

  // Derive target configuration from activityLevel
  const isIdle = activityLevel === 'idle';
  const isHot = activityLevel === 'hot';
  
  // Numeric mapping for color interpolation
  const levelValue = useDerivedValue(() => {
    return withTiming(isIdle ? 0 : isHot ? 2 : 1, { duration: 500 });
  });

  const colorStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      levelValue.value,
      [0, 1, 2],
      [colors.muted, colors.signal, colors.docket]
    );
    return { backgroundColor };
  });

  // Breathing animation shared value (0 to 1)
  const breathingPhase = useSharedValue(0);
  
  // Spike animation shared value (additively layered)
  const spikeScale = useSharedValue(0);

  useEffect(() => {
    if (shouldReduceMotion) return;

    // Adjust breathing speed based on level
    const duration = isIdle ? 2500 : isHot ? 800 : 1500;
    
    breathingPhase.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite loop
      true // reverse
    );
  }, [activityLevel, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) return;
    
    // Trigger double-pulse spike when unseenCount increases
    if (unseenCount > prevUnseen) {
      spikeScale.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 150 }),
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 300 })
      );
    }
    setPrevUnseen(unseenCount);
  }, [unseenCount, prevUnseen, shouldReduceMotion]);

  const dotAnimatedStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) return {};
    
    // Scale breathes from 1.0 to 1.3. Spike adds up to 0.5.
    const baseScale = 1.0 + breathingPhase.value * 0.3;
    const currentScale = baseScale + spikeScale.value * 0.5;
    
    return {
      transform: [{ scale: currentScale }],
      opacity: 0.8 + breathingPhase.value * 0.2,
    };
  });

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.dotContainer}>
          <Animated.View style={[styles.dot, colorStyle, dotAnimatedStyle]} />
        </View>
        <Text style={styles.activeText}>
          <Text style={styles.activeNumber}>{activeCount}</Text>
          {Platform.OS === 'ios' ? ' LIVE' : ' active'}
        </Text>
        {unseenCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unseenCount}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dotContainer: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeText: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeNumber: {
    fontFamily: fonts.bodySemibold,
    color: colors.signal,
  },
  badge: {
    marginStart: 8,
    backgroundColor: colors.docket,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fonts.bodySemibold,
    color: colors.white,
  },
});
