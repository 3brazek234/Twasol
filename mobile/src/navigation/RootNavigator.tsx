import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { tokens } from '../theme/tokens';
import { useAuthStore } from '../stores/authStore';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { CompleteProfileScreen } from '../screens/auth/CompleteProfileScreen';

import { AuthNavigator } from './stacks/AuthNavigator';
import { VerificationNavigator } from './stacks/VerificationNavigator';
import { MainNavigator } from './stacks/MainTabNavigator';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { EditProfileScreen } from '../screens/main/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/main/ChangePasswordScreen';
import { AdminVerificationQueueScreen } from '../screens/admin/AdminVerificationQueueScreen';
import { PendingReviewScreen } from '../screens/verification/PendingReviewScreen';
import { ResubmitScreen } from '../screens/verification/ResubmitScreen';
import { LegalScreen } from '../screens/main/LegalScreen';
import { NegotiationScreen } from '../screens/main/NegotiationScreen';

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
    <SettingsStack.Screen name="AdminVerificationQueue" component={AdminVerificationQueueScreen} options={{ title: 'طلبات التوثيق' }} />
    <SettingsStack.Screen name="AdminVerificationDetail" component={require('../screens/admin/AdminVerificationDetailScreen').AdminVerificationDetailScreen} options={{ headerShown: false }} />
    <SettingsStack.Screen name="AdminSubscriptionQueue" component={require('../screens/admin/AdminSubscriptionQueueScreen').AdminSubscriptionQueueScreen} options={{ title: 'طلبات الاشتراكات' }} />
    <SettingsStack.Screen name="AdminSubscriptionDetail" component={require('../screens/admin/AdminSubscriptionDetailScreen').AdminSubscriptionDetailScreen} options={{ headerShown: false }} />
    <SettingsStack.Screen name="AdminAnalytics" component={require('../screens/admin/AdminAnalyticsScreen').AdminAnalyticsScreen} options={{ title: 'مؤشرات الأداء (الإدارة)' }} />
    <SettingsStack.Screen name="Subscription" component={require('../screens/main/SubscriptionScreen').SubscriptionScreen} options={{ title: 'تفعيل الاشتراك' }} />
    <SettingsStack.Screen name="MyCourts" component={require('../screens/main/MyCourtsScreen').MyCourtsScreen} options={{ title: 'الاختصاصات القضائية' }} />
    <SettingsStack.Screen name="Legal" component={LegalScreen} options={({ route }: any) => ({ title: route.params?.type === 'terms' ? 'شروط الخدمة' : 'سياسة الخصوصية' })} />
    <SettingsStack.Screen name="SupportChat" component={NegotiationScreen} options={{ title: 'الدعم الفني' }} />
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
              JobCompletion: 'job-completion/:jobId',
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
      if (data?.type === 'JOB_COMPLETED' && data?.jobId) {
        return `${prefix}job-completion/${data.jobId}?fee=${data.fee || 0}&posterId=${data.posterId || ''}&jobTitle=${encodeURIComponent(data.jobTitle || '')}`;
      }
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
        } else if (data?.type === 'JOB_COMPLETED' && data?.jobId) {
          listener(`${prefix}job-completion/${data.jobId}?fee=${data.fee || 0}&posterId=${data.posterId || ''}&jobTitle=${encodeURIComponent(data.jobTitle || '')}`);
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
  const { isAuthenticated, isLoading, hydrate, user, hasSeenOnboarding } = useAuthStore();
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
  // ── State 2: Authenticated but profile incomplete (Google sign-up) ────
  //    Google-registered users have no barNumber yet — collect it before
  //    proceeding to verification. Email/password users skip this gate
  //    because they always provide barNumber during registration.
  if (isAuthenticated && user && !user.barNumber) {
    return (
      <NavigationContainer linking={linking as any}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
    );
  }

  // ── State 3: Authenticated but NOT verified ─────────────────────────────
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
      <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName={hasSeenOnboarding ? 'MainAppFallback' : 'OnboardingWalkthrough'}>
        <RootStack.Screen name="OnboardingWalkthrough" component={require('../screens/main/OnboardingWalkthroughScreen').OnboardingWalkthroughScreen} />
        <RootStack.Screen name="MainAppFallback" component={MainNavigator} />
        <RootStack.Screen name="SettingsStack" component={SettingsNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
