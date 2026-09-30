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
import { Trash2 } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, Shadows, TouchTargets, IconSizes } from '@/constants/theme';

export interface ConfirmDeleteDialogProps {
  /** Controls modal visibility */
  visible: boolean;
  /** Dialog title e.g. "Delete Site?" */
  title: string;
  /** Detailed warning message explaining the impact */
  message: string;
  /** Label for the destructive confirm button e.g. "Delete Site" or "Remove Worker" */
  confirmText?: string;
  /** Label for the cancel button. Defaults to "Cancel" */
  cancelText?: string;
  /** Loading state while delete mutation is executing */
  loading?: boolean;
  /** Callback fired when user taps confirm button */
  onConfirm: () => void;
  /** Callback fired when user taps cancel or backdrop */
  onCancel: () => void;
  /** Optional testID */
  testID?: string;
}

export function ConfirmDeleteDialog({
  visible,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
  testID = 'confirm-delete-dialog',
}: ConfirmDeleteDialogProps) {
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
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(cardScaleAnim, {
        toValue: 1,
        duration: 200,
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
    if (loading) return; // Prevent dismiss while mutation is active
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 120,
        easing: Easing.in(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(cardFadeAnim, {
        toValue: 0,
        duration: 100,
        easing: Easing.in(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(cardScaleAnim, {
        toValue: 0.96,
        duration: 120,
        easing: Easing.in(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onCancel();
    });
  }, [backdropAnim, cardFadeAnim, cardScaleAnim, loading, onCancel]);

  if (!visible) return null;

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
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.45],
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

        <Animated.View
          style={[
            styles.dialogCard,
            {
              opacity: cardFadeAnim,
              transform: [{ scale: cardScaleAnim }],
            },
          ]}
        >
          <View style={styles.iconWrapper}>
            <Trash2 size={IconSizes.xl} color={Colors.light.error} strokeWidth={2.2} />
          </View>

          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>

          <Text style={styles.message} accessibilityRole="text">
            {message}
          </Text>

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
              accessibilityLabel={cancelText}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
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
              accessibilityLabel={confirmText}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.light.surface} />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F172A',
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    ...Shadows.lg,
  },
  iconWrapper: {
    width: 54,
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    minHeight: TouchTargets.min,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelButtonPressed: {
    opacity: 0.8,
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.light.text,
  },
  confirmButton: {
    flex: 1,
    minHeight: TouchTargets.min,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonPressed: {
    opacity: 0.9,
  },
  confirmButtonText: {
    ...Typography.button,
    color: Colors.light.surface,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
