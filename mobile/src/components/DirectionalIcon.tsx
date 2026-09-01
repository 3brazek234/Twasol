import React from 'react';
import { LucideIcon } from 'lucide-react-native';
import { View, ViewStyle } from 'react-native';

interface DirectionalIconProps {
  Icon: LucideIcon;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const DirectionalIcon = ({ Icon, size, color, style }: DirectionalIconProps) => {
  return (
    <View style={style}>
      <Icon size={size} color={color} />
    </View>
  );
};
