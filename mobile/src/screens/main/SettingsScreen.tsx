import React, { useState } from 'react';
import { Modal, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, I18nManager } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SettingsRow } from '../../components/SettingsRow';
import { tokens } from '../../theme/tokens';
import { useAuthStore } from '../../stores/authStore';

// Legal URLs have been moved to native LegalScreen

export const SettingsScreen = ({ navigation }: any) => {
  const [showModeModal, setShowModeModal] = useState(false);
  const [updatingMode, setUpdatingMode] = useState(false);
  
  const handleUpdateMode = async (mode: "GIG" | "HIRING" | "BOTH") => {
    setUpdatingMode(true);
    try {
      await useAuthStore.getState().updateAccountMode(mode);
      setShowModeModal(false);
    } catch (err) {
      Alert.alert("خطأ", "فشل في تحديث نوع الحساب");
    } finally {
      setUpdatingMode(false);
    }
  };

  const { logout, user } = useAuthStore();
  
  // Local state for notification preferences (stubbing backend)
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [offerNotifications, setOfferNotifications] = useState(true);
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');


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
      // Egyptian number format: +20 followed by the number without the leading 0
      const phoneNumber = '+201154812698';
      const url = `whatsapp://send?phone=${phoneNumber}`;
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('تنبيه', 'يرجى التأكد من تثبيت تطبيق واتساب على جهازك للتواصل مع الدعم.');
      }
    } catch (err: any) {
      Alert.alert('خطأ', 'لا يمكن فتح تطبيق واتساب: ' + err.message);
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const translateTheme = (t: string) => t === 'system' ? 'النظام' : t === 'light' ? 'فاتح' : 'داكن';

  return (
    <ScreenContainer scroll={true}>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الحساب</Text>
        <View style={styles.card}>
          <SettingsRow 
            label="نوع الحساب" 
            value={user?.accountMode === "GIG" ? "أبحث عن عمل" : user?.accountMode === "HIRING" ? "أبحث عن محامي" : "كلا الخيارين"} 
            onPress={() => setShowModeModal(true)} 
          />
          <SettingsRow 
            label="تعديل الملف الشخصي" 
            onPress={() => navigation.navigate('SettingsStack', { screen: 'EditProfile' })} 
          />
          <SettingsRow
            label="حالة الاشتراك"
            value={user?.subscriptionStatus === 'ACTIVE' ? 'نشط' : 'يتطلب تفعيل'}
            onPress={() => navigation.navigate('SettingsStack', { screen: 'Subscription' })}
          />
          {(user as any)?.role === 'LAWYER' && (
            <SettingsRow 
              label="إدارة الاختصاصات القضائية" 
              onPress={() => navigation.navigate('SettingsStack', { screen: 'MyCourts' })} 
            />
          )}
          <SettingsRow 
            label="تغيير كلمة المرور" 
            onPress={() => navigation.navigate('SettingsStack', { screen: 'ChangePassword' })} 
          />
        </View>
      </View>

      {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإدارة</Text>
          <View style={styles.card}>
            <SettingsRow 
              label="لوحة المؤشرات والإحصائيات" 
              onPress={() => navigation.navigate('SettingsStack', { screen: 'AdminAnalytics' })} 
            />
            <SettingsRow 
              label="مراجعة طلبات التوثيق" 
              onPress={() => navigation.navigate('SettingsStack', { screen: 'AdminVerificationQueue' })} 
            />
            <SettingsRow 
              label="مراجعة طلبات الاشتراك" 
              onPress={() => navigation.navigate('SettingsStack', { screen: 'AdminSubscriptionQueue' })} 
            />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الإشعارات</Text>
        <View style={styles.card}>
          <SettingsRow 
            label="تطابق المهام الجديدة" 
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
        <Text style={styles.sectionTitle}>المساعدة والدعم</Text>
        <View style={styles.card}>
          <SettingsRow label="كيف تعمل المنصة؟" onPress={() => navigation.navigate('OnboardingWalkthrough', { fromSettings: true })} />
          <SettingsRow label="الدعم الفني" onPress={() => navigation.navigate('SettingsStack', { screen: 'SupportChat' })} />
          <SettingsRow label="التواصل عبر واتساب" onPress={handleContactSupport} />
          <SettingsRow label="شروط الخدمة" onPress={() => navigation.navigate('SettingsStack', { screen: 'Legal', params: { type: 'terms' } })} />
          <SettingsRow label="سياسة الخصوصية" onPress={() => navigation.navigate('SettingsStack', { screen: 'Legal', params: { type: 'privacy' } })} />
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


      <Modal visible={showModeModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: tokens.colors.white, borderRadius: 16, padding: 24 }}>
            <Text style={{ fontFamily: tokens.typography.fonts.displayBold, fontSize: 18, color: tokens.colors.ink, textAlign: "center", marginBottom: 24 }}>اختر نوع الحساب</Text>
            
            <TouchableOpacity disabled={updatingMode} onPress={() => handleUpdateMode("GIG")} style={{ padding: 16, backgroundColor: tokens.colors.paper, borderRadius: 8, marginBottom: 12 }}>
              <Text style={{ fontFamily: tokens.typography.fonts.bodySemibold, textAlign: "center" }}>أبحث عن عمل (محامي)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity disabled={updatingMode} onPress={() => handleUpdateMode("HIRING")} style={{ padding: 16, backgroundColor: tokens.colors.paper, borderRadius: 8, marginBottom: 12 }}>
              <Text style={{ fontFamily: tokens.typography.fonts.bodySemibold, textAlign: "center" }}>أبحث عن محامي (موكِّل)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity disabled={updatingMode} onPress={() => handleUpdateMode("BOTH")} style={{ padding: 16, backgroundColor: tokens.colors.paper, borderRadius: 8, marginBottom: 24 }}>
              <Text style={{ fontFamily: tokens.typography.fonts.bodySemibold, textAlign: "center" }}>كلا الخيارين</Text>
            </TouchableOpacity>

            <TouchableOpacity disabled={updatingMode} onPress={() => setShowModeModal(false)} style={{ padding: 16 }}>
              <Text style={{ fontFamily: tokens.typography.fonts.bodySemibold, textAlign: "center", color: tokens.colors.muted }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
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
