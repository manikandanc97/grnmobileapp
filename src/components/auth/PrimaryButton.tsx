import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ActivityIndicator, StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function PrimaryButton({ title, loading = false, disabled, style, ...props }: PrimaryButtonProps) {
  const theme = useTheme();
  const primaryColor = theme.primary;
  const primaryTextColor = theme.primaryText;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  const handlePressIn = (e: any) => { 
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); 
    if (props.onPressIn) props.onPressIn(e);
  };
  const handlePressOut = (e: any) => { 
    scale.value = withSpring(1, { damping: 15, stiffness: 300 }); 
    if (props.onPressOut) props.onPressOut(e);
  };


  return (
    <AnimatedTouchableOpacity onPressIn={handlePressIn} onPressOut={handlePressOut}
      style={[
        styles.button,
        { backgroundColor: primaryColor },
        (disabled || loading) && styles.disabled,
        style,
        animatedStyle,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={primaryTextColor} />
      ) : (
        <ThemedText style={[styles.text, { color: primaryTextColor }]}>
          {title}
        </ThemedText>
      )}
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.three,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
