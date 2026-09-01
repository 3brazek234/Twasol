import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { apiClient } from '../api/client';

const isExpoGo = Constants.appOwnership === 'expo';

export interface PushNotificationState {
  expoPushToken?: any;
  notification?: any;
}

export const usePushNotifications = (): PushNotificationState => {
  const [expoPushToken, setExpoPushToken] = useState<any>();
  const [notification, setNotification] = useState<any>();

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    if (isExpoGo) return;

    // Lazy-load expo-notifications only outside Expo Go
    const Notifications = require('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldShowAlert: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    async function register() {
      let token;
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const projectId = Constants?.expoConfig?.extra?.eas?.projectId
          ?? Constants?.easConfig?.projectId;

        token = await Notifications.getExpoPushTokenAsync({ projectId });

        try {
          await apiClient.post('/users/push-token', { token: token.data });
        } catch {
          // ignore
        }
      }

      return token;
    }

    register().then(setExpoPushToken);

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (n: any) => setNotification(n),
    );
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      () => {},
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeSubscription(responseListener.current);
      }
    };
  }, []);

  return { expoPushToken, notification };
};
