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

interface RecentActivitySectionProps {
  activities?: ActivityItem[];
}

export function RecentActivitySection({
  activities = [],
}: RecentActivitySectionProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    const props = { size: 16, strokeWidth: 2.2 };
    switch (type) {
      case 'material':
        return {
          icon: <Package {...props} color="#D97706" />,
          bg: '#FEF3C7',
        };
      case 'labor':
        return {
          icon: <Users {...props} color="#2563EB" />,
          bg: '#EFF6FF',
        };
      case 'delivery':
        return {
          icon: <Truck {...props} color="#7C3AED" />,
          bg: '#F5F3FF',
        };
      case 'progress':
        return {
          icon: <TrendingUp {...props} color="#059669" />,
          bg: '#ECFDF5',
        };
      default:
        return {
          icon: <Clock {...props} color="#6B7A85" />,
          bg: '#F3F4F6',
        };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>

      <View style={styles.card}>
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No recent activity</Text>
            <Text style={styles.emptyStateText}>Your latest updates will appear here.</Text>
          </View>
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
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#07566A',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#07566A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F6F8',
  },
  activityRowLast: {
    borderBottomWidth: 0,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18, // Make it circular avatar-like
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentColumn: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#123746',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  siteName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71808A',
  },
  dotSeparator: {
    fontSize: 10,
    color: '#E8ECEF',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
    color: '#71808A',
  },
  emptyState: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#123746',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#71808A',
    textAlign: 'center',
  },
});
