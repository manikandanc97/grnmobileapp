import { DefaultTheme, ThemeProvider, Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View, Platform, StyleSheet, LogBox, Text, Pressable } from 'react-native';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/providers/AuthProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { NotificationBanner } from '@/components/ui/NotificationBanner';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { AppLockProvider } from '@/providers/AppLockProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { Colors } from '@/constants/theme';

LogBox.ignoreLogs([
  '"shadow*" style props are deprecated',
  'RNGoogleSignIn: you are calling a not-implemented method',
  'Animated: `useNativeDriver` is not supported',
]);

SplashScreen.preventAutoHideAsync();

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : (error as any)?.message || JSON.stringify(error) || 'An unexpected error occurred';

  return (
    <View style={styles.errorBoundaryContainer}>
      <Text style={styles.errorBoundaryTitle}>Something went wrong</Text>
      <Text style={styles.errorBoundaryMessage}>{errorMessage}</Text>
      <Pressable onPress={retry} style={styles.errorBoundaryRetryBtn}>
        <Text style={styles.errorBoundaryRetryText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppLockProvider>
            <ToastProvider>
              <ThemeProvider value={DefaultTheme}>
                <View style={styles.container}>
                  <View style={styles.mobileWrapper}>
                    <OfflineBanner />
                    <NotificationBanner />
                    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.light.background } }}>
                      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                      <Stack.Screen name="(app)" options={{ headerShown: false }} />
                    </Stack>
                  </View>
                </View>
                <StatusBar style="dark" />
              </ThemeProvider>
            </ToastProvider>
          </AppLockProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? Colors.light.surfaceMuted : Colors.light.surface,
  },
  mobileWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : '100%',
    marginHorizontal: 'auto',
    backgroundColor: Colors.light.surface,
    ...(Platform.OS === 'web'
      ? {
          shadowColor: Colors.light.text,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: Colors.light.borderStrong,
        }
      : {}),
  },
  errorBoundaryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.light.background,
  },
  errorBoundaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.error,
    marginBottom: 8,
  },
  errorBoundaryMessage: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorBoundaryRetryBtn: {
    backgroundColor: Colors.light.brand,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorBoundaryRetryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
