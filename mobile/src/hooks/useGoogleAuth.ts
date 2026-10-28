import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants, { ExecutionEnvironment } from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  // Always pass client IDs (with a safe fallback) so Google.useAuthRequest's
  // invariantClientId check never throws a Render Error in Expo Go or when an env var is missing.
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: androidClientId || webClientId || 'disabled-in-expo-go',
    iosClientId: iosClientId || webClientId || 'disabled-in-expo-go',
    webClientId: webClientId || 'disabled-in-expo-go',
  });

  return { request, response, promptAsync, isExpoGo };
}
