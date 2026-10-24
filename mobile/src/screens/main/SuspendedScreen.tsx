import React from 'react';
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';
import { ShieldX } from 'lucide-react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';

export const SuspendedScreen = () => {
  const { colors } = useTheme();

  const contactSupport = async () => {
    const url = 'whatsapp://send?phone=+201154812698';
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        Alert.alert('تنبيه', 'يرجى التأكد من تثبيت تطبيق واتساب على جهازك للتواصل مع الدعم.');
      }
    } catch (error) {
      Alert.alert(
        'تعذر التواصل مع الدعم',
        error instanceof Error ? error.message : 'يرجى المحاولة مجدداً لاحقاً.',
      );
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: tokens.spacing.xl }}>
        <ShieldX size={56} color={colors.crimson} />
        <Text
          style={{
            fontFamily: tokens.typography.fonts.displayBold,
            fontSize: tokens.typography.sizes.xl,
            color: colors.ink,
            textAlign: 'center',
            marginTop: tokens.spacing.lg,
          }}
        >
          حسابك موقوف
        </Text>
        <Text
          style={{
            fontFamily: tokens.typography.fonts.body,
            fontSize: tokens.typography.sizes.base,
            color: colors.muted,
            textAlign: 'center',
            marginTop: tokens.spacing.sm,
            lineHeight: tokens.typeScale.body.lineHeight,
          }}
        >
          تم إيقاف حسابك مؤقتاً. يرجى التواصل مع الدعم الفني لمعرفة السبب واستعادة الوصول.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={contactSupport}
          style={{
            backgroundColor: colors.signal,
            borderRadius: tokens.radius.lg,
            paddingHorizontal: tokens.spacing.lg,
            paddingVertical: tokens.spacing.sm,
            marginTop: tokens.spacing.lg,
          }}
        >
          <Text style={{
            fontFamily: tokens.typography.fonts.bodySemibold,
            fontSize: tokens.typography.sizes.sm,
            color: colors.white,
          }}>
            تواصل مع الدعم
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};
