import React, { useState } from 'react';
import { StyleSheet, Text, View, Platform, Alert, ScrollView } from 'react-native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import * as Linking from 'expo-linking';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { Spacing, Colors, Radius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Lock, ShieldCheck } from 'lucide-react-native';

// Configure Google Sign-In with the Web OAuth Client ID
GoogleSignin.configure({
  webClientId: '527081633062-rda933l9me8ev46nd8olcjventdeb40k.apps.googleusercontent.com',
});

export default function LoginScreen() {
  const [googleLoading, setGoogleLoading] = useState(false);

  const theme = useTheme();
  const textSecondaryColor = theme.textSecondary;

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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <AuthHeader
            title={"Your sites.\nOne simple place."}
            subtitle="Sign in to manage your sites, labor wages, and daily entries."
          />

          <View style={styles.formContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <ShieldCheck size={14} color={Colors.light.brand} />
                <Text style={styles.badgeText}>Team Portal</Text>
              </View>
              <Text style={styles.cardTitle}>Sign in to your account</Text>
              <Text style={styles.cardSubtitle}>
                Continue with your authorized Google account to manage construction projects and records.
              </Text>
            </View>

            <View style={styles.buttonWrapper}>
              <GoogleButton
                title="Continue with Google"
                onPress={handleContinueWithGoogle}
                loading={googleLoading}
              />
            </View>

            <View style={styles.securityNote}>
              <Lock size={12} color={Colors.light.textMuted} />
              <Text style={styles.securityText}>
                Authorized access for GRN Constructions team
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: textSecondaryColor }]}>
              Secure access for GRN Constructions team
            </ThemedText>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    justifyContent: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: Colors.light.surface,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.xl,
    ...Shadows.sm,
  },
  cardHeader: {
    marginBottom: Spacing.three,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.brandBg,
    marginBottom: Spacing.two,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.brand,
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.textSecondary,
  },
  buttonWrapper: {
    marginTop: Spacing.one,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  securityText: {
    fontSize: 12,
    color: Colors.light.textMuted,
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
