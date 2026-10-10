import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { tokens } from '../../theme/tokens';
import { useForgotPassword } from '../../hooks/useAuth';
import { ChevronRight } from 'lucide-react-native';

export const ForgotPasswordScreen = ({ navigation, route }: any) => {
  const initialEmail = route.params?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const { mutate: requestReset, isPending } = useForgotPassword();

  const handleSendCode = () => {
    if (!email) return;
    requestReset(email, {
      onSuccess: () => {
        navigation.navigate('OtpVerification', { email });
      }
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight size={24} color={tokens.colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>نسيت كلمة المرور</Text>
      </View>

      <Text style={styles.subtitle}>أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>البريد الإلكتروني</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="example@wakeel.com"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isPending}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, (!email || isPending) && styles.buttonDisabled]}
        onPress={handleSendCode}
        disabled={!email || isPending}
      >
        {isPending ? (
          <ActivityIndicator color={tokens.colors.white} />
        ) : (
          <Text style={styles.buttonText}>إرسال الرمز</Text>
        )}
      </TouchableOpacity>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  backButton: {
    padding: tokens.spacing.xs,
    marginLeft: tokens.spacing.md,
  },
  title: {
    fontFamily: tokens.typography.fonts.displayBold,
    fontSize: tokens.typography.sizes.xxl,
    color: tokens.colors.ink,
    textAlign: 'right',
    flex: 1,
  },
  subtitle: {
    fontFamily: tokens.typography.fonts.body,
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.slate,
    textAlign: 'right',
    marginBottom: tokens.spacing.xl,
  },
  formGroup: {
    marginBottom: tokens.spacing.xl,
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
  button: {
    backgroundColor: tokens.colors.navy,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    alignItems: 'center',
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
