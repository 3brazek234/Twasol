import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Message } from '../schemas/message.schema';
import { Check, X, DollarSign } from 'lucide-react-native';
import { MotiView } from 'moti';

interface OfferCardProps {
  item: Message;
  isMe: boolean;
  onResponse?: (msgId: string, action: 'accept' | 'reject') => void;
}

export const OfferCard = ({ item, isMe, onResponse }: OfferCardProps) => {
  const isPending = item.type === 'offer';
  const isAccepted = item.type === 'offer_accepted';
  const isRejected = item.type === 'offer_rejected';

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      className={`bg-white rounded-2xl w-[94%] self-center my-4 shadow-md overflow-hidden border border-line`}
    >
      <View className="h-1 bg-signal w-full" />
      
      <View className="p-4 items-end">
        <View className={`px-2.5 py-1 rounded-full ${
          isAccepted ? 'bg-success/10' : isRejected ? 'bg-destructive/10' : 'bg-docket/10'
        }`}>
          <Text className={`text-[10px] font-bodySemibold tracking-widest ${
            isAccepted ? 'text-success' : isRejected ? 'text-destructive' : 'text-docket'
          }`}>
            {isPending ? 'قيد الانتظار' : isAccepted ? 'مقبول' : 'مرفوض'}
          </Text>
        </View>
      </View>

      <View className="px-8 pb-8 items-center">
        <Text className="text-[11px] font-bodySemibold text-muted mb-2 tracking-widest uppercase">المبلغ المقترح</Text>
        <View className="flex-row items-center mb-2">
          <DollarSign size={24} color="#2A8F85" className="mr-0.5" />
          <Text className="text-3xl font-mono text-ink font-bold">{item.offerAmount?.toLocaleString()}</Text>
        </View>
        {item.content ? (
          <Text className="text-sm font-body text-muted text-center mt-1 italic">
            "{item.content}"
          </Text>
        ) : null}
      </View>

      {isPending && !isMe && (
        <View className="flex-row border-t border-line">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onResponse?.(item.id!, 'reject')}
            className="flex-1 flex-row h-14 items-center justify-center gap-2 bg-white border-r border-line"
          >
            <X size={18} color="#1A202C" />
            <Text className="text-ink font-bodySemibold text-sm">رفض</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onResponse?.(item.id!, 'accept')}
            className="flex-1 flex-row h-14 items-center justify-center gap-2 bg-signal"
          >
            <Check size={18} color="#FFFFFF" />
            <Text className="text-white font-bodySemibold text-sm">قبول</Text>
          </TouchableOpacity>
        </View>
      )}

      {(isAccepted || isRejected) && (
        <View className="p-4 bg-paper items-center">
          <Text className="text-xs font-body text-muted">
            {isAccepted ? 'تم قبول العرض.' : 'تم رفض العرض.'}
          </Text>
        </View>
      )}
    </MotiView>
  );
};
