import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing, runOnJS } from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const CountUpNumber = ({ target, duration = 1500, isVisible, prefix = "" }) => {
  const count = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      count.value = withTiming(target, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [isVisible, target, duration]);

  const animatedProps = useAnimatedProps(() => {
    // Format to Arabic-Indic digits
    const formatted = Math.round(count.value).toLocaleString('ar-EG');
    return {
      text: prefix + formatted,
      defaultValue: prefix + formatted,
    };
  });

  return (
    <AnimatedTextInput
      editable={false}
      animatedProps={animatedProps}
      style={styles.statNumberText}
    />
  );
};

export const StatsBar = ({ isVisible }) => {
  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <CountUpNumber target={27} isVisible={isVisible} />
        <Text style={styles.statLabel}>محكمة مغطاة</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statItem}>
        <CountUpNumber target={1200} prefix="+" isVisible={isVisible} />
        <Text style={styles.statLabel}>مهمة مكتملة</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statItem}>
        <CountUpNumber target={500} prefix="+" isVisible={isVisible} />
        <Text style={styles.statLabel}>محامٍ مسجل</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumberText: {
    color: '#1B4F72',
    fontSize: 28,
    fontFamily: 'Cairo_700Bold',
    textAlign: 'center',
    padding: 0,
    margin: 0,
  },
  statLabel: {
    color: '#6C757D',
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#DEE2E6',
  },
});
