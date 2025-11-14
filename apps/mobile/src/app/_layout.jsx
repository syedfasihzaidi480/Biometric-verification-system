import { useAuth } from "@/utils/auth/useAuth";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthModal } from "@/utils/auth/useAuthModal";
import { ThemeProvider } from '@/utils/theme/ThemeProvider';

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
  const { initiate } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        // Simply initialize auth from stored credentials (no biometric prompt here)
        await initiate();
      } catch (e) {
        console.error('Error initializing auth:', e);
      } finally {
        SplashScreen.hideAsync();
      }
    })();
  }, [initiate]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="registration" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="voice-verification" options={{ headerShown: false }} />
            <Stack.Screen name="voice-enrollment" options={{ headerShown: false }} />
            <Stack.Screen name="voice-login" options={{ headerShown: false }} />
            <Stack.Screen name="face-verification" options={{ headerShown: false }} />
            <Stack.Screen name="liveness-check" options={{ headerShown: false }} />
            <Stack.Screen name="document-verification" options={{ headerShown: false }} />
            <Stack.Screen name="document-upload" options={{ headerShown: false }} />
            <Stack.Screen name="verification-submitted" options={{ headerShown: false }} />
            <Stack.Screen name="privacy" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          </Stack>
          <AuthModal />
        </ThemeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
