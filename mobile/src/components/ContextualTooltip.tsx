import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView } from 'moti';
import { X } from 'lucide-react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { tokens } from '../theme/tokens';
import { EmptyStateIllustration } from './EmptyStateIllustration';

interface ContextualTooltipProps {
  storageKey: string;
  children: React.ReactNode;
  message: string;
  illustration: 'offer' | 'jobs';
  inline?: boolean;
}

export const ContextualTooltip = ({
  storageKey,
  children,
  message,
  illustration,
  inline = false,
}: ContextualTooltipProps) => {
  const [visible, setVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(storageKey).then((seen) => {
      if (mounted && seen !== 'true') setVisible(true);
    }).catch((error) => {
      console.error('Unable to load contextual tip preference', error);
      if (mounted) setVisible(true);
    });
    return () => {
      mounted = false;
    };
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(storageKey, 'true').catch((error) => {
      console.error('Unable to save contextual tip preference', error);
    });
  };

  return (
    <View style={styles.anchor}>
      {visible && (
        <MotiView
          from={reducedMotion ? { opacity: 1, translateY: 0 } : { opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? { type: 'timing', duration: 0 } : { type: 'timing', duration: 180 }}
          style={[styles.tooltip, inline && styles.inlineTooltip]}
        >
          <EmptyStateIllustration kind={illustration} width={42} height={34} />
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity onPress={dismiss} accessibilityRole="button" accessibilityLabel="إغلاق التلميح">
            <X size={16} color={tokens.colors.muted} />
          </TouchableOpacity>
        </MotiView>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  anchor: {
    position: 'relative',
    zIndex: 2,
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    start: 0,
    zIndex: 10,
    width: 248,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    padding: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
    backgroundColor: tokens.colors.paper,
    borderColor: tokens.colors.line,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    shadowColor: tokens.colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  inlineTooltip: {
    position: 'relative',
    bottom: undefined,
    start: undefined,
    width: 240,
  },
  message: {
    flex: 1,
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.xs,
    textAlign: 'right',
    lineHeight: 18,
  },
});
