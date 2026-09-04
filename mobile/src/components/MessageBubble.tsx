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
      <View style={{
        backgroundColor: isMe ? '#DCF8C6' : '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderBottomRightRadius: isMe ? 4 : 12,
        borderBottomLeftRadius: isMe ? 12 : 4,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1
      }}>
        <Text style={{
          fontSize: 15,
          fontFamily: 'Inter-Regular', // Use default font or keep as was
          color: '#303030',
          textAlign: isMe ? 'right' : 'right'
        }}>
          {item.content}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }}>
          <Text style={{ fontSize: 10, color: isMe ? '#7B9E87' : '#999999' }}>
            {new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.timestamp))}
          </Text>
          {isMe && (
            <CheckCheck size={12} color="#7B9E87" style={{ marginStart: 4 }} />
          )}
        </View>
      </View>
    </MotiView>
  );
};
