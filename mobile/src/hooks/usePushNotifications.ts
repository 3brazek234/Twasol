import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import Constants from 'expo-constants';

/**
 * Safe push-notification hook.
 *
 * expo-notifications requires a native runtime that may not exist in
 * Expo Go, on the web, or in a dev-client built without the module.
 * We lazily require the native modules inside the effect so the rest
 * of the app boots normally even when the runtime isn't ready.
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!isAuthenticated) return;

    // Skip in Expo Go (SDK 53+ removed push notification support from Expo Go)
    if (Constants.appOwnership === 'expo') {
      console.log('[Push] Running in Expo Go. Push notifications are disabled. Use a development build (EAS) to test push notifications.');
      return;
    }

    let Notifications: any;
    let Device: any;

    try {
      Notifications = require('expo-notifications');
      Device = require('expo-device');
    } catch {
      console.log('[Push] expo-notifications native module not available, skipping.');
      return;
    }

    // If we get here the native modules loaded successfully
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch {
      console.log('[Push] setNotificationHandler failed, skipping.');
      return;
    }

    let receivedSub: any;
    let responseSub: any;

    (async () => {
      try {
        // Android channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        if (!Device.isDevice) return;

        // Permissions
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        // Token
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;

        const tokenData = projectId
          ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
          : (await Notifications.getExpoPushTokenAsync()).data;

        setExpoPushToken(tokenData);

        // Send to backend
        apiClient.post('/users/push-token', { token: tokenData }).catch(() => {});

        // Listeners
        receivedSub = Notifications.addNotificationReceivedListener(() => {});
        responseSub = Notifications.addNotificationResponseReceivedListener((response: any) => {
          console.log('[Push] tapped:', response.notification.request.content.data);
        });
      } catch (e: any) {
        console.log('[Push] registration error:', e.message || e);
      }
    })();

    return () => {
      try {
        if (receivedSub) receivedSub.remove();
        if (responseSub) responseSub.remove();
      } catch {}
    };
  }, [isAuthenticated]);

  return { expoPushToken };
}
