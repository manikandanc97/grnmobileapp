import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, Platform, StyleSheet, LogBox } from 'react-native';
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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppLockProvider>
            <ToastProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <View style={styles.container}>
                  <View style={styles.mobileWrapper}>
                    <OfflineBanner />
                    <NotificationBanner />
                    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.light.surface } }}>
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
});
