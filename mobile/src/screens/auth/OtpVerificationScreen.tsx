import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { tokens } from '../../theme/tokens';
import { useVerifyOtp, useForgotPassword } from '../../hooks/useAuth';
import { ChevronRight } from 'lucide-react-native';

export const OtpVerificationScreen = ({ navigation, route }: any) => {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  
  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp();
  const { mutate: requestReset, isPending: isResending } = useForgotPassword();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = () => {
    if (otp.length !== 6) return;
    verifyOtp({ email, otp }, {
      onSuccess: (data: any) => {
        navigation.navigate('ResetPassword', { resetToken: data.data.resetToken });
      }
    });
  };

  const handleResend = () => {
    if (countdown > 0 || isResending) return;
    requestReset(email, {
      onSuccess: () => setCountdown(60)
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight size={24} color={tokens.colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>أدخل رمز التحقق</Text>
      </View>

      <Text style={styles.subtitle}>تم إرسال رمز مكون من 6 أرقام إلى {email}</Text>

      <View style={styles.formGroup}>
        <TextInput
          style={styles.input}
          value={otp}
          onChangeText={(val) => setOtp(val.replace(/[^0-9]/g, ''))}
          placeholder="000000"
          keyboardType="numeric"
          maxLength={6}
          editable={!isVerifying}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, (otp.length !== 6 || isVerifying) && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={otp.length !== 6 || isVerifying}
      >
        {isVerifying ? (
          <ActivityIndicator color={tokens.colors.white} />
        ) : (
          <Text style={styles.buttonText}>تحقق</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.resendContainer} 
        onPress={handleResend}
        disabled={countdown > 0 || isResending}
      >
        <Text style={[styles.resendText, (countdown > 0 || isResending) && styles.resendTextDisabled]}>
          {isResending ? 'جاري الإرسال...' : countdown > 0 ? `إعادة الإرسال بعد ${countdown} ثانية` : 'إعادة إرسال الرمز'}
        </Text>
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
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    fontFamily: tokens.typography.fonts.mono,
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: 16,
    color: tokens.colors.ink,
    backgroundColor: tokens.colors.white,
  },
  button: {
    backgroundColor: tokens.colors.navy,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: tokens.colors.white,
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.base,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontFamily: tokens.typography.fonts.bodySemibold,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.navy,
  },
  resendTextDisabled: {
    color: tokens.colors.slate,
  },
});
