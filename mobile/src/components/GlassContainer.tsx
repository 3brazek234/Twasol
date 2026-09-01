import React from 'react';
import { View, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  style?: ViewStyle;
}

export const GlassContainer = ({ children, className = '', intensity = 80, style }: GlassContainerProps) => {
  const { isDark } = useTheme();

  return (
    <View
      className={`rounded-xl overflow-hidden border border-white/10 shadow-sm ${className}`}
      style={style}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          className="absolute inset-0"
        />
      ) : (
        <View
          className={`absolute inset-0 ${
            isDark ? 'bg-ink/85' : 'bg-white/85'
          }`}
        />
      )}
      {children}
    </View>
  );
};
