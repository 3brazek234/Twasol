import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  // Extract the reverse client ID scheme for the current platform
  let scheme = 'wakeel';
  if (Platform.OS === 'android' && androidClientId) {
    scheme = `com.googleusercontent.apps.${androidClientId.replace('.apps.googleusercontent.com', '')}`;
  } else if (Platform.OS === 'ios' && iosClientId) {
    scheme = `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`;
  }

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId,
    androidClientId,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: makeRedirectUri({
      scheme,
      path: Platform.OS === 'web' ? '' : undefined, // Let native handle the exact path Google expects (usually /oauth2redirect)
    }),
  });

  return { request, response, promptAsync };
}
