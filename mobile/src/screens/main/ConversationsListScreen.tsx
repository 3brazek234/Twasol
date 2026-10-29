import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useConversations } from '../../hooks/useConversations';
import { tokens } from '../../theme/tokens';
import { User, Headphones, ChevronDown, ChevronUp } from 'lucide-react-native';
import { ConversationSummary } from '../../api/conversations.api';
import { EmptyState } from '../../components/EmptyState';
import { EmptyStateIllustration } from '../../components/EmptyStateIllustration';
import { groupConversationsByPartner, PartnerConversationGroup } from '../../utils/groupConversations';

export const ConversationsListScreen = ({ navigation }: any) => {
  const { data: conversations = [], isLoading } = useConversations();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const grouped = useMemo(
    () => groupConversationsByPartner(conversations),
    [conversations]
  );

  const openThread = (thread: ConversationSummary) => {
    navigation.navigate('Chat', {
      conversationId: thread.id,
      conversationType: thread.type,
      jobId: thread.jobId,
      otherPartyName: thread.type === 'SUPPORT' ? 'الدعم الفني' : (thread.otherPartyName ?? 'الطرف الآخر'),
      jobTitle: thread.jobTitle,
      jobStatus: thread.jobStatus,
    });
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const formatTime = (isoDate: string) =>
    isoDate
      ? new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

  const getThreadSubtitle = (thread: ConversationSummary) => {
    if (thread.type === 'DIRECT_INQUIRY') return 'استفسار مباشر';
    if (thread.type === 'SUPPORT') return 'محادثة دعم فني';
    return thread.jobTitle ? thread.jobTitle : 'مهمة';
  };

  const renderItem = ({ item }: { item: PartnerConversationGroup }) => {
    const isMultiThread = item.threads.length > 1;
    const isExpanded = !!expandedGroups[item.groupKey];
    const primaryThread = item.threads[0];
    const lastMsgTime = formatTime(item.latestMessageAt);

    const subtitle = primaryThread ? getThreadSubtitle(primaryThread) : '';

    return (
      <View style={styles.groupWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.card}
          onPress={() => {
            if (isMultiThread) {
              toggleGroup(item.groupKey);
            } else if (primaryThread) {
              openThread(primaryThread);
            }
          }}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.metaRow}>
                <Text style={styles.time}>{lastMsgTime}</Text>
                {item.jobCount > 1 && (
                  <View style={styles.jobsChip}>
                    <Text style={styles.jobsChipText}>{item.jobCount} مهام</Text>
                  </View>
                )}
                {isMultiThread && (
                  <View style={styles.chevronWrap}>
                    {isExpanded ? (
                      <ChevronUp size={16} color={tokens.colors.muted} />
                    ) : (
                      <ChevronDown size={16} color={tokens.colors.muted} />
                    )}
                  </View>
                )}
              </View>

              <View style={styles.nameRow}>
                {!item.isSupport && item.otherPartyBarNumber ? (
                  <Text style={styles.barNumber}>#{item.otherPartyBarNumber}</Text>
                ) : null}
                <Text style={styles.name}>
                  {item.isSupport ? 'الدعم الفني' : item.otherPartyName}
                </Text>
              </View>
            </View>

            <Text style={styles.jobTitle} numberOfLines={1}>
              {subtitle}
            </Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.latestMessage ?? 'لا توجد رسائل بعد'}
            </Text>
          </View>

          <View style={[styles.avatarContainer, item.isSupport && styles.supportAvatarContainer]}>
            {item.isSupport ? (
              <Headphones size={18} color={tokens.colors.navy} />
            ) : (
              <User size={18} color={tokens.colors.signal} />
            )}
          </View>
        </TouchableOpacity>

        {isMultiThread && isExpanded && (
          <View style={styles.threadsContainer}>
            {item.threads.map((thread) => (
              <TouchableOpacity
                key={thread.id}
                activeOpacity={0.8}
                style={styles.threadRow}
                onPress={() => openThread(thread)}
              >
                <View style={styles.threadHeader}>
                  <Text style={styles.time}>{formatTime(thread.lastMessageAt)}</Text>
                  <Text style={styles.threadTitle} numberOfLines={1}>
                    {getThreadSubtitle(thread)}
                  </Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {thread.lastMessage ?? 'لا توجد رسائل بعد'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
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
        data={grouped}
        keyExtractor={(item) => item.groupKey}
        renderItem={renderItem}
        contentContainerStyle={{
          padding: tokens.spacing.md,
          flexGrow: grouped.length === 0 ? 1 : 0,
        }}
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
  groupWrapper: {
    marginBottom: tokens.spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginStart: tokens.spacing.sm,
  },
  supportAvatarContainer: {
    backgroundColor: tokens.colors.goldLight,
  },
  content: { flex: 1, alignItems: 'flex-end' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: tokens.spacing.xxs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  name: {
    fontSize: tokens.typography.sizes.base - 1,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.ink,
    fontFamily: tokens.typography.fonts.bodySemibold,
  },
  barNumber: {
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.mono,
  },
  time: {
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
  },
  jobsChip: {
    backgroundColor: tokens.colors.goldLight,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: tokens.radius.pill,
  },
  jobsChipText: {
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.navy,
    fontFamily: tokens.typography.fonts.bodySemibold,
  },
  chevronWrap: {
    marginStart: tokens.spacing.xxs,
  },
  jobTitle: {
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.body,
    marginBottom: 2,
  },
  lastMessage: {
    color: tokens.colors.muted,
    fontSize: tokens.typography.sizes.sm,
    fontFamily: tokens.typography.fonts.body,
  },
  threadsContainer: {
    marginTop: tokens.spacing.xxs,
    marginEnd: tokens.spacing.lg,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    overflow: 'hidden',
  },
  threadRow: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.line,
    alignItems: 'flex-end',
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2,
  },
  threadTitle: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.navy,
    fontFamily: tokens.typography.fonts.bodySemibold,
  },
});
