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
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, Shadows, TouchTargets } from '@/constants/theme';

export interface ErrorDialogProps {
  /** Controls modal visibility */
  visible: boolean;
  /** Title header e.g. "Something went wrong" */
  title?: string;
  /** User-friendly message explaining the problem */
  message: string;
  /** Label for close button. Defaults to "Close" */
  closeText?: string;
  /** Optional label for retry button e.g. "Try Again" */
  retryText?: string;
  /** Callback fired when user closes or dismisses */
  onClose: () => void;
  /** Optional callback fired when user taps retry */
  onRetry?: () => void;
  /** Optional testID */
  testID?: string;
}

export function ErrorDialog({
  visible,
  title = 'Something went wrong',
  message,
  closeText = 'Close',
  retryText = 'Try Again',
  onClose,
  onRetry,
  testID = 'error-dialog',
}: ErrorDialogProps) {
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
      onClose();
    });
  }, [backdropAnim, cardFadeAnim, cardScaleAnim, onClose]);

  const handleRetry = useCallback(() => {
    handleDismiss();
    if (onRetry) {
      onRetry();
    }
  }, [handleDismiss, onRetry]);

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
            <AlertCircle size={28} color={Colors.light.error} strokeWidth={2.2} />
          </View>

          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>

          <Text style={styles.message} accessibilityRole="text">
            {message}
          </Text>

          <View style={styles.buttonRow}>
            <Pressable
              testID={`${testID}-close`}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
                !onRetry && styles.fullWidthButton,
              ]}
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel={closeText}
            >
              <Text style={styles.closeButtonText}>{closeText}</Text>
            </Pressable>

            {onRetry && (
              <Pressable
                testID={`${testID}-retry`}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.retryButtonPressed,
                ]}
                onPress={handleRetry}
                accessibilityRole="button"
                accessibilityLabel={retryText}
              >
                <Text style={styles.retryButtonText}>{retryText}</Text>
              </Pressable>
            )}
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
    paddingTop: Spacing.lg,
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
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  closeButton: {
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
  closeButtonPressed: {
    opacity: 0.8,
  },
  fullWidthButton: {
    flex: 1,
  },
  closeButtonText: {
    ...Typography.button,
    color: Colors.light.text,
  },
  retryButton: {
    flex: 1,
    minHeight: TouchTargets.min,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonPressed: {
    opacity: 0.9,
  },
  retryButtonText: {
    ...Typography.button,
    color: Colors.light.surface,
  },
});
