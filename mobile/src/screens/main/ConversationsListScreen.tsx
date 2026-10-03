import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useConversations } from '../../hooks/useConversations';
import { tokens } from '../../theme/tokens';
import { User } from 'lucide-react-native';
import { ConversationSummary } from '../../api/conversations.api';
import { EmptyState } from '../../components/EmptyState';
import { EmptyStateIllustration } from '../../components/EmptyStateIllustration';

export const ConversationsListScreen = ({ navigation }: any) => {
  const { data: conversations = [], isLoading, error } = useConversations();


  const renderItem = ({ item }: { item: ConversationSummary }) => {
    const lastMsgTime = item.lastMessageAt
      ? new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    const isDirect = item.type === 'DIRECT_INQUIRY';
    const subtitle = isDirect ? 'استفسار مباشر' : (item.jobTitle ? item.jobTitle : 'محادثة');

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item.id,
            conversationType: item.type,
            otherPartyName: item.otherPartyName,
            jobTitle: item.jobTitle,
            jobStatus: item.jobStatus,
          })
        }
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.time}>{lastMsgTime}</Text>
            <Text style={styles.name}>{item.otherPartyName}</Text>
          </View>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {subtitle}
          </Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage ?? 'لا توجد رسائل بعد'}
          </Text>
        </View>

        <View style={styles.avatarContainer}>
          <User size={18} color={tokens.colors.signal} />
          {/* Add a small dot if unread (mocked here) */}
          <View style={styles.unreadBadge} />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={tokens.colors.signal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: tokens.spacing.md, flexGrow: conversations.length === 0 ? 1 : 0 }}
        ListEmptyComponent={
          <EmptyState
            illustration={<EmptyStateIllustration kind="chat" />}
            headline="ستظهر محادثاتك هنا"
            body="قدّم على مهمة لبدء محادثة والتفاوض مباشرة."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paper },
  card: {
    flexDirection: 'row', // Left to right
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing.md,
    borderRadius: 16,
    marginBottom: tokens.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(47, 111, 94, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginStart: tokens.spacing.sm, // Margin on the left since avatar is on the right
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    end: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.colors.signal,
    borderWidth: 2,
    borderColor: tokens.colors.white,
  },
  content: { flex: 1, alignItems: 'flex-end' },
  header: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 2 },
  name: { fontSize: tokens.typography.sizes.base - 1, fontWeight: tokens.typography.weights.semibold, color: tokens.colors.ink, fontFamily: tokens.typography.fonts.body },
  time: { fontSize: tokens.typography.sizes.xs, color: tokens.colors.muted, fontFamily: tokens.typography.fonts.body },
  jobTitle: { fontSize: tokens.typography.sizes.xs, color: tokens.colors.muted, fontFamily: tokens.typography.fonts.body, marginBottom: 2 },
  lastMessage: { color: tokens.colors.muted, fontSize: tokens.typography.sizes.sm, fontFamily: tokens.typography.fonts.body },
});
