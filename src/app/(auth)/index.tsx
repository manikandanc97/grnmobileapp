import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Spacing } from '@/constants/theme';
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
