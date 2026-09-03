import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { tokens } from '../theme/tokens';
import { useAuthStore } from '../stores/authStore';
import { usePushNotifications } from '../hooks/usePushNotifications';

import { AuthNavigator } from './stacks/AuthNavigator';
import { VerificationNavigator } from './stacks/VerificationNavigator';
import { MainNavigator } from './stacks/MainTabNavigator';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { EditProfileScreen } from '../screens/main/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/main/ChangePasswordScreen';
import { PendingReviewScreen } from '../screens/verification/PendingReviewScreen';
import { ResubmitScreen } from '../screens/verification/ResubmitScreen';

import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

// ─── Navigator instances ─────────────────────────────────────────────────────
const RootStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

const defaultScreenOptions = {
  headerStyle: { backgroundColor: tokens.colors.paper },
  headerTintColor: tokens.colors.ink,
  headerTitleStyle: { fontFamily: tokens.typography.fonts.displayBold, fontSize: 18 },
  headerShadowVisible: false,
};

const SettingsNavigator = () => (
  <SettingsStack.Navigator screenOptions={defaultScreenOptions}>
    <SettingsStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'الإعدادات' }} />
    <SettingsStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'تعديل الملف الشخصي' }} />
    <SettingsStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'تغيير كلمة المرور' }} />
  </SettingsStack.Navigator>
);

// ─── Deep linking config ─────────────────────────────────────────────────────
const isExpoGo = Constants.appOwnership === 'expo';
const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'wakeel://'],
  config: {
    screens: {
      MainAppFallback: {
        screens: {
          ChatsTab: {
            screens: {
              Chat: 'chat/:id',
            },
          },
          JobsTab: {
            screens: {
              JobDetail: 'job/:id',
            },
          },
        },
      },
    },
  },
  async getInitialURL() {
    let url = await Linking.getInitialURL();
    if (url != null) {
      return url;
    }

    if (!isExpoGo) {
      const Notifications = require('expo-notifications');
      const response = await Notifications.getLastNotificationResponseAsync();
      const data = response?.notification.request.content.data;

      if (data?.url) return data.url;
      if (data?.conversationId) return `${prefix}chat/${data.conversationId}`;
      if (data?.jobId) return `${prefix}job/${data.jobId}`;
    }

    return null;
  },
  subscribe(listener: (url: string) => void) {
    const onReceiveURL = ({ url }: { url: string }) => listener(url);
    const linkingSubscription = Linking.addEventListener('url', onReceiveURL);

    let subscription: any = null;
    if (!isExpoGo) {
      const Notifications = require('expo-notifications');
      subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const data = response.notification.request.content.data;
        if (data?.url) {
          listener(data.url);
        } else if (data?.conversationId) {
          listener(`${prefix}chat/${data.conversationId}`);
        } else if (data?.jobId) {
          listener(`${prefix}job/${data.jobId}`);
        }
      });
    }

    return () => {
      linkingSubscription.remove();
      if (subscription) {
        subscription.remove();
      }
    };
  },
};

// ─── Root Navigator ──────────────────────────────────────────────────────────
// Three-state gate:
//   1. Not authenticated        → AuthNavigator
//   2. Authenticated, unverified → VerificationNavigator / PendingReview / Resubmit
//   3. Verified (APPROVED)       → MainTabNavigator

export const RootNavigator = () => {
  const { isAuthenticated, isLoading, hydrate, user } = useAuthStore();
  usePushNotifications();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Loading spinner while auth state hydrates
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.paper }}>
        <ActivityIndicator size="large" color={tokens.colors.signal} />
      </View>
    );
  }

  // ── State 1: Not authenticated ──────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <NavigationContainer linking={linking as any}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        </RootStack.Navigator>
      </NavigationContainer>
    );
  }

  // ── State 2: Authenticated but NOT verified ─────────────────────────────
  const vs = user?.verificationStatus;

  if (vs === 'UNVERIFIED' || vs === 'PENDING_UPLOAD') {
    return (
      <NavigationContainer linking={linking as any}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Verification" component={VerificationNavigator} />
          <RootStack.Screen name="SettingsStack" component={SettingsNavigator} />
        </RootStack.Navigator>
      </NavigationContainer>
    );
  }

  if (vs === 'PENDING') {
    return (
      <NavigationContainer linking={linking as any}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="PendingReview" component={PendingReviewScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
    );
  }

  if (vs === 'REJECTED') {
    return (
      <NavigationContainer linking={linking as any}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Resubmit" component={ResubmitScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
    );
  }

  // ── State 3: Verified (APPROVED) — full app ────────────────────────────
  return (
    <NavigationContainer linking={linking as any}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainAppFallback" component={MainNavigator} />
        <RootStack.Screen name="SettingsStack" component={SettingsNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
