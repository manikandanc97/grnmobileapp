import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, Typography, Radius, IconSizes, TouchTargets } from '@/constants/theme';

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
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  groupContainer: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    overflow: 'hidden',
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
    backgroundColor: Colors.light.surfaceMuted,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
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
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  valueText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  chevron: {
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginLeft: 16 + 36 + 16, // padding + icon + margin
  },
});
