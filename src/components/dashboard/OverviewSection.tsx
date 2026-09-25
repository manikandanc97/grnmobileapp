import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Building2,
  Briefcase,
  CheckSquare,
  IndianRupee,
} from 'lucide-react-native';
import { MetricItem } from '@/types/dashboard';

import { DashboardMetrics } from '@/services/dashboard';

interface OverviewSectionProps {
  metricsData?: DashboardMetrics | null;
  onCardPress?: (metric: MetricItem) => void;
}

export function OverviewSection({
  metricsData,
  onCardPress,
}: OverviewSectionProps) {
  const metrics: MetricItem[] = metricsData
    ? [
        {
          id: 'active-sites',
          label: 'Active Sites',
          value: metricsData.activeSites.toString(),
          subtext: 'Ongoing projects',
          iconName: 'Building2',
        },
        {
          id: 'total-projects',
          label: 'Total Projects',
          value: metricsData.totalProjects.toString(),
          subtext: 'Registered sites',
          iconName: 'Briefcase',
        },
        {
          id: 'workers-present',
          label: 'Workers Today',
          value: metricsData.workersPresent.toString(),
          subtext: 'Marked present',
          iconName: 'CheckSquare',
        },
        {
          id: 'this-month',
          label: 'This Month',
          value: new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
          }).format(metricsData.thisMonthExpenses),
          subtext: 'Expenses logged',
          iconName: 'IndianRupee',
        },
      ]
    : [];
  const renderIcon = (iconName: MetricItem['iconName']) => {
    const props = { size: 18, color: '#D97706', strokeWidth: 2.2 };
    switch (iconName) {
      case 'Building2':
        return <Building2 {...props} />;
      case 'Briefcase':
        return <Briefcase {...props} color="#2563EB" />;
      case 'CheckSquare':
        return <CheckSquare {...props} color="#059669" />;
      case 'IndianRupee':
        return <IndianRupee {...props} color="#D97706" />;
      default:
        return <Building2 {...props} />;
    }
  };

  const getIconBg = (iconName: MetricItem['iconName']) => {
    switch (iconName) {
      case 'Building2':
        return '#FEF3C7'; // Amber tint
      case 'Briefcase':
        return '#EFF6FF'; // Blue tint
      case 'CheckSquare':
        return '#ECFDF5'; // Green tint
      case 'IndianRupee':
        return '#FEF3C7'; // Gold tint
      default:
        return '#FEF3C7';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.sectionBadge}>Real-time</Text>
      </View>

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
            <View style={styles.cardTopRow}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getIconBg(metric.iconName) },
                ]}
              >
                {renderIcon(metric.iconName)}
              </View>
            </View>

            <Text style={styles.metricValue}>{metric.value}</Text>

            {metric.subtext ? (
              <Text style={styles.metricSubtext} numberOfLines={1}>
                {metric.subtext}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F354A',
    letterSpacing: -0.2,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    // subtle shadow
    shadowColor: '#0F354A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#FAFCFD',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7A85',
    flex: 1,
    paddingRight: 6,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F354A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8A99A4',
  },
});
