import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, I18nManager } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SettingsRow } from '../../components/SettingsRow';
import { tokens } from '../../theme/tokens';
import { useAuthStore } from '../../stores/authStore';
import { useSupportConversation } from '../../hooks/useSupport';

const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://example.com/terms';
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://example.com/privacy';

if (!__DEV__ && (TERMS_URL.includes('example.com') || PRIVACY_URL.includes('example.com'))) {
  console.error('[CRITICAL] Placeholder legal URLs detected in production build!');
}

export const SettingsScreen = ({ navigation }: any) => {
  const { logout, user } = useAuthStore();
  
  // Local state for notification preferences (stubbing backend)
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [offerNotifications, setOfferNotifications] = useState(true);
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');

  const { mutateAsync: getOrCreateSupport } = useSupportConversation();

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من رغبتك في تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل الخروج', style: 'destructive', onPress: () => logout() }
      ]
    );
  };


  const handleDeleteAccount = () => {
    Alert.alert(
      'حذف الحساب',
      'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف ملفك الشخصي نهائياً وإخفاء هويتك في المهام والتقييمات السابقة.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => {
          // Stub DELETE /users/me
          Alert.alert('تم حذف الحساب', 'لقد تم حذف حسابك بنجاح.');
          logout();
        }}
      ]
    );
  };

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const handleContactSupport = async () => {
    try {
      const convId = await getOrCreateSupport();
      navigation.navigate('Chat', { conversationId: convId, jobTitle: 'فريق الدعم', otherPartyName: 'الدعم الفني' });
    } catch (err: any) {
      Alert.alert('خطأ', 'لا يمكن فتح محادثة الدعم: ' + err.message);
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const translateTheme = (t: string) => t === 'system' ? 'النظام' : t === 'light' ? 'فاتح' : 'داكن';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الحساب</Text>
        <View style={styles.card}>
          <SettingsRow 
            label="تعديل الملف الشخصي" 
            onPress={() => navigation.navigate('EditProfile')} 
          />
          {(user as any)?.role === 'LAWYER' && (
            <SettingsRow 
              label="إدارة الاختصاصات القضائية" 
              onPress={() => navigation.navigate('MyCourts')} 
            />
          )}
          <SettingsRow 
            label="تغيير كلمة المرور" 
            onPress={() => navigation.navigate('ChangePassword')} 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الإشعارات</Text>
        <View style={styles.card}>
          <SettingsRow 
            label="تطابق الطلبات الجديدة" 
            isSwitch 
            switchValue={matchNotifications} 
            onSwitchChange={setMatchNotifications} 
          />
          <SettingsRow 
            label="الرسائل الجديدة" 
            isSwitch 
            switchValue={messageNotifications} 
            onSwitchChange={setMessageNotifications} 
          />
          <SettingsRow 
            label="تحديثات العروض" 
            isSwitch 
            switchValue={offerNotifications} 
            onSwitchChange={setOfferNotifications} 
          />
          <View style={styles.divider} />
          <SettingsRow 
            label="أذونات النظام" 
            subtitle="إدارة إشعارات النظام" 
            onPress={() => Linking.openSettings()} 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المظهر</Text>
        <View style={styles.card}>
          <SettingsRow 
            label="السمة" 
            value={translateTheme(theme)} 
            onPress={cycleTheme} 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الدعم والقانونية</Text>
        <View style={styles.card}>
          <SettingsRow 
            label="شروط الخدمة" 
            onPress={() => Linking.openURL(TERMS_URL)} 
          />
          <SettingsRow 
            label="سياسة الخصوصية" 
            onPress={() => Linking.openURL(PRIVACY_URL)} 
          />
          <SettingsRow 
            label="التواصل مع الدعم" 
            onPress={handleContactSupport} 
          />
        </View>
      </View>

      <View style={[styles.section, styles.dangerSection]}>
        <View style={styles.card}>
          <SettingsRow 
            label="تسجيل الخروج" 
            isDestructive 
            onPress={handleLogout} 
          />
          <SettingsRow 
            label="حذف الحساب" 
            isDestructive 
            onPress={handleDeleteAccount} 
          />
        </View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.paper,
  },
  content: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl * 2,
  },
  section: {
    marginBottom: tokens.spacing.xl,
  },
  dangerSection: {
    marginTop: tokens.spacing.lg,
  },
  sectionTitle: {
    fontSize: tokens.typography.sizes.xs,
    fontFamily: tokens.typography.fonts.body,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.muted,
    marginBottom: tokens.spacing.sm,
    marginStart: tokens.spacing.sm,
    letterSpacing: 0.5,
    textAlign: 'left' // For RTL it will naturally align right if I18nManager is set
  },
  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: 16,
    paddingHorizontal: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.line,
  }
});
