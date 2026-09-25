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
          icon: <Building2 size={22} color="#0F354A" strokeWidth={2.2} />,
          bg: '#F2A619', // Primary brand color
          iconColor: '#0F354A',
        };
      case 'PackagePlus':
        return {
          icon: <PackagePlus size={22} color="#1D4ED8" strokeWidth={2.2} />,
          bg: '#EFF6FF',
          iconColor: '#1D4ED8',
        };
      case 'UserCheck':
        return {
          icon: <UserCheck size={22} color="#059669" strokeWidth={2.2} />,
          bg: '#ECFDF5',
          iconColor: '#059669',
        };
      case 'Receipt':
        return {
          icon: <Receipt size={22} color="#9333EA" strokeWidth={2.2} />,
          bg: '#FAF5FF',
          iconColor: '#9333EA',
        };
      default:
        return {
          icon: <Building2 size={22} color="#0F354A" />,
          bg: '#F2A619',
          iconColor: '#0F354A',
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
                styles.actionItem,
                pressed && styles.actionItemPressed,
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
    color: '#0F354A',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#0F354A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  actionItemPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A2B35',
    textAlign: 'center',
    lineHeight: 15,
  },
});
