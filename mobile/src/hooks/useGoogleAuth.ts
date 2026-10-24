import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const isExpoGo = Constants.appOwnership === 'expo';

  const [request, response, promptAsync] = Google.useAuthRequest(
    isExpoGo
      ? {}
      : {
          androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        }
  );

  return { request, response, promptAsync, isExpoGo };
}
