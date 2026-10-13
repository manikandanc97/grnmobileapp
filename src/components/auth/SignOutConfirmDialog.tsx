import { UiStyles } from '@/constants/uiStyles';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Platform,
  Easing,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, Shadows, TouchTargets } from '@/constants/theme';

export interface SignOutConfirmDialogProps {
  /** Controls modal visibility */
  visible: boolean;
  /** Optional user display name to display in the account snippet */
  userName?: string;
  /** Optional user email */
  userEmail?: string;
  /** Loading state while sign out mutation is active */
  loading?: boolean;
  /** Callback fired when user confirms sign out */
  onConfirm: () => void;
  /** Callback fired when user cancels or dismisses */
  onCancel: () => void;
  /** Optional testID */
  testID?: string;
}

export function SignOutConfirmDialog({
  visible,
  userName,
  userEmail,
  loading = false,
  onConfirm,
  onCancel,
  testID = 'sign-out-confirm-dialog',
}: SignOutConfirmDialogProps) {
  const insets = useSafeAreaInsets();
  const [backdropAnim] = useState(() => new Animated.Value(0));
  const [cardScaleAnim] = useState(() => new Animated.Value(0.95));
  const [cardFadeAnim] = useState(() => new Animated.Value(0));

  const startEnterAnimation = useCallback(() => {
    backdropAnim.setValue(0);
    cardScaleAnim.setValue(0.95);
    cardFadeAnim.setValue(0);

    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(cardScaleAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [backdropAnim, cardFadeAnim, cardScaleAnim]);

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      startEnterAnimation();
    }
  }, [visible, startEnterAnimation]);

  const handleDismiss = useCallback(() => {
    if (loading) return; // Prevent dismissing during sign out execution
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(cardFadeAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.in(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(cardScaleAnim, {
        toValue: 0.96,
        duration: 140,
        easing: Easing.in(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onCancel();
    });
  }, [backdropAnim, cardFadeAnim, cardScaleAnim, loading, onCancel]);

  if (!visible) return null;

  const initials = (userName || userEmail || 'GR')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
      testID={testID}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
            paddingLeft: Math.max(insets.left, 20),
            paddingRight: Math.max(insets.right, 20),
          },
        ]}
        accessibilityViewIsModal
        aria-modal={true}
        accessibilityRole="alert"
      >
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.55],
              }),
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleDismiss}
            accessible={false}
            importantForAccessibility="no"
          />
        </Animated.View>

        {/* Enterprise Dialog Card */}
        <Animated.View
          style={[
            styles.dialogCard,
            {
              opacity: cardFadeAnim,
              transform: [{ scale: cardScaleAnim }],
            },
          ]}
        >
          {/* Header Icon Wrap */}
          <View style={styles.iconWrapper}>
            <LogOut size={26} color={Colors.light.error} strokeWidth={2.4} />
          </View>

          {/* Dialog Title */}
          <Text style={styles.title} accessibilityRole="header">
            Sign out?
          </Text>

          {/* Dialog Explanation */}
          <Text style={styles.message} accessibilityRole="text">
            You can sign in again whenever you need to manage your sites.
          </Text>

          {/* Active User Account Snippet */}
          {(userName || userEmail) && (
            <View style={styles.accountCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
              <View style={styles.accountInfo}>
                {userName ? (
                  <Text style={styles.accountName} numberOfLines={1}>
                    {userName}
                  </Text>
                ) : null}
                {userEmail ? (
                  <Text style={styles.accountEmail} numberOfLines={1}>
                    {userEmail}
                  </Text>
                ) : null}
              </View>
              <View style={styles.statusPill}>
                <View style={styles.activeDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              testID={`${testID}-cancel`}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleDismiss}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              testID={`${testID}-confirm`}
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && styles.confirmButtonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={onConfirm}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Sign Out"
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={Colors.light.surface} />
                  <Text style={styles.confirmButtonText}>Signing Out...</Text>
                </View>
              ) : (
                <View style={styles.confirmButtonContent}>
                  <LogOut size={16} color={Colors.light.surface} strokeWidth={2.2} />
                  <Text style={styles.confirmButtonText}>Sign Out</Text>
                </View>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.light.text,
  },
  dialogCard: {
    ...UiStyles.card,
    width: '100%',
    maxWidth: 360,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  iconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.light.errorBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: -0.4,
  },
  message: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  accountCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.xl,
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: Colors.light.onPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  accountEmail: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.successBg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.success,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.success,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: TouchTargets.min,
  },
  cancelButtonPressed: {
    backgroundColor: Colors.light.borderStrong,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  confirmButton: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.error,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: TouchTargets.min,
    ...Shadows.sm,
  },
  confirmButtonPressed: {
    backgroundColor: Colors.light.error,
  },
  confirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.onPrimary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
