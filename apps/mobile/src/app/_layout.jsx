import { useAuth } from "@/utils/auth/useAuth";
import * as SecureStore from 'expo-secure-store';
import { authKey } from '@/utils/auth/store';
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthModal } from "@/utils/auth/useAuthModal";
import * as LocalAuthentication from 'expo-local-authentication';
import { loadPreferences } from '@/utils/preferences';
import { ThemeProvider } from '@/utils/theme/ThemeProvider';
import { View, Text, TouchableOpacity } from 'react-native';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initiate, isReady } = useAuth();
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [checkingLock, setCheckingLock] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const prefs = await loadPreferences();
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const storedAuth = await SecureStore.getItemAsync(authKey);

        // If biometric lock is enabled AND we have auth to unlock, gate on biometrics first
        if (prefs.biometricLock && hasHardware && isEnrolled && storedAuth) {
          const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock with Biometrics' });
          if (res.success) {
            await initiate();
            setNeedsUnlock(false);
          } else {
            setNeedsUnlock(true);
          }
        } else {
          // No lock or no enrolled biometrics or no saved session -> just initialize auth normally
          await initiate();
          setNeedsUnlock(false);
        }
      } catch (e) {
        // On any error, continue without lock
        await initiate();
        setNeedsUnlock(false);
      } finally {
        setCheckingLock(false);
        SplashScreen.hideAsync();
      }
    })();
  }, [initiate]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          {needsUnlock ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>App Locked</Text>
              <Text style={{ color: '#6B7280', marginBottom: 20, textAlign: 'center' }}>Authenticate to continue</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }}
                onPress={async () => {
                  const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock with Biometrics' });
                  if (res.success) {
                    setNeedsUnlock(false);
                    // Load stored session into auth store so user is "signed in" immediately
                    await initiate();
                  }
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Unlock</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
                <Stack.Screen name="voice-verification" options={{ headerShown: false }} />
                <Stack.Screen name="face-verification" options={{ headerShown: false }} />
                <Stack.Screen name="document-verification" options={{ headerShown: false }} />
              </Stack>
              <AuthModal />
            </>
          )}
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
