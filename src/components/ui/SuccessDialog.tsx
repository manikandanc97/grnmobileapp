import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Keyboard,
  Platform,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, Shadows, TouchTargets } from '@/constants/theme';

export interface SuccessDialogProps {
  /** Whether the dialog is visible */
  visible: boolean;
  /** Main title e.g. "Worker Added" */
  title: string;
  /** Detailed description or confirmation message */
  message?: string;
  /** Action button text. Defaults to "Done" */
  buttonText?: string;
  /** Callback fired when user taps Done or dismisses */
  onClose: () => void;
  /** Optional custom icon to override default CircleCheck */
  icon?: React.ReactNode;
  /** Optional test identifier */
  testID?: string;
}

export function SuccessDialog({
  visible,
  title,
  message,
  buttonText = 'Done',
  onClose,
  icon,
  testID = 'success-dialog',
}: SuccessDialogProps) {
  const insets = useSafeAreaInsets();

  const [backdropAnim] = useState(() => new Animated.Value(0));
  const [cardScaleAnim] = useState(() => new Animated.Value(0.95));
  const [cardFadeAnim] = useState(() => new Animated.Value(0));
  const [iconScaleAnim] = useState(() => new Animated.Value(0.82));

  const startEnterAnimation = useCallback(() => {
    backdropAnim.setValue(0);
    cardScaleAnim.setValue(0.95);
    cardFadeAnim.setValue(0);
    iconScaleAnim.setValue(0.82);

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
      Animated.timing(iconScaleAnim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [backdropAnim, cardFadeAnim, cardScaleAnim, iconScaleAnim]);

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      startEnterAnimation();
    }
  }, [visible, startEnterAnimation]);

  const handleDismiss = useCallback(() => {
    Keyboard.dismiss();
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
                outputRange: [0, 0.4],
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
          accessible={false}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                transform: [{ scale: iconScaleAnim }],
              },
            ]}
          >
            {icon ? (
              icon
            ) : (
              <CircleCheck
                size={28}
                color={Colors.light.success}
                strokeWidth={2.4}
              />
            )}
          </Animated.View>

          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>

          {message ? (
            <Text style={styles.message} accessibilityRole="text">
              {message}
            </Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel={buttonText}
            accessibilityHint="Dismisses the confirmation dialog"
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </Pressable>
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
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.successBg,
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
  button: {
    width: '100%',
    minHeight: TouchTargets.min,
    height: 48,
    backgroundColor: Colors.light.brand,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.light.surface,
  },
});
