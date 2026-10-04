import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { tokens } from '../theme/tokens';

export const ModeSwitcher = () => {
  const { user, selectedMode, setSelectedMode } = useAuthStore();

  if (user?.accountMode !== 'BOTH') return null;

  const isHiring = selectedMode === 'HIRING';

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ selected: !isHiring }}
          style={[styles.option, !isHiring && styles.optionActive]}
          onPress={() => setSelectedMode('GIG')}
        >
          <Text style={[styles.label, !isHiring && styles.labelActive]}>البحث عن عمل</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ selected: isHiring }}
          style={[styles.option, isHiring && styles.optionActive]}
          onPress={() => setSelectedMode('HIRING')}
        >
          <Text style={[styles.label, isHiring && styles.labelActive]}>توظيف محامٍ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  track: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.paper,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    padding: tokens.spacing.xxs,
    gap: tokens.spacing.xxs,
  },
  option: {
    flex: 1,
    minHeight: tokens.spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.xs,
    borderRadius: tokens.radius.sm,
  },
  optionActive: {
    backgroundColor: tokens.colors.white,
    ...tokens.shadows.sm,
  },
  label: {
    textAlign: 'center',
    fontSize: tokens.typography.sizes.xs,
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.muted,
  },
  labelActive: {
    color: tokens.colors.navy,
  },
  description: {
    marginTop: tokens.spacing.xs,
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
    textAlign: 'right',
  },
});
