import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Filter } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, IconSizes, TouchTargets } from '@/constants/theme';

export interface FilterButtonProps {
  onPress: () => void;
  isActive?: boolean;
  label?: string;
  style?: ViewStyle;
}

export function FilterButton({
  onPress,
  isActive = false,
  label = 'Filter',
  style,
}: FilterButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isActive && styles.buttonActive,
        pressed && styles.buttonPressed,
        style,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
    >
      <Filter 
        size={IconSizes.sm} 
        color={isActive ? Colors.light.brand : Colors.light.textSecondary} 
        style={styles.icon}
      />
      <Text style={[styles.text, isActive && styles.textActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    minHeight: TouchTargets.min,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
  },
  buttonActive: {
    backgroundColor: Colors.light.primaryBg,
    borderColor: Colors.light.brand,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  text: {
    ...Typography.button,
    color: Colors.light.textSecondary,
  },
  textActive: {
    color: Colors.light.brand,
  },
});
