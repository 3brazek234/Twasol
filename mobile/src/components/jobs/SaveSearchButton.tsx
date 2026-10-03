import React, { useState } from 'react';
import { TouchableOpacity, Text, View, TextInput, Alert, Modal, StyleSheet } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { useCreateSavedSearch } from '../../hooks/useSavedSearches';
import { ContextualTooltip } from '../ContextualTooltip';

interface SaveSearchButtonProps {
  criteria: Record<string, any>;
}

export const SaveSearchButton: React.FC<SaveSearchButtonProps> = ({ criteria }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const { mutate, isPending } = useCreateSavedSearch();

  const handleSave = () => {
    if (!name.trim()) return;
    mutate(
      { name, criteria },
      {
        onSuccess: () => {
          setModalVisible(false);
          setName('');
          Alert.alert('تم الحفظ', 'تم حفظ البحث بنجاح');
        },
        onError: () => {
          Alert.alert('خطأ', 'تعذر حفظ البحث');
        }
      }
    );
  };

  const isActive = Object.values(criteria).some(v => v !== undefined && v !== '');

  if (!isActive) return null;

  return (
    <ContextualTooltip
      storageKey="@wakeel_tip_saved_search_v1"
      illustration="jobs"
      inline
      message="احفظ هذه التصفية لتصلك تنبيهات عند ظهور مهام مناسبة."
    >
      <>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setModalVisible(true)}
        >
          <Bookmark size={16} color={tokens.colors.signal} />
          <Text style={styles.text}>حفظ البحث</Text>
        </TouchableOpacity>

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>حفظ البحث</Text>
              <TextInput
                style={styles.input}
                placeholder="اسم البحث (مثال: طلبات جنايات القاهرة)"
                value={name}
                onChangeText={setName}
                autoFocus
              />
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isPending || !name.trim()}>
                  <Text style={styles.saveText}>{isPending ? 'جاري الحفظ...' : 'حفظ'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    </ContextualTooltip>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.colors.signal + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: {
    color: tokens.colors.signal,
    fontFamily: tokens.typography.fonts.bodyMedium,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: tokens.colors.white,
    padding: 24,
    borderRadius: tokens.radius.xl,
    width: '100%',
  },
  modalTitle: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: 18,
    color: tokens.colors.ink,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: tokens.typography.fonts.bodyMedium,
    fontSize: 16,
    color: tokens.colors.ink,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  cancelText: {
    color: tokens.colors.muted,
    fontFamily: tokens.typography.fonts.bodySemibold,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: tokens.colors.signal,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: tokens.radius.md,
  },
  saveText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
  },
});
