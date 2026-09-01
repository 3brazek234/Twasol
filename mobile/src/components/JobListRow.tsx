import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, interpolateColor } from 'react-native-reanimated';
import { Job } from '../schemas/job.schema';
import { StatusPill } from './StatusPill';
import { MapPin, DollarSign, Clock } from 'lucide-react-native';
import { MotiView } from 'moti';

interface JobListRowProps {
  item: Job;
  lastSeenAt?: number;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const JobListRow = ({ item, lastSeenAt, onPress }: JobListRowProps) => {
  const formattedSalary = item.offerAmount ? `$${item.offerAmount.toLocaleString()}` : 'Negotiable';
  const relativeDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const isNew = lastSeenAt ? new Date(item.createdAt).getTime() > lastSeenAt : false;
  
  const highlightOpacity = useSharedValue(isNew ? 1 : 0);

  React.useEffect(() => {
    if (isNew) {
      highlightOpacity.value = withDelay(500, withTiming(0, { duration: 1500 }));
    }
  }, [isNew]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: highlightOpacity.value > 0 
        ? interpolateColor(highlightOpacity.value, [0, 1], ['#FFFFFF', 'rgba(42, 143, 133, 0.05)'])
        : '#FFFFFF'
    };
  });

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
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center bg-signal/10 px-2 py-1 rounded-md">
            <MapPin size={12} color="#2A8F85" className="mr-1" />
            <Text className="text-[10px] font-bodySemibold text-signal tracking-widest uppercase" numberOfLines={1}>
              {item.courtId.substring(0, 8).toUpperCase()}
            </Text>
          </View>
          <StatusPill status={item.status} />
        </View>

        <Text className="text-lg font-displayBold text-ink mb-4 leading-6" numberOfLines={2}>
          {item.title}
        </Text>

        <View className="flex-row justify-between items-center border-t border-line/50 pt-4">
          <View className="flex-row items-center">
            <Clock size={14} color="#718096" className="mr-1.5" />
            <Text className="text-xs font-body text-muted">{relativeDate}</Text>
          </View>
          <View className="flex-row items-center gap-0.5">
            <DollarSign size={14} color="#2A8F85" />
            <Text className="text-sm font-mono text-ink font-bold">{formattedSalary}</Text>
          </View>
        </View>
      </AnimatedPressable>
    </MotiView>
  );
};
