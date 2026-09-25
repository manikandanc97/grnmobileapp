import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

// Complete the auth session if the app returns from a WebBrowser redirect
WebBrowser.maybeCompleteAuthSession();

// Helper to manually extract tokens from URL fragment for React Native
const extractParams = (url: string) => {
  const fragment = url.split('#')[1];
  if (!fragment) return null;
  const parts = fragment.split('&');
  const params: Record<string, string> = {};
  for (const part of parts) {
    const [key, val] = part.split('=');
    params[key] = decodeURIComponent(val);
  }
  return {
    access_token: params['access_token'],
    refresh_token: params['refresh_token'],
  };
};

export default function LoginScreen() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const theme = useTheme();
  const borderColor = theme.border;
  const textSecondaryColor = theme.textSecondary;

  const handleContinueWithMobile = async () => {
    if (mobileNumber.length !== 10) return;
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: '+91' + mobileNumber,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
      return;
    }

    router.push({
      pathname: '/(auth)/verify-otp' as any,
      params: { phone: mobileNumber }
    });
  };

  const handleContinueWithGoogle = async () => {
    setGoogleLoading(true);

    const redirectUrl = Linking.createURL('/(auth)/');

    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
      }
      setGoogleLoading(false);
      return;
    }

    // Native implementation
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      Alert.alert('Error', error.message);
      setGoogleLoading(false);
      return;
    }

    if (data?.url) {
      try {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success' && result.url) {
          const params = extractParams(result.url);
          
          if (params?.access_token && params?.refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            
            if (sessionError) {
              Alert.alert('Error', sessionError.message);
            }
          }
        }
      } catch {
        Alert.alert('Error', 'An error occurred during Google authentication.');
      }
    }
    
    setGoogleLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <AuthHeader
              title="Welcome back"
              subtitle="Manage your construction sites, materials and workforce in one place."
            />

            <View style={styles.formContainer}>
              <PhoneInput
                value={mobileNumber}
                onChangeText={(text) => setMobileNumber(text.replace(/[^0-9]/g, ''))}
              />

              <PrimaryButton
                title="Continue with Mobile"
                onPress={handleContinueWithMobile}
                loading={loading}
                disabled={mobileNumber.length < 10}
              />

              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: borderColor }]} />
                <ThemedText style={[styles.dividerText, { color: textSecondaryColor }]}>OR</ThemedText>
                <View style={[styles.divider, { backgroundColor: borderColor }]} />
              </View>

              <GoogleButton
                title="Continue with Google"
                onPress={handleContinueWithGoogle}
                loading={googleLoading}
                disabled={loading}
              />
            </View>

            <View style={styles.footer}>
              <ThemedText style={[styles.footerText, { color: textSecondaryColor }]}>
                Secure access for GRN Constructions team
              </ThemedText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    justifyContent: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    flex: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.three,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    marginTop: Spacing.six,
    alignItems: 'center',
    paddingTop: Spacing.four,
  },
  footerText: {
    fontSize: 12,
  },
});
