import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, interpolateColor } from 'react-native-reanimated';
import { Job } from '../schemas/job.schema';
import { StatusPill } from './StatusPill';
import { MapPin, Clock } from 'lucide-react-native';
import { MotiView } from 'moti';

interface JobListRowProps {
  item: Job;
  lastSeenAt?: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Formats a salary amount in Egyptian Pounds (EGP) */
const formatCurrency = (amount?: number): string => {
  if (!amount) return 'قابل للتفاوض';
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/** Formats a date as relative Arabic string */
const timeAgo = (isoString: string): string => {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `منذ ${mins} دقيقة`;
  if (hours < 24)  return `منذ ${hours} ساعة`;
  return `منذ ${days} يوم`;
};

export const JobListRow = ({ item, lastSeenAt, onPress }: JobListRowProps) => {
  // Show court name in Arabic, fallback to English, fallback to short UUID
  const courtDisplay = item.courtNameAr ?? item.courtNameEn ?? item.courtId.substring(0, 8).toUpperCase();

  // Show salary range if available, fallback to single offer amount
  const salaryDisplay = item.salaryMin
    ? formatCurrency(item.salaryMin)
    : formatCurrency(item.offerAmount);

  const isNew = lastSeenAt ? new Date(item.createdAt).getTime() > lastSeenAt : false;
  const highlightOpacity = useSharedValue(isNew ? 1 : 0);

  React.useEffect(() => {
    if (isNew) {
      highlightOpacity.value = withDelay(500, withTiming(0, { duration: 1500 }));
    }
  }, [isNew]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: highlightOpacity.value > 0
      ? interpolateColor(highlightOpacity.value, [0, 1], ['#FFFFFF', 'rgba(27, 42, 74, 0.04)'])
      : '#FFFFFF',
  }));

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
    >
      <AnimatedPressable
        style={animatedStyle}
        className="mx-6 mb-4 p-6 rounded-2xl border border-line shadow-sm overflow-hidden active:bg-paper active:scale-[0.98]"
        onPress={onPress}
      >
        {/* Court name + Status badge */}
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center bg-slate/10 px-2 py-1 rounded-md flex-1 mr-2">
            <MapPin size={12} color="#3D5A80" style={{ marginEnd: 4 }} />
            <Text className="text-[10px] font-bodySemibold text-slate tracking-widest uppercase flex-1" numberOfLines={1}>
              {courtDisplay}
            </Text>
          </View>
          <StatusPill status={item.status} />
        </View>

        {/* Job title */}
        <Text className="text-lg font-displayBold text-ink mb-4 leading-6" numberOfLines={2}>
          {item.title}
        </Text>

        {/* Footer: Date + Salary */}
        <View className="flex-row justify-between items-center border-t border-line/50 pt-4">
          <View className="flex-row items-center">
            <Clock size={14} color="#6B7280" style={{ marginEnd: 6 }} />
            <Text className="text-xs font-body text-muted">{timeAgo(item.createdAt)}</Text>
          </View>
          <Text className="text-sm font-bodySemibold text-gold">{salaryDisplay}</Text>
        </View>
      </AnimatedPressable>
    </MotiView>
  );
};
