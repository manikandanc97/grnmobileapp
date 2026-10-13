import React, { useState } from 'react';
import { StyleSheet, Text, View, Platform, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import * as Linking from 'expo-linking';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Spacing , Colors, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

// Configure Google Sign-In with the Web OAuth Client ID
GoogleSignin.configure({
  webClientId: '527081633062-rda933l9me8ev46nd8olcjventdeb40k.apps.googleusercontent.com',
});

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
      if (
        error.message?.toLowerCase().includes('phone provider') ||
        error.message?.toLowerCase().includes('sms')
      ) {
        Alert.alert(
          'SMS Gateway Required',
          'Phone OTP requires an SMS provider configured in Supabase (Auth > Providers > Phone) or adding a test phone number in Supabase Dashboard. Please use Google Login or add test credentials.'
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
      }
      return;
    }

    router.push({
      pathname: '/(auth)/verify-otp' as any,
      params: { phone: mobileNumber }
    });
  };

  const handleContinueWithGoogle = async () => {
    setGoogleLoading(true);

    if (Platform.OS === 'web') {
      const redirectUrl = typeof window !== 'undefined' && window.location?.origin
        ? `${window.location.origin}/(auth)/`
        : Linking.createURL('/(auth)/');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
      }
      setGoogleLoading(false);
      return;
    }

    // Native implementation
    try {
      await GoogleSignin.hasPlayServices();
      // Clear previous cached session so Google account picker always appears with all accounts
      try {
        await GoogleSignin.signOut();
      } catch {
        // Safe to ignore if not signed in previously
      }
      const response = await GoogleSignin.signIn();

      if (response.type === 'success') {
        const idToken = response.data.idToken;
        if (idToken) {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });

          if (error) {
            Alert.alert('Error', error.message);
          }
        } else {
          throw new Error('No ID token present!');
        }
      } else if (response.type === 'cancelled') {
        // user cancelled the login flow silently
      }
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert('Error', 'Google Play Services not available or outdated.');
            break;
          case statusCodes.IN_PROGRESS:
            Alert.alert('Error', 'Google Sign-In is already in progress.');
            break;
          default:
            Alert.alert('Error', error.message || 'An error occurred during Google authentication.');
        }
      } else {
        Alert.alert('Error', error?.message || 'An error occurred during Google authentication.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenWrapper style={styles.safeArea}>
        <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            extraScrollHeight={Platform.OS === 'ios' ? 24 : 60}
          >
            <AuthHeader
              title="Your sites.
One simple place."
              subtitle="Sign in to manage your sites and daily entries."
            />

            <View style={styles.formContainer}>
              <Text style={styles.fieldLabel}>Mobile number</Text>
              <PhoneInput
                value={mobileNumber}
                onChangeText={(text) => setMobileNumber(text.replace(/[^0-9]/g, ''))}
              />

              <PrimaryButton
                title="Continue"
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
        </KeyboardAwareScrollView>
      </ScreenWrapper>
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
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.light.text, marginBottom: 8 },
  formContainer: { width: '100%', maxWidth: 400, alignSelf: 'center', backgroundColor: Colors.light.surface, padding: 20, borderWidth: 1, borderColor: Colors.light.border, borderRadius: Radius.xl },
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
    marginTop: Spacing.lg,
    alignItems: 'center',
    paddingTop: Spacing.four,
  },
  footerText: {
    fontSize: 12,
  },
});
