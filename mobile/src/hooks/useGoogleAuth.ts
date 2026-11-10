import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

function getReverseClientIdRedirectUri(clientId?: string): string | undefined {
  if (!clientId || !clientId.endsWith('.apps.googleusercontent.com')) {
    return undefined;
  }
  const guid = clientId.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${guid}:/oauthredirect`;
}

export function useGoogleAuth() {
  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  const nativeClientId =
    Platform.OS === 'android'
      ? androidClientId
      : Platform.OS === 'ios'
        ? iosClientId || androidClientId
        : undefined;

  const nativeRedirectUri =
    Platform.OS !== 'web' && !isExpoGo
      ? getReverseClientIdRedirectUri(nativeClientId)
      : undefined;

  // Always pass client IDs (with a safe fallback) so Google.useAuthRequest's
  // invariantClientId check never throws a Render Error in Expo Go or when an env var is missing.
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: androidClientId || webClientId || 'disabled-in-expo-go',
    iosClientId: iosClientId || androidClientId || webClientId || 'disabled-in-expo-go',
    webClientId: webClientId || 'disabled-in-expo-go',
    ...(nativeRedirectUri ? { redirectUri: nativeRedirectUri } : {}),
  });

  return { request, response, promptAsync, isExpoGo };
}
