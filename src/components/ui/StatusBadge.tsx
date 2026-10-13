import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Radius , Colors } from '@/constants/theme';

export type BadgeStatus = 'success' | 'warning' | 'error' | 'info';

interface StatusBadgeProps {
  status: string;
  type?: BadgeStatus;
  showDot?: boolean;
  compact?: boolean;
  style?: ViewStyle;
}

export function StatusBadge({
  status,
  type = 'info',
  showDot = true,
  compact = false,
  style,
}: StatusBadgeProps) {
  // Infer type from status text if not explicitly provided
  let semanticType = type;
  const statusLower = status.toLowerCase();

  if (
    statusLower === 'completed' ||
    statusLower === 'available' ||
    statusLower.includes('success') ||
    statusLower.includes('on track') ||
    statusLower.includes('active') ||
    statusLower.includes('present') ||
    statusLower.includes('paid')
  ) {
    semanticType = 'success';
  } else if (
    statusLower === 'on hold' ||
    statusLower.includes('warning') ||
    statusLower.includes('in progress') ||
    statusLower.includes('pending') ||
    statusLower.includes('half day') ||
    statusLower.includes('low stock')
  ) {
    semanticType = 'warning';
  } else if (
    statusLower === 'out of stock' ||
    statusLower.includes('error') ||
    statusLower.includes('delayed') ||
    statusLower.includes('failed') ||
    statusLower.includes('absent')
  ) {
    semanticType = 'error';
  }

  const getColors = () => {
    switch (semanticType) {
      case 'success':
        return {
          bg: Colors.light.successBg,
          border: Colors.light.successBg,
          text: Colors.light.success,
          dot: Colors.light.success,
        };
      case 'warning':
        return {
          bg: Colors.light.warningBg,
          border: Colors.light.warningBg,
          text: Colors.light.warning,
          dot: Colors.light.warning,
        };
      case 'error':
        return {
          bg: Colors.light.errorBg,
          border: Colors.light.errorBg,
          text: Colors.light.error,
          dot: Colors.light.error,
        };
      case 'info':
      default:
        return {
          bg: Colors.light.brandBg,
          border: Colors.light.brandBg,
          text: Colors.light.brand,
          dot: Colors.light.brand,
        };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg, borderColor: colors.border },
        compact && styles.badgeCompact,
        style,
      ]}
    >
      {showDot && (
        <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      )}
      <Text
        style={[
          styles.text,
          { color: colors.text },
          compact && styles.textCompact,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 6,
    alignSelf: 'flex-start',
  },
  badgeCompact: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  textCompact: {
    fontSize: 11,
  },
});
