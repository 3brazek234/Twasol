import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MessageCircle, RefreshCw } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { useMyActiveJobs, useUpdateJobStatus } from '../../hooks/useJobs';
import { useAuthStore } from '../../stores/authStore';

export const ActiveJobsScreen = () => {
  const { data: jobs = [], isLoading, isRefetching, refetch } = useMyActiveJobs();
  const updateStatus = useUpdateJobStatus();
  const navigation = useNavigation<any>();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleUpdateStatus = async (jobId: string) => {
    try {
      await updateStatus.mutateAsync({ jobId, status: 'IN_PROGRESS' });
      Alert.alert('نجاح', 'تم تحديث الحالة إلى جاري التنفيذ');
    } catch (err) {
      Alert.alert('خطأ', 'فشل تحديث الحالة');
    }
  };

  const getUrgencyColor = (deadline: string | null) => {
    if (!deadline) return tokens.colors.muted;
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    if (days < 0) return '#DC3545';
    if (days <= 2) return '#DC3545';
    if (days <= 5) return '#FFC107';
    return tokens.colors.muted;
  };

  const renderItem = ({ item }: { item: any }) => {
    const isAssigned = item.status === 'AGREED';
    const isInProgress = item.status === 'IN_PROGRESS';

    return (
      <View style={styles.card}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.court}>{item.court_name} - {item.court_governorate}</Text>
        <Text style={styles.poster}>الموكل: {item.poster_name}</Text>
        
        <View style={styles.metaRow}>
          <Text style={[styles.deadline, { color: getUrgencyColor(item.deadline) }]}>
            {item.deadline ? new Intl.DateTimeFormat('ar-EG', { dateStyle: 'short' }).format(new Date(item.deadline)) : 'غير محدد'}
          </Text>
          <Text style={styles.fee}>{item.fee} ج.م</Text>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {isAssigned ? 'تم التعيين' : (isInProgress ? 'جاري التنفيذ' : item.status)}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.btn, styles.chatBtn]} 
            onPress={() => navigation.navigate('Chat', { conversationId: item.conversationId, jobTitle: item.title, otherPartyName: item.poster_name })}
          >
            <MessageCircle size={18} color="#fff" />
            <Text style={styles.btnText}>فتح المحادثة</Text>
          </TouchableOpacity>

          {isAssigned && (
            <TouchableOpacity 
              style={[styles.btn, styles.progressBtn]} 
              onPress={() => handleUpdateStatus(item.id)}
            >
              <RefreshCw size={18} color="#fff" />
              <Text style={styles.btnText}>تحديث للإنجاز</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tokens.colors.signal} />
      </View>
    );
  }

  if (jobs.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>لا توجد طلبات جارية في الوقت الحالي</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={tokens.colors.signal} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.paper,
  },
  list: {
    padding: tokens.spacing.md,
    paddingBottom: tokens.spacing.xxl,
  },
  emptyText: {
    fontFamily: tokens.typography.fonts.bodyMedium,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.muted,
  },
  card: {
    backgroundColor: tokens.colors.white,
    padding: tokens.spacing.lg,
    borderRadius: 16,
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  title: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: tokens.typography.sizes.lg,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.xs,
  },
  court: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.docket,
    marginBottom: tokens.spacing.xs,
  },
  poster: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.muted,
    marginBottom: tokens.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.line,
  },
  deadline: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
  },
  fee: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.signal,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colors.paper,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.pill,
    marginBottom: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  badgeText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.md,
    borderRadius: 12,
    gap: tokens.spacing.sm,
  },
  chatBtn: {
    backgroundColor: tokens.colors.signal,
  },
  progressBtn: {
    backgroundColor: '#FFC107',
  },
  btnText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
    color: '#fff',
  }
});
