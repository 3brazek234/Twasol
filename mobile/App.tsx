import React, { useEffect } from 'react';
import { I18nManager, LogBox } from 'react-native';
import * as Updates from 'expo-updates';

// Must run before any render — forces native RTL layout engine
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);


import './global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { EBGaramond_600SemiBold, EBGaramond_700Bold } from '@expo-google-fonts/eb-garamond';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-arabic';
import { Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { ThemeProvider } from './src/theme/ThemeContext';
import { tokens } from './src/theme/tokens';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: tokens.colors.verdant, backgroundColor: tokens.colors.white }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: tokens.typography.sizes.base,
        fontFamily: tokens.typography.fonts.bodySemibold,
        color: tokens.colors.ink
      }}
      text2Style={{
        fontSize: tokens.typography.sizes.sm,
        fontFamily: tokens.typography.fonts.body,
        color: tokens.colors.muted
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: tokens.colors.crimson, backgroundColor: tokens.colors.white }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: tokens.typography.sizes.base,
        fontFamily: tokens.typography.fonts.bodySemibold,
        color: tokens.colors.ink
      }}
      text2Style={{
        fontSize: tokens.typography.sizes.sm,
        fontFamily: tokens.typography.fonts.body,
        color: tokens.colors.muted
      }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: tokens.colors.navy, backgroundColor: tokens.colors.white }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: tokens.typography.sizes.base,
        fontFamily: tokens.typography.fonts.bodySemibold,
        color: tokens.colors.ink
      }}
      text2Style={{
        fontSize: tokens.typography.sizes.sm,
        fontFamily: tokens.typography.fonts.body,
        color: tokens.colors.muted
      }}
    />
  )
};

// Suppress known deprecation warnings from 3rd party libraries
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
]);

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    EBGaramond_600SemiBold,
    EBGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    IBMPlexMono_500Medium,
    Amiri_400Regular,
    Amiri_700Bold,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  const [timedOut, setTimedOut] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 4000); // 4 second fallback timeout to prevent locking on blank screen
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError || timedOut) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, timedOut]);

  if (!fontsLoaded && !fontError && !timedOut) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <RootNavigator />
            <Toast config={toastConfig} />
          </QueryClientProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
