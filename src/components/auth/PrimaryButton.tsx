import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ActivityIndicator, StyleSheet, TouchableOpacity, TouchableOpacityProps, Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius , Colors } from '@/constants/theme';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function PrimaryButton({ title, loading = false, disabled, style, ...props }: PrimaryButtonProps) {
  const theme = useTheme();
  const primaryColor = theme.brand;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  const handlePressIn = (e: any) => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    if (props.onPressIn) props.onPressIn(e);
  };
  const handlePressOut = (e: any) => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    if (props.onPressOut) props.onPressOut(e);
  };

  return (
    <AnimatedTouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: loading }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        { backgroundColor: primaryColor },
        (disabled || loading) && styles.disabled,
        animatedStyle,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={Colors.light.surface} />
      ) : (
        <Text style={styles.text}>
          {title}
        </Text>
      )}
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.md,
  },
  disabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.onPrimary,
    letterSpacing: 0.3,
  },
});
