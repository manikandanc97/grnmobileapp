import React, { useState, useEffect } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { OtpInput } from '@/components/auth/OtpInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

export default function VerifyOtpScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const router = useRouter();
  const params = useLocalSearchParams();
  const phone = params.phone as string || '';

  const theme = useTheme();
  const textSecondaryColor = theme.textSecondary;
  const primaryColor = theme.primary;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    
    const { error } = await supabase.auth.verifyOtp({
      phone: '+91' + phone,
      token: otp,
      type: 'sms',
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message || 'Invalid or expired OTP.');
      return;
    }
    // Automatically routes to (app) via AuthProvider/layout state
  };

  const handleResend = async () => {
    setCountdown(30);
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: '+91' + phone,
    });

    if (error) {
      Alert.alert('Error', error.message || 'Failed to resend OTP.');
    }
  };

  const handleChangeNumber = () => {
    router.back();
  };

  // Format phone number for display
  const displayPhone = phone.length === 10 
    ? `${phone.substring(0, 5)} ${phone.substring(5)}` 
    : phone;

  return (
    <ThemedView style={styles.container}>
      <ScreenWrapper style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>Verify your number</ThemedText>
              <ThemedText style={[styles.subtitle, { color: textSecondaryColor }]}>
                Enter the 6-digit code sent to
              </ThemedText>
              <ThemedText style={styles.phoneText}>+91 {displayPhone}</ThemedText>
            </View>

            <View style={styles.formContainer}>
              <OtpInput
                value={otp}
                onChangeText={setOtp}
                length={6}
              />

              <PrimaryButton
                title="Verify & Continue"
                onPress={handleVerify}
                loading={loading}
                disabled={otp.length < 6}
                style={styles.verifyButton}
              />

              <View style={styles.actionsContainer}>
                {countdown > 0 ? (
                  <ThemedText style={[styles.resendText, { color: textSecondaryColor }]}>
                    Resend code in 00:{countdown.toString().padStart(2, '0')}
                  </ThemedText>
                ) : (
                  <TouchableOpacity onPress={handleResend} style={styles.actionButton}>
                    <ThemedText style={[styles.actionText, { color: primaryColor }]}>
                      Resend OTP
                    </ThemedText>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={handleChangeNumber} style={styles.actionButton}>
                  <ThemedText style={[styles.actionText, { color: textSecondaryColor, textDecorationLine: 'underline' }]}>
                    Change mobile number
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  title: {
    fontSize: 28,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    flex: 1,
  },
  verifyButton: {
    marginTop: Spacing.two,
  },
  actionsContainer: {
    alignItems: 'center',
    marginTop: Spacing.four,
    gap: Spacing.three,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
