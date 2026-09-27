import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Building2,
  PackagePlus,
  UserCheck,
  Receipt,
} from 'lucide-react-native';
import { QuickActionItem, MOCK_QUICK_ACTIONS } from '@/types/dashboard';

interface QuickActionsSectionProps {
  actions?: QuickActionItem[];
  onActionPress?: (action: QuickActionItem) => void;
}

export function QuickActionsSection({
  actions = MOCK_QUICK_ACTIONS,
  onActionPress,
}: QuickActionsSectionProps) {
  const getActionConfig = (iconName: QuickActionItem['iconName']) => {
    switch (iconName) {
      case 'Building2':
        return {
          icon: <Building2 size={20} color="#07566A" strokeWidth={2.2} />,
          bg: '#FFF4E5', // Orange tint
          iconColor: '#07566A',
        };
      case 'PackagePlus':
        return {
          icon: <PackagePlus size={20} color="#1D4ED8" strokeWidth={2.2} />,
          bg: '#EFF6FF',
          iconColor: '#1D4ED8',
        };
      case 'UserCheck':
        return {
          icon: <UserCheck size={20} color="#059669" strokeWidth={2.2} />,
          bg: '#ECFDF5',
          iconColor: '#059669',
        };
      case 'Receipt':
        return {
          icon: <Receipt size={20} color="#9333EA" strokeWidth={2.2} />,
          bg: '#FAF5FF',
          iconColor: '#9333EA',
        };
      default:
        return {
          icon: <Building2 size={20} color="#07566A" />,
          bg: '#FFF4E5',
          iconColor: '#07566A',
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
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#07566A',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionTile: {
    flexBasis: '22%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#07566A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  actionTilePressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#FAFCFD',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#123746',
    textAlign: 'center',
    lineHeight: 15,
  },
});
