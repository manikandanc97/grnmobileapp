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

// GRN Construction Design Tokens
const BRAND_TEAL = '#0B5364';
const BRAND_TEAL_ACTIVE = '#083F4C';
const SUCCESS_COLOR = '#16A085';
const SUCCESS_BG = '#E8F7F3';
const TEXT_PRIMARY = '#123746';
const TEXT_MUTED = '#6B7A85';

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

  // Animated values initialized via state factory to avoid accessing ref during render
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
        {/* Subtle translucent dark backdrop */}
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

        {/* Dialog Card */}
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
          {/* Success Icon */}
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
                color={SUCCESS_COLOR}
                strokeWidth={2.4}
              />
            )}
          </Animated.View>

          {/* Title */}
          <Text
            style={styles.title}
            accessibilityRole="header"
          >
            {title}
          </Text>

          {/* Message */}
          {message ? (
            <Text
              style={styles.message}
              accessibilityRole="text"
            >
              {message}
            </Text>
          ) : null}

          {/* Action Button */}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 24,
    alignItems: 'center',
    // Premium soft elevation & shadows
    ...Platform.select({
      ios: {
        shadowColor: '#072733',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
      default: {
        shadowColor: '#072733',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
      },
    }),
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: SUCCESS_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: BRAND_TEAL,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: BRAND_TEAL_ACTIVE,
    opacity: 0.92,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
