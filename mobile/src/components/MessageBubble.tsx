import React from 'react';
import { View, Text } from 'react-native';
import { Message } from '../schemas/message.schema';
import { CheckCheck } from 'lucide-react-native';
import { MotiView } from 'moti';

interface MessageBubbleProps {
  item: Message;
  isMe: boolean;
}

export const MessageBubble = ({ item, isMe }: MessageBubbleProps) => {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95, translateY: 5 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      className={`mb-1 max-w-[85%] ${isMe ? 'self-start' : 'self-end'}`}
    >
      <View className={`px-4 py-2 rounded-2xl shadow-sm ${
        isMe ? 'bg-signal rounded-br-[2px]' : 'bg-white rounded-bl-[2px] border border-line'
      }`}>
        <Text className={`text-[15px] font-body leading-5 ${
          isMe ? 'text-white' : 'text-ink'
        }`}>
          {item.content}
        </Text>

        <View className="flex-row items-center justify-end mt-1">
          <Text className={`text-[10px] font-body ${
            isMe ? 'text-white/70' : 'text-muted'
          }`}>
            12:45 PM
          </Text>
          {isMe && (
            <CheckCheck size={12} color="#FFFFFF" className="ml-1 opacity-80" />
          )}
        </View>
      </View>
    </MotiView>
  );
};
