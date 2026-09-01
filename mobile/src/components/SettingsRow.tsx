import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { tokens } from '../theme/tokens';

export type SettingsRowProps = {
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  isDestructive?: boolean;
  icon?: React.ReactNode;
};

export const SettingsRow = ({
  label,
  subtitle,
  value,
  onPress,
  isSwitch,
  switchValue,
  onSwitchChange,
  isDestructive,
  icon,
}: SettingsRowProps) => {
  const content = (
    <View style={styles.row}>
      <View style={styles.leftContent}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.textContent}>
          <Text style={[styles.label, isDestructive && styles.destructiveText]}>{label}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      <View style={styles.rightContent}>
        {value && <Text style={styles.value}>{value}</Text>}
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: tokens.colors.line, true: tokens.colors.signal }}
            accessibilityLabel={`${label} toggle`}
          />
        ) : onPress ? (
          <ChevronRight size={20} color={tokens.colors.muted} />
        ) : null}
      </View>
    </View>
  );

  if (onPress && !isSwitch) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.7} 
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={subtitle}
        style={styles.touchableArea}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.staticArea}>{content}</View>;
};

const styles = StyleSheet.create({
  touchableArea: {
    minHeight: 44, // Accessibility touch target
    justifyContent: 'center',
  },
  staticArea: {
    minHeight: 44,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.md,
    backgroundColor: tokens.colors.white,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingEnd: tokens.spacing.md,
  },
  iconContainer: {
    marginEnd: tokens.spacing.md,
  },
  textContent: {
    flex: 1,
  },
  label: {
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.medium,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.ink,
  },
  destructiveText: {
    color: tokens.colors.destructive,
  },
  subtitle: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.muted,
    marginTop: 2,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.muted,
    marginEnd: tokens.spacing.sm,
  },
});
