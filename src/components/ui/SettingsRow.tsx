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
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  groupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  wrapper: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    minHeight: TouchTargets.min,
  },
  pressed: {
    backgroundColor: '#F8FAFC',
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
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  valueText: {
    ...Typography.body,
    color: '#64748B',
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    marginLeft: 14 + 38 + 14, // padding + icon + margin
  },
});
