import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { tokens } from '../../theme/tokens';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  body?: string;
  confirmText: string;
  cancelText: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  body,
  confirmText,
  cancelText,
  confirmColor = tokens.colors.navy,
  onConfirm,
  onCancel,
  loading = false,
  children,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={styles.dragHandle} />
              
              <Text style={styles.title}>{title}</Text>
              
              {body ? <Text style={styles.body}>{body}</Text> : null}
              
              {children}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>{cancelText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.confirmButton, { backgroundColor: confirmColor }]}
                  onPress={onConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={tokens.colors.paper} />
                  ) : (
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD9D0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: 20,
    color: tokens.colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: 14,
    color: tokens.colors.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    height: 48,
    borderRadius: 8,
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
    color: tokens.colors.ink,
  },
  confirmButton: {
    flex: 2,
  },
  confirmButtonText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
