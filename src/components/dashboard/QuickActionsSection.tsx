import { UiStyles } from '@/constants/uiStyles';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Building2,
  PackagePlus,
  UserCheck,
  IndianRupee,
} from 'lucide-react-native';
import { QuickActionItem, QUICK_ACTIONS } from '@/types/dashboard';
import { Colors, Typography, Spacing, Radius, BrandColors, TouchTargets, IconSizes } from '@/constants/theme';

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
          icon: <UserCheck {...iconProps} color={Colors.light.brand} />,
          bg: Colors.light.brandBg,
        };
      case 'IndianRupee':
      case 'Receipt':
        return {
          icon: <IndianRupee {...iconProps} color={BrandColors.brand} />,
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
      <Text style={styles.sectionTitle}>Add an entry</Text>

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
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...UiStyles.sectionTitle,
    ...Typography.sectionTitle,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionTile: {
    flexBasis: '46%',
    flexGrow: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    minHeight: TouchTargets.min,
  },
  actionTilePressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: Colors.light.surfaceMuted,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...Typography.body,
    flex: 1,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'left',
    lineHeight: 20,
  },
});
