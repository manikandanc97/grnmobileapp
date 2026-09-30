import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Building2,
  PackagePlus,
  UserCheck,
  Receipt,
} from 'lucide-react-native';
import { QuickActionItem, QUICK_ACTIONS } from '@/types/dashboard';
import { Colors, Typography, Spacing, Radius, Shadows, BrandColors, TouchTargets, IconSizes } from '@/constants/theme';

interface QuickActionsSectionProps {
  actions?: QuickActionItem[];
  onActionPress?: (action: QuickActionItem) => void;
}

export function QuickActionsSection({
  actions = QUICK_ACTIONS,
  onActionPress,
}: QuickActionsSectionProps) {
  const getActionConfig = (iconName: QuickActionItem['iconName']) => {
    const iconProps = { size: IconSizes.md, strokeWidth: 2.2 };
    switch (iconName) {
      case 'Building2':
        return {
          icon: <Building2 {...iconProps} color={Colors.light.brand} />,
          bg: Colors.light.primaryBg,
        };
      case 'PackagePlus':
        return {
          icon: <PackagePlus {...iconProps} color={Colors.light.info} />,
          bg: Colors.light.infoBg,
        };
      case 'UserCheck':
        return {
          icon: <UserCheck {...iconProps} color={Colors.light.success} />,
          bg: Colors.light.successBg,
        };
      case 'Receipt':
        return {
          icon: <Receipt {...iconProps} color={BrandColors.brand} />,
          bg: Colors.light.brandBg,
        };
      default:
        return {
          icon: <Building2 {...iconProps} color={Colors.light.brand} />,
          bg: Colors.light.surfaceMuted,
        };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.grid}>
        {actions.map((action) => {
          const config = getActionConfig(action.iconName);
          return (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              accessibilityLabel={action.title}
              style={({ pressed }) => [
                styles.actionTile,
                pressed && styles.actionTilePressed,
              ]}
              onPress={() => onActionPress?.(action)}
            >
              <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
                {config.icon}
              </View>
              <Text style={styles.actionLabel} numberOfLines={2}>
                {action.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.brand,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionTile: {
    flexBasis: '22%',
    flexGrow: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
    minHeight: TouchTargets.min,
  },
  actionTilePressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: Colors.light.surfaceMuted,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  actionLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 15,
  },
});
