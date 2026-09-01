import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { colors, fonts, radius, shadows, spacing } from '../theme/tokens';
import { MotiView } from 'moti';

export const ModeSwitcher = () => {
  const { user, selectedMode, setSelectedMode } = useAuthStore();

  if (user?.accountMode !== 'BOTH') return null;

  const isHiring = selectedMode === 'HIRING';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.track}
        activeOpacity={1}
        onPress={() => setSelectedMode(isHiring ? 'GIG' : 'HIRING')}
      >
        <MotiView
          animate={{
            translateX: isHiring ? 70 : 0,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          style={styles.thumb}
        />
        <View style={styles.labels}>
          <Text style={[styles.label, !isHiring && styles.labelActive]}>Represent</Text>
          <Text style={[styles.label, isHiring && styles.labelActive]}>Hiring</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginStart: spacing.md,
  },
  track: {
    width: 140,
    height: 32,
    backgroundColor: 'rgba(226, 232, 240, 0.5)',
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    width: 68,
    height: 28,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    start: 2,
    ...shadows.sm,
  },
  labels: {
    flex: 1,
    flexDirection: 'row',
    zIndex: 1,
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: fonts.bodySemibold,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: colors.signal,
  },
});
