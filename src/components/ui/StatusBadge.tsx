import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

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
    statusLower.includes('success') ||
    statusLower.includes('on track') ||
    statusLower.includes('active') ||
    statusLower.includes('present')
  ) {
    semanticType = 'success';
  } else if (
    statusLower.includes('warning') ||
    statusLower.includes('in progress') ||
    statusLower.includes('pending') ||
    statusLower.includes('half day')
  ) {
    semanticType = 'warning';
  } else if (
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
          text: Colors.light.success,
        };
      case 'warning':
        return {
          bg: Colors.light.warningBg,
          text: Colors.light.warning,
        };
      case 'error':
        return {
          bg: Colors.light.errorBg,
          text: Colors.light.error,
        };
      case 'info':
      default:
        return {
          bg: Colors.light.infoBg,
          text: Colors.light.info,
        };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        compact && styles.badgeCompact,
        style,
      ]}
    >
      {showDot && (
        <View style={[styles.dot, { backgroundColor: colors.text }]} />
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.md,
    gap: 6,
    alignSelf: 'flex-start',
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  text: {
    ...Typography.caption,
    fontWeight: '600',
  },
  textCompact: {
    fontSize: 11,
  },
});
