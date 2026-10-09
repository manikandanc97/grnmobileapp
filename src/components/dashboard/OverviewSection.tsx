import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Building2,
  Package,
  Users,
  ReceiptText,
  ArrowUpRight,
} from 'lucide-react-native';
import { MetricItem, SiteItem } from '@/types/dashboard';
import { DashboardMetrics } from '@/services/dashboard';
import { formatCurrency } from '@/lib/finance';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';

interface OverviewSectionProps {
  metricsData?: DashboardMetrics | null;
  sites?: SiteItem[];
  onCardPress?: (metric: MetricItem) => void;
}

export function OverviewSection({
  metricsData,
  sites = [],
  onCardPress,
}: OverviewSectionProps) {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const metrics: MetricItem[] = [
    {
      id: 'active-sites',
      label: 'Active Sites',
      value: metricsData ? metricsData.activeSites.toString() : '-',
      iconName: 'Building2',
    },
    {
      id: 'total-projects',
      label: 'Total Projects',
      value: metricsData ? metricsData.totalProjects.toString() : '-',
      iconName: 'Package',
    },
    {
      id: 'workers-present',
      label: 'Labor Today',
      value: metricsData ? metricsData.totalActiveLabor.toString() : '-',
      iconName: 'Users',
    },
    {
      id: 'this-month',
      label: 'This Month',
      value: metricsData ? formatCurrency(metricsData.thisMonthExpenses) : '-',
      iconName: 'ReceiptText',
    },
  ];

  const renderIcon = (iconName: string) => {
    const props = { size: 22, strokeWidth: 2.3 };
    switch (iconName) {
      case 'Building2':
        return <Building2 {...props} color="#0284C7" />;
      case 'Package':
        return <Package {...props} color="#E79524" />;
      case 'Users':
        return <Users {...props} color="#10B981" />;
      case 'ReceiptText':
        return <ReceiptText {...props} color="#EF4444" />;
      default:
        return <Building2 {...props} color={Colors.light.brand} />;
    }
  };

  const getIconContainerStyle = (iconName: string) => {
    switch (iconName) {
      case 'Building2': return { backgroundColor: '#E0F2FE' };
      case 'Package': return { backgroundColor: '#FEF3C7' };
      case 'Users': return { backgroundColor: '#D1FAE5' };
      case 'ReceiptText': return { backgroundColor: '#FEE2E2' };
      default: return { backgroundColor: '#F1F5F9' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Greeting Section */}
      <View style={styles.greetingContainer}>
        <View style={styles.greetingHeader}>
          <Text style={styles.greetingTitle}>{greeting},</Text>
          <Text style={styles.greetingSubtitle}>Here is today&apos;s construction overview</Text>
        </View>
      </View>

      {/* Statistics Grid */}
      <View style={styles.grid}>
        {metrics.map((metric) => (
          <Pressable
            key={metric.id}
            accessibilityRole="button"
            accessibilityLabel={`${metric.label}: ${metric.value}`}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => onCardPress?.(metric)}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, getIconContainerStyle(metric.iconName || '')]}>
                {renderIcon(metric.iconName || 'Building2')}
              </View>
              <ArrowUpRight size={14} color="#94A3B8" />
            </View>
            <View style={styles.metricDetails}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue} numberOfLines={1}>{metric.value}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greetingContainer: {
    marginBottom: Spacing.md,
  },
  greetingHeader: {
    gap: 2,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    ...Shadows.sm,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: '#F8FAFC',
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricDetails: {
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
});
