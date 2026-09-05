import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { tokens } from '../../theme/tokens';
import { formatCurrency } from '../../utils/dateUtils';
import { useCompleteJob } from '../../hooks/useJobs';

export interface CompleteJobModalProps {
  visible: boolean;
  job: {
    id: string;
    title: string;
    agreedSalary?: number;
    salaryMin?: number;
  } | null;
  onClose: () => void;
  onSuccess: (job: any) => void;
}

export const CompleteJobModal: React.FC<CompleteJobModalProps> = ({
  visible,
  job,
  onClose,
  onSuccess,
}) => {
  const completeJobMutation = useCompleteJob();
  const loading = completeJobMutation.isPending ?? completeJobMutation.isLoading;

  const handleConfirm = async () => {
    if (!job) return;
    try {
      await completeJobMutation.mutateAsync(job.id);
      onSuccess(job);
      onClose();
    } catch (error: any) {
      Alert.alert('خطأ', error?.message || 'حدث خطأ أثناء إتمام المهمة');
    }
  };

  if (!job) return null;

  const amount = job.agreedSalary || job.salaryMin || 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={styles.dragHandle} />
              
              <Text style={styles.title}>✅ تأكيد إتمام المهمة</Text>
              
              <Text style={styles.jobTitle}>"{job.title}"</Text>
              
              <Text style={styles.feeLabel}>الأجر المتفق عليه:</Text>
              <Text style={styles.feeAmount}>{formatCurrency(amount)}</Text>
              
              <View style={styles.warningBox}>
                <View style={styles.warningHeader}>
                  <Text style={styles.warningIcon}>⚠</Text>
                  <Text style={styles.warningTitle}>بمجرد التأكيد سيتم:</Text>
                </View>
                <View style={styles.bulletPoints}>
                  <Text style={styles.bulletPoint}>• إغلاق المهمة نهائياً</Text>
                  <Text style={styles.bulletPoint}>• إرسال إشعار للمحامي</Text>
                  <Text style={styles.bulletPoint}>• طلب التقييم من الطرفين</Text>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={tokens.colors.white} />
                  ) : (
                    <Text style={styles.confirmButtonText}>نعم، تم الإتمام</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: tokens.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: tokens.colors.line,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: 20,
    color: tokens.colors.ink,
    textAlign: 'center',
  },
  jobTitle: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 15,
    color: tokens.colors.ink,
    textAlign: 'center',
    marginTop: 16,
  },
  feeLabel: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 13,
    color: tokens.colors.muted,
    textAlign: 'center',
    marginTop: 16,
  },
  feeAmount: {
    fontFamily: tokens.typography.fonts.mono,
    fontSize: 28,
    color: tokens.colors.gold,
    textAlign: 'center',
    marginTop: 4,
  },
  warningBox: {
    backgroundColor: tokens.colors.amberBg,
    borderColor: tokens.colors.amber,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningIcon: {
    color: tokens.colors.amber,
    fontSize: 20,
    marginHorizontal: 4,
  },
  warningTitle: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    color: tokens.colors.amber,
    fontSize: 14,
  },
  bulletPoints: {
    paddingHorizontal: 8,
  },
  bulletPoint: {
    fontFamily: tokens.typography.fonts.body,
    color: tokens.colors.ink,
    fontSize: 13,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 16,
    color: tokens.colors.muted,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: tokens.colors.navy,
  },
  confirmButtonText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 16,
    color: tokens.colors.white,
  },
});
