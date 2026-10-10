import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { tokens } from '../../theme/tokens';
import { useResetPassword } from '../../hooks/useAuth';

export const ResetPasswordScreen = ({ navigation, route }: any) => {
  const { resetToken } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showError, setShowError] = useState('');
  
  const { mutate: resetPassword, isPending } = useResetPassword();

  const handleReset = () => {
    setShowError('');
    if (newPassword.length < 8) {
      setShowError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setShowError('كلمة المرور غير متطابقة');
      return;
    }

    resetPassword({ resetToken, newPassword }, {
      onSuccess: () => {
        Alert.alert('نجاح', 'تم إعادة تعيين كلمة المرور بنجاح');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>كلمة مرور جديدة</Text>
      </View>

      <Text style={styles.subtitle}>أدخل كلمة المرور الجديدة أدناه.</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>كلمة المرور الجديدة</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="••••••••"
          secureTextEntry
          editable={!isPending}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>تأكيد كلمة المرور</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry
          editable={!isPending}
        />
      </View>

      {!!showError && (
        <Text style={styles.errorText}>{showError}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, (!newPassword || !confirmPassword || isPending) && styles.buttonDisabled]}
        onPress={handleReset}
        disabled={!newPassword || !confirmPassword || isPending}
      >
        {isPending ? (
          <ActivityIndicator color={tokens.colors.white} />
        ) : (
          <Text style={styles.buttonText}>تغيير كلمة المرور</Text>
        )}
      </TouchableOpacity>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: tokens.spacing.lg,
  },
  title: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: tokens.typography.sizes.xxl,
    color: tokens.colors.ink,
    textAlign: 'right',
  },
  subtitle: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.slate,
    textAlign: 'right',
    marginBottom: tokens.spacing.xl,
  },
  formGroup: {
    marginBottom: tokens.spacing.lg,
  },
  label: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.ink,
    textAlign: 'right',
    marginBottom: tokens.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.base,
    textAlign: 'right',
    color: tokens.colors.ink,
    backgroundColor: tokens.colors.white,
  },
  errorText: {
    color: tokens.colors.crimson,
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.sm,
    textAlign: 'right',
    marginBottom: tokens.spacing.md,
  },
  button: {
    backgroundColor: tokens.colors.navy,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    alignItems: 'center',
    marginTop: tokens.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.base,
  },
});
