import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { OtpInput } from '@/components/auth/OtpInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { Spacing, Radius } from '@/constants/theme';
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
        <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            extraScrollHeight={Platform.OS === 'ios' ? 24 : 60}
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
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  phoneText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    flex: 1,
  },
  verifyButton: {
    marginTop: Spacing.md,
  },
  actionsContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
