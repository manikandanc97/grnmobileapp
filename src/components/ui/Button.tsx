import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, Radius, TouchTargets, Shadows } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  accessibilityLabel?: string;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  icon, 
  loading = false, 
  disabled = false,
  style 
}: ButtonProps) {

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  const handlePressIn = () => { // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); };
  const handlePressOut = () => { // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 15, stiffness: 300 }); };
  
  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled || loading}
      style={style}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.button,
            styles[variant],
            (pressed || loading || disabled) && styles.disabled,
            animatedStyle,
          ]}
        >
          {loading ? (
            <ActivityIndicator 
              color={(variant === 'primary' || variant === 'danger') ? '#FFFFFF' : Colors.light.textSecondary} 
              style={styles.icon} 
            />
          ) : (
            icon && <View style={styles.icon}>{icon}</View>
          )}
          <Text style={[styles.text, styles[`${variant}Text`]]}>
            {loading ? 'Please wait...' : title}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: TouchTargets.min,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  primary: {
    backgroundColor: Colors.light.primary,
    ...Shadows.glow,
  },
  secondary: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  danger: {
    backgroundColor: Colors.light.error,
    elevation: 2,
    shadowColor: Colors.light.error,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.light.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    ...Typography.button,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: Colors.light.text,
  },
  dangerText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: Colors.light.text,
  },
  ghostText: {
    color: Colors.light.text,
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
