import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Filter } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius, IconSizes, TouchTargets } from '@/constants/theme';

export interface FilterButtonProps {
  onPress: () => void;
  isActive?: boolean;
  label?: string;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FilterButton({
  onPress,
  isActive = false,
  label = 'Filter',
  style,
}: FilterButtonProps) {

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));
  const handlePressIn = () => { scale.value = withSpring(0.94, { damping: 15, stiffness: 300 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); };
  return (
    <AnimatedPressable onPressIn={handlePressIn} onPressOut={handlePressOut}
      style={({ pressed }: { pressed: boolean }) => [
        styles.button,
        isActive && styles.buttonActive,
        pressed && styles.buttonPressed,
        style,
        animatedStyle,
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
    </AnimatedPressable>
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
    borderColor: 'transparent',
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
