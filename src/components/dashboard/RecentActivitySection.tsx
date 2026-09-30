import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Package,
  Users,
  Truck,
  TrendingUp,
  Clock,
} from 'lucide-react-native';
import { ActivityItem } from '@/types/dashboard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Typography, Spacing, Radius, Shadows, BrandColors, IconSizes } from '@/constants/theme';

interface RecentActivitySectionProps {
  activities?: ActivityItem[];
}

export function RecentActivitySection({
  activities = [],
}: RecentActivitySectionProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    const props = { size: IconSizes.md, strokeWidth: 2.2 };
    switch (type) {
      case 'material':
        return {
          icon: <Package {...props} color={BrandColors.warning} />,
          bg: Colors.light.warningBg,
        };
      case 'labor':
        return {
          icon: <Users {...props} color={Colors.light.info} />,
          bg: Colors.light.infoBg,
        };
      case 'delivery':
        return {
          icon: <Truck {...props} color={BrandColors.brand} />,
          bg: Colors.light.brandBg,
        };
      case 'progress':
        return {
          icon: <TrendingUp {...props} color={Colors.light.success} />,
          bg: Colors.light.successBg,
        };
      default:
        return {
          icon: <Clock {...props} color={Colors.light.textSecondary} />,
          bg: Colors.light.surfaceMuted,
        };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>

      <View style={styles.card}>
        {activities.length === 0 ? (
          <EmptyState
            title="No recent activity"
            description="Your latest updates will appear here."
          />
        ) : (
          activities.map((item, index) => {
            const { icon, bg } = getActivityIcon(item.type);
            const isLast = index === activities.length - 1;

            return (
              <View
                key={item.id}
                style={[styles.activityRow, isLast && styles.activityRowLast]}
              >
                <View style={[styles.iconWrapper, { backgroundColor: bg }]}>
                  {icon}
                </View>

                <View style={styles.contentColumn}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.siteName}>{item.siteName}</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.brand,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  activityRowLast: {
    borderBottomWidth: 0,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  contentColumn: {
    flex: 1,
  },
  activityTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  siteName: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  dotSeparator: {
    ...Typography.caption,
    color: Colors.light.borderSubtle,
  },
  timestamp: {
    ...Typography.caption,
    fontWeight: '400',
    color: Colors.light.textSecondary,
  },
});
