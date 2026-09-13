import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNotifications, useMarkNotificationRead } from '../../hooks/useNotifications';
import { AppNotification } from '../../schemas/notification.schema';
import { useQueryClient } from '@tanstack/react-query';
import { tokens } from '../../theme/tokens';
import { Bell, Briefcase, Landmark, MessageSquare, ShieldAlert } from 'lucide-react-native';

export const NotificationsScreen = ({ navigation }: any) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNotifications();
  const { mutate: markAsRead } = useMarkNotificationRead();
  const queryClient = useQueryClient();

  const handleNotificationPress = (item: AppNotification) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }

    if (item.type === 'new_job' && item.referenceId) {
      navigation.navigate('JobsTab', { screen: 'JobDetail', params: { jobId: item.referenceId } });
    } else if (item.type.includes('offer') || item.type === 'chat_message' || item.type === 'new_message') {
      const conversationId = item.metadata?.conversationId || item.referenceId;
      if (conversationId) {
        const conversationType = item.metadata?.conversationType;
        navigation.navigate('ChatsTab', { screen: 'Chat', params: { conversationId, conversationType } });
      }
    }
  };

  const getNotificationTheme = (type: string) => {
    switch (type) {
      case 'new_job': 
        return { icon: <Briefcase color={tokens.colors.signal} size={16} />, bg: 'rgba(47, 111, 94, 0.08)' };
      case 'chat_message': 
      case 'new_message':
        return { icon: <MessageSquare color={tokens.colors.ink} size={16} />, bg: 'rgba(20, 33, 61, 0.08)' };
      case 'offer_received':
      case 'offer_accepted':
      case 'offer_rejected': 
        return { icon: <Landmark color={tokens.colors.docket} size={16} />, bg: 'rgba(196, 87, 31, 0.08)' };
      default: 
        return { icon: <ShieldAlert color={tokens.colors.muted} size={16} />, bg: 'rgba(107, 114, 128, 0.08)' };
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const { icon, bg } = getNotificationTheme(item.type);

    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        style={[styles.card, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: bg }]}>
          {icon}
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const flattenData = data?.pages.flatMap(page => page.data).filter(Boolean) || [];

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>الإشعارات</Text>
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={tokens.colors.signal} />
        </View>
      ) : (
        <FlatList
          data={flattenData}
          keyExtractor={(item, index) => item?.id || String(index)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: tokens.spacing.md }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator size="small" color={tokens.colors.signal} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Bell size={40} color={tokens.colors.line} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>لا يوجد إشعارات.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paper },
  headerTitle: { 
    fontSize: tokens.typography.sizes.xxl, 
    fontFamily: tokens.typography.fonts.display,
    fontWeight: tokens.typography.weights.bold, 
    color: tokens.colors.ink, 
    marginHorizontal: tokens.spacing.md + 4, 
    marginTop: tokens.spacing.xxxl, 
    marginBottom: tokens.spacing.xs 
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { 
    flexDirection: 'row', 
    backgroundColor: tokens.colors.white, 
    padding: tokens.spacing.md, 
    borderRadius: 16, 
    marginBottom: tokens.spacing.sm, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  unreadCard: { 
    borderColor: tokens.colors.line,
    borderLeftWidth: 3,
    borderLeftColor: tokens.colors.docket,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: tokens.spacing.md,
  },
  content: { flex: 1 },
  title: { 
    fontSize: tokens.typography.sizes.base - 1, 
    fontWeight: tokens.typography.weights.semibold, 
    color: tokens.colors.ink, 
    fontFamily: tokens.typography.fonts.body,
    marginBottom: 2 
  },
  unreadText: { fontWeight: tokens.typography.weights.bold },
  body: { 
    color: tokens.colors.muted, 
    fontSize: tokens.typography.sizes.sm, 
    fontFamily: tokens.typography.fonts.body,
    marginBottom: 4, 
    lineHeight: 18 
  },
  date: { fontSize: tokens.typography.sizes.xs, color: tokens.colors.muted, fontFamily: tokens.typography.fonts.body },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: tokens.colors.docket, marginStart: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: tokens.colors.muted, fontSize: tokens.typography.sizes.base, fontFamily: tokens.typography.fonts.body }
});
