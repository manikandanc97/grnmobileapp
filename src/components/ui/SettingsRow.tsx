import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, Typography, Radius, Shadows, IconSizes, TouchTargets } from '@/constants/theme';

interface SettingsRowProps {
  icon: React.ReactNode;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  value?: string | React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  isDestructive?: boolean;
  hideDivider?: boolean;
}

export function SettingsRow({
  icon,
  iconBgColor,
  title,
  subtitle,
  value,
  showChevron = true,
  onPress,
  isDestructive = false,
  hideDivider = false,
}: SettingsRowProps) {
  const content = (
    <>
      <View style={styles.left}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: iconBgColor || Colors.light.surfaceMuted },
          isDestructive && { backgroundColor: Colors.light.errorBg }
        ]}>
          {icon}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, isDestructive && { color: Colors.light.error }]}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.right}>
        {value && (
          typeof value === 'string'
            ? <Text style={styles.valueText}>{value}</Text>
            : value
        )}
        {showChevron && onPress && (
          <ChevronRight size={IconSizes.sm} color={Colors.light.textMuted} style={styles.chevron} />
        )}
      </View>
    </>
  );

  return (
    <View style={styles.wrapper}>
      {onPress ? (
        <Pressable
          style={({ pressed }) => [styles.container, pressed && styles.pressed]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={title}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.container}>{content}</View>
      )}
      {!hideDivider && <View style={styles.divider} />}
    </View>
  );
}

export function SettingsGroup({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <View style={styles.groupWrapper}>
      {title && <Text style={styles.groupTitle}>{title}</Text>}
      <View style={styles.groupContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupWrapper: {
    marginBottom: Spacing.xl,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'none',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  groupContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  wrapper: {
    backgroundColor: Colors.light.surface,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    minHeight: TouchTargets.min,
  },
  pressed: {
    backgroundColor: Colors.light.background,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: Spacing.md,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  right: {
    flexShrink: 1,
    maxWidth: '58%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  valueText: {
    flexShrink: 1,
    textAlign: 'right',
    ...Typography.body,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: 14 + 38 + 14, // padding + icon + margin
  },
});
