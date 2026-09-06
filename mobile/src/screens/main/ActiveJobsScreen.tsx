import React, { useEffect, useState, useCallback } from 'react';
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
import { fetchMyActiveJobs, updateJobStatus } from '../../api/jobs.api';
import { useAuthStore } from '../../stores/authStore';

export const ActiveJobsScreen = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const loadJobs = async () => {
    try {
      const activeJobs = await fetchMyActiveJobs();
      setJobs(activeJobs);
    } catch (error) {
      console.error('Failed to fetch active jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadJobs();
  }, []);

  const handleUpdateStatus = async (jobId: string) => {
    try {
      // Optimistic update
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'IN_PROGRESS' } : job
      ));
      await updateJobStatus(jobId, 'IN_PROGRESS');
      Alert.alert('نجاح', 'تم تحديث الحالة إلى جاري التنفيذ');
    } catch (err) {
      Alert.alert('خطأ', 'فشل تحديث الحالة');
      loadJobs(); // revert on failure
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
              style={[styles.btn, styles.updateBtn]} 
              onPress={() => handleUpdateStatus(item.id)}
            >
              <RefreshCw size={18} color="#fff" />
              <Text style={styles.btnText}>تحديث إلى جاري التنفيذ</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={tokens.colors.signal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>لا توجد مهام نشطة حالياً</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.paper },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.paper },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#eee'
  },
  title: { fontSize: 16, fontFamily: tokens.typography.fonts.displayBold, color: tokens.colors.ink, marginBottom: 4, textAlign: 'left' },
  court: { fontSize: 14, color: tokens.colors.muted, marginBottom: 4, textAlign: 'left' },
  poster: { fontSize: 14, color: tokens.colors.ink, marginBottom: 12, textAlign: 'left' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  deadline: { fontSize: 13, fontFamily: tokens.typography.fonts.displayBold },
  fee: { fontSize: 14, color: tokens.colors.signal, fontFamily: tokens.typography.fonts.displayBold },
  badge: {
    backgroundColor: '#e9ecef',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 16,
  },
  badgeText: { fontSize: 12, color: '#495057' },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1
  },
  chatBtn: { backgroundColor: tokens.colors.signal },
  updateBtn: { backgroundColor: '#28a745' },
  btnText: { color: '#fff', fontSize: 13, fontFamily: tokens.typography.fonts.displayBold, marginStart: 6 },
  empty: { flex: 1, textAlign: 'center', marginTop: 40, color: tokens.colors.muted, fontFamily: tokens.typography.fonts.body }
});
