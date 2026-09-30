import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Building2,
  Briefcase,
  CheckSquare,
  IndianRupee,
} from 'lucide-react-native';
import { MetricItem, SiteItem } from '@/types/dashboard';
import { DashboardMetrics } from '@/services/dashboard';
import { formatCurrency } from '@/lib/finance';
import { Colors, Typography, Spacing, Radius, Shadows, BrandColors } from '@/constants/theme';

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
          value: formatCurrency(metricsData.thisMonthExpenses),
          subtext: 'Expenses logged',
          iconName: 'IndianRupee',
        },
      ]
    : [];

  const renderIcon = (iconName: MetricItem['iconName']) => {
    const props = { size: 16, strokeWidth: 2.2 };
    switch (iconName) {
      case 'Building2':
        return <Building2 {...props} color={Colors.light.primary} />;
      case 'Briefcase':
        return <Briefcase {...props} color={Colors.light.info} />;
      case 'CheckSquare':
        return <CheckSquare {...props} color={Colors.light.success} />;
      case 'IndianRupee':
        return <IndianRupee {...props} color={BrandColors.brand} />;
      default:
        return <Building2 {...props} color={Colors.light.textSecondary} />;
    }
  };

  const getIconBg = (iconName: MetricItem['iconName']) => {
    switch (iconName) {
      case 'Building2':
        return Colors.light.primaryBg;
      case 'Briefcase':
        return Colors.light.infoBg;
      case 'CheckSquare':
        return Colors.light.successBg;
      case 'IndianRupee':
        return Colors.light.brandBg; // Light teal
      default:
        return Colors.light.surfaceMuted;
    }
  };

  // Calculate overall progress from sites
  let overallProgress = 0;
  let onTrackCount = 0;
  if (sites.length > 0) {
    const totalProgress = sites.reduce((sum, site) => sum + (site.progress || 0), 0);
    overallProgress = Math.round(totalProgress / sites.length);
    onTrackCount = sites.filter(s => s.status === 'On Track').length;
  }
  const isGoodStanding = sites.length === 0 || (onTrackCount / sites.length) >= 0.5;

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.heroTitle}>Project Overview</Text>
            <Text style={styles.heroSubtitle}>Overall completion</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isGoodStanding ? 'rgba(22, 165, 122, 0.2)' : 'rgba(231, 149, 36, 0.2)' }]}>
            <View style={[styles.statusDot, { backgroundColor: isGoodStanding ? Colors.light.success : Colors.light.primary }]} />
            <Text style={[styles.statusText, { color: isGoodStanding ? Colors.light.successBg : Colors.light.warningBg }]}>
              {sites.length === 0 ? 'No Sites' : isGoodStanding ? 'On track' : 'Needs attention'}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.heroPercentage}>{overallProgress}%</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, overallProgress))}%` }]} />
          </View>
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
              <View style={[styles.iconContainer, { backgroundColor: getIconBg(metric.iconName) }]}>
                {renderIcon(metric.iconName)}
              </View>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
            
            <View style={styles.cardBody}>
              <Text style={styles.metricValue}>{metric.value}</Text>
              {metric.subtext ? (
                <Text style={styles.metricSubtext} numberOfLines={1}>
                  {metric.subtext}
                </Text>
              ) : null}
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
    marginTop: Spacing.lg,
  },
  heroCard: {
    backgroundColor: Colors.light.brand,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.surface,
    marginBottom: 4,
  },
  heroSubtitle: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 'auto',
  },
  heroPercentage: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.surface,
    letterSpacing: -1,
    marginBottom: Spacing.sm,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.full,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: Colors.light.surfaceMuted,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    flex: 1,
  },
  cardBody: {
    marginTop: 2,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  metricSubtext: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
});
