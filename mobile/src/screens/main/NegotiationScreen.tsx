import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNegotiationTimeline, useNegotiationActions } from '../../hooks/useNegotiation';
import { useAuthStore } from '../../stores/authStore';
import { FileText, DollarSign, MessageSquare, X } from 'lucide-react-native';
import { safeFormatTime } from '../../utils/dateUtils';
import { colors, fonts, spacing, radius } from '../../theme/tokens';
import * as DocumentPicker from 'expo-document-picker';
import { apiClient } from '../../api/client';

export const NegotiationScreen = ({ route, navigation }: any) => {
  const { conversationId, otherPartyName, jobTitle } = route.params;
  const { data: timeline = [], refetch, isFetching } = useNegotiationTimeline(conversationId);
  const actions = useNegotiationActions(conversationId);
  const currentUser = useAuthStore(state => state.user);

  const [modalType, setModalType] = useState<'OFFER' | 'NOTE' | null>(null);
  const [inputValue, setInputValue] = useState('');

  useFocusEffect(
    useCallback(() => {
      actions.markAsRead();
    }, [timeline.length])
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitleText}>{otherPartyName}</Text>
          {jobTitle && <Text style={styles.headerSubText}>{jobTitle}</Text>}
        </View>
      )
    });
  }, [navigation, otherPartyName, jobTitle]);

  const handleDocumentPick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!res.canceled && res.assets.length > 0) {
        const file = res.assets[0];
        
        const formData = new FormData();
        formData.append('file', {
          uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name,
        } as any);

        const uploadRes = await apiClient.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        await actions.sendDocument({
          attachmentUrl: uploadRes.data.url,
          attachmentType: 'DOCUMENT',
          attachmentName: file.name,
          attachmentSize: file.size,
        });
      }
    } catch (err) {
      console.error('Doc upload failed', err);
    }
  };

  const submitModal = async () => {
    if (!inputValue.trim()) return;
    try {
      if (modalType === 'OFFER') {
        await actions.sendOffer(Number(inputValue));
      } else {
        await actions.sendNote(inputValue);
      }
      setModalType(null);
      setInputValue('');
    } catch (e) {
      console.error(e);
    }
  };

  const renderCard = ({ item }: { item: any }) => {
    const isMe = item.senderId === currentUser?.id;
    const timeStr = safeFormatTime(item.timestamp || item.createdAt);

    if (item.type === 'OFFER') {
      return (
        <View style={styles.cardContainer}>
          <View style={styles.offerCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardSender}>{isMe ? 'أنت' : otherPartyName}</Text>
              <Text style={styles.cardTime}>{timeStr}</Text>
            </View>
            <Text style={styles.offerAmount}>عرض مالي: {item.offerAmount} ج.م</Text>
            
            {!isMe && item.offerStatus === 'PENDING' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={() => actions.acceptOffer(item.id)}>
                  <Text style={styles.btnText}>قبول</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => actions.rejectOffer(item.id)}>
                  <Text style={styles.btnText}>رفض</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {item.offerStatus && item.offerStatus !== 'PENDING' && (
              <View style={[styles.badge, item.offerStatus === 'ACCEPTED' ? styles.badgeSuccess : (item.offerStatus === 'REJECTED' ? styles.badgeError : styles.badgeMuted)]}>
                <Text style={styles.badgeText}>
                  {item.offerStatus === 'ACCEPTED' ? 'تم القبول' : item.offerStatus === 'REJECTED' ? 'تم الرفض' : 'مسحوب'}
                </Text>
              </View>
            )}
            {item.status === 'pending' && <Text style={styles.pendingText}>جاري الإرسال...</Text>}
          </View>
        </View>
      );
    }

    if (item.attachmentType === 'DOCUMENT') {
      return (
        <View style={styles.cardContainer}>
          <View style={styles.noteCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardSender}>{isMe ? 'أنت' : otherPartyName}</Text>
              <Text style={styles.cardTime}>{timeStr}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <FileText size={24} color={colors.navy} />
              <View style={{ marginStart: 8 }}>
                <Text style={styles.docName}>{item.attachmentName || 'مستند'}</Text>
                {item.attachmentSize && <Text style={styles.docSize}>{Math.round(item.attachmentSize / 1024)} KB</Text>}
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.cardContainer}>
        <View style={styles.noteCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardSender}>{isMe ? 'أنت' : otherPartyName}</Text>
            <Text style={styles.cardTime}>{timeStr}</Text>
          </View>
          <Text style={styles.noteText}>{item.content}</Text>
          {item.status === 'pending' && <Text style={styles.pendingText}>جاري الإرسال...</Text>}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={timeline}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ref={(ref) => {
           setTimeout(() => ref?.scrollToEnd({ animated: true }), 100);
        }}
        onContentSizeChange={(w, h) => {
          // hack for auto scroll to bottom since it's not inverted
        }}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setModalType('OFFER')}>
          <DollarSign size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>إرسال عرض</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleDocumentPick}>
          <FileText size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>رفع مستند</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => setModalType('NOTE')}>
          <MessageSquare size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>إضافة ملاحظة</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!modalType} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalType === 'OFFER' ? 'إرسال عرض مالي' : 'إضافة ملاحظة'}</Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <X size={24} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType={modalType === 'OFFER' ? 'numeric' : 'default'}
              placeholder={modalType === 'OFFER' ? 'أدخل المبلغ (ج.م)' : 'اكتب ملاحظتك هنا...'}
              multiline={modalType === 'NOTE'}
              autoFocus
            />
            <TouchableOpacity style={styles.submitBtn} onPress={submitModal}>
              <Text style={styles.submitBtnText}>إرسال</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  headerInfo: { alignItems: 'center' },
  headerTitleText: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.ink },
  headerSubText: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  listContent: { padding: spacing.md, paddingBottom: 40 },
  cardContainer: { marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  cardSender: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  cardTime: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  offerCard: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.navy, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  noteCard: { backgroundColor: colors.paper, padding: spacing.md, borderRadius: radius.md },
  offerAmount: { fontFamily: fonts.bodySemibold, fontSize: 18, color: colors.navy, marginVertical: spacing.sm, textAlign: 'center' },
  noteText: { fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  docName: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },
  docSize: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  actionRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm, gap: spacing.sm },
  btn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.sm },
  acceptBtn: { backgroundColor: colors.signal },
  rejectBtn: { backgroundColor: colors.crimson },
  btnText: { color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 14 },
  badge: { alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: 12, marginTop: spacing.sm },
  badgeSuccess: { backgroundColor: '#E8F5E9' },
  badgeError: { backgroundColor: '#FFEBEE' },
  badgeMuted: { backgroundColor: '#F5F5F5' },
  badgeText: { fontFamily: fonts.bodySemibold, fontSize: 12 },
  pendingText: { fontSize: 12, color: colors.muted, fontStyle: 'italic', marginTop: 4, textAlign: 'right' },
  bottomBar: { flexDirection: 'row', padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.line, justifyContent: 'space-between' },
  actionButton: { flex: 1, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.sm, borderRadius: radius.md, marginHorizontal: 4 },
  actionButtonText: { color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 13, marginStart: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { fontFamily: fonts.bodySemibold, fontSize: 18, color: colors.ink },
  modalInput: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, fontFamily: fonts.body, fontSize: 16, minHeight: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: colors.navy, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.md },
  submitBtnText: { color: colors.white, fontFamily: fonts.bodySemibold, fontSize: 16 }
});
