import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking, I18nManager } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SettingsRow } from '../../components/SettingsRow';
import { tokens } from '../../theme/tokens';
import { useAuthStore } from '../../stores/authStore';
import { apiClient as api } from '../../api/client';

export const SettingsScreen = ({ navigation }: any) => {
  const { logout, user } = useAuthStore();
  
  // Local state for notification preferences (stubbing backend)
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [offerNotifications, setOfferNotifications] = useState(true);
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'Are you sure you want to end your session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() }
      ]
    );
  };


  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. Your profile will be permanently removed, and your past jobs and reviews will be anonymized. Type "DELETE" in a real app to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // Stub DELETE /users/me
          Alert.alert('Account Deleted', 'Your account has been deleted.');
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
      let convId;
      try {
        const res = await api.get('/support/conversations/mine');
        convId = res.data.id;
      } catch (err: any) {
        if (err.response?.status === 404) {
          const createRes = await api.post('/support/conversations');
          convId = createRes.data.id;
        } else {
          throw err;
        }
      }
      // Navigate to ChatsTab -> Chat with support-specific params
      navigation.navigate('ChatsTab', {
        screen: 'Chat',
        params: { 
          conversationId: convId, 
          conversationType: 'SUPPORT' 
        }
      });
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', `Could not open support chat: ${error.message || JSON.stringify(error)}`);
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.card}>
          <SettingsRow 
            label="Edit Profile" 
            value={user?.name || 'Counselor'} 
            onPress={() => navigation.navigate('EditProfile')} 
          />
          <SettingsRow 
            label="Manage Jurisdictions" 
            onPress={() => navigation.navigate('MyCourts')} 
          />
          <SettingsRow 
            label="Change Password" 
            onPress={() => navigation.navigate('ChangePassword')} 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <SettingsRow 
            label="New Job Matches" 
            isSwitch 
            switchValue={matchNotifications} 
            onSwitchChange={setMatchNotifications} 
          />
          <SettingsRow 
            label="New Messages" 
            isSwitch 
            switchValue={messageNotifications} 
            onSwitchChange={setMessageNotifications} 
          />
          <SettingsRow 
            label="Offer Updates" 
            isSwitch 
            switchValue={offerNotifications} 
            onSwitchChange={setOfferNotifications} 
          />
          <SettingsRow 
            label="System Permissions"
            subtitle="Manage OS-level push notifications" 
            onPress={() => Linking.openSettings()} 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>APPEARANCE</Text>
        <View style={styles.card}>
          <SettingsRow 
            label="Theme" 
            value={capitalize(theme)} 
            onPress={cycleTheme} 
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SUPPORT & LEGAL</Text>
        <View style={styles.card}>
          <SettingsRow 
            label="Terms of Service" 
            onPress={() => Linking.openURL('https://example.com/terms')} 
          />
          <SettingsRow 
            label="Privacy Policy" 
            onPress={() => Linking.openURL('https://example.com/privacy')} 
          />
          <SettingsRow 
            label="Contact Support" 
            onPress={handleContactSupport} 
          />
        </View>
      </View>

      <View style={[styles.section, styles.dangerSection]}>
        <View style={styles.card}>
          <SettingsRow 
            label="Log Out" 
            isDestructive 
            onPress={handleLogout} 
          />
          <SettingsRow 
            label="Delete Account" 
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
