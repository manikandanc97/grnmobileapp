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
          value: new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
            notation: "compact",
            compactDisplay: "short"
          }).format(metricsData.thisMonthExpenses),
          subtext: 'Expenses logged',
          iconName: 'IndianRupee',
        },
      ]
    : [];

  const renderIcon = (iconName: MetricItem['iconName']) => {
    const props = { size: 16, color: '#07566A', strokeWidth: 2.2 };
    switch (iconName) {
      case 'Building2':
        return <Building2 {...props} color="#E79524" />;
      case 'Briefcase':
        return <Briefcase {...props} color="#2563EB" />;
      case 'CheckSquare':
        return <CheckSquare {...props} color="#059669" />;
      case 'IndianRupee':
        return <IndianRupee {...props} color="#9333EA" />;
      default:
        return <Building2 {...props} />;
    }
  };

  const getIconBg = (iconName: MetricItem['iconName']) => {
    switch (iconName) {
      case 'Building2':
        return '#FFF4E5';
      case 'Briefcase':
        return '#EFF6FF';
      case 'CheckSquare':
        return '#ECFDF5';
      case 'IndianRupee':
        return '#FAF5FF';
      default:
        return '#F7F9FA';
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
            <View style={[styles.statusDot, { backgroundColor: isGoodStanding ? '#16A57A' : '#E79524' }]} />
            <Text style={[styles.statusText, { color: isGoodStanding ? '#E8FDF5' : '#FEF3C7' }]}>
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
    paddingHorizontal: 20,
    marginTop: 20,
  },
  heroCard: {
    backgroundColor: '#07566A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#07566A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#A7C4CC',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 'auto',
  },
  heroPercentage: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E79524',
    borderRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#07566A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#FDFDFD',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71808A',
    flex: 1,
  },
  cardBody: {
    marginTop: 2,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#123746',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71808A',
  },
});
