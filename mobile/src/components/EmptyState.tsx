import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { tokens } from '../theme/tokens';
import { ShieldCheck } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: React.ReactNode;
  headline: string;
  body: string;
  ctaText?: string;
  onCtaPress?: () => void;
}

export const EmptyState = ({ icon, headline, body, ctaText, onCtaPress }: EmptyStateProps) => {
  return (
    <View className="flex-1 p-12 justify-center items-center">
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="w-30 h-30 rounded-full bg-signal/5 justify-center items-center mb-8"
      >
        {icon || <ShieldCheck size={64} color={tokens.colors.muted} className="opacity-10" />}
      </MotiView>
      
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200 }}
        className="items-center mb-8"
      >
        <Text className="text-xl font-displayBold text-ink mb-2 text-center">{headline}</Text>
        <Text className="text-base font-body text-muted text-center leading-5 px-6">{body}</Text>
      </MotiView>

      {ctaText && onCtaPress && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 400 }}
        >
          <TouchableOpacity
            className="px-8 py-4 bg-white rounded-xl border border-line shadow-sm"
            onPress={onCtaPress}
            activeOpacity={0.8}
          >
            <Text className="text-sm font-bodySemibold text-signal">{ctaText}</Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
};
