import React from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, Radius, TouchTargets } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
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
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        (pressed || loading || disabled) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator 
          color={(variant === 'primary' || variant === 'danger') ? Colors.light.surface : Colors.light.textSecondary} 
          style={styles.icon} 
        />
      ) : (
        icon && <View style={styles.icon}>{icon}</View>
      )}
      <Text style={[styles.text, styles[`${variant}Text`]]}>
        {loading ? 'Please wait...' : title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: TouchTargets.min,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  primary: {
    backgroundColor: Colors.light.primary,
  },
  secondary: {
    backgroundColor: Colors.light.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  danger: {
    backgroundColor: Colors.light.error,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.7,
  },
  text: {
    ...Typography.button,
  },
  primaryText: {
    color: Colors.light.surface,
  },
  secondaryText: {
    color: Colors.light.textSecondary,
  },
  dangerText: {
    color: Colors.light.surface,
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
