import React, { useEffect, useState } from 'react';
import { StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

export interface LoadingSkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  type?: 'text' | 'card' | 'avatar';
}

export function LoadingSkeleton({
  width,
  height,
  borderRadius,
  style,
  type,
}: LoadingSkeletonProps) {
  const [animatedValue] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getPresetStyles = () => {
    switch (type) {
      case 'text':
        return {
          height: 16,
          width: width || '100%',
          borderRadius: Radius.sm,
          marginBottom: Spacing.xs,
        } as any;
      case 'avatar':
        return {
          height: height || 48,
          width: width || 48,
          borderRadius: Radius.full,
        };
      case 'card':
        return {
          height: height || 120,
          width: width || '100%',
          borderRadius: Radius.lg,
          marginBottom: Spacing.md,
        } as any;
      default:
        return {
          height: height || 20,
          width: width || '100%',
          borderRadius: borderRadius !== undefined ? borderRadius : Radius.sm,
        } as any;
    }
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        getPresetStyles(),
        style,
        { opacity },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.light.border,
  },
});
