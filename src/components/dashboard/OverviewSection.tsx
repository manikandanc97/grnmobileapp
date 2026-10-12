import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Building2,
  Package,
  Users,
  IndianRupee,
  ReceiptText,
  ArrowUpRight,
} from 'lucide-react-native';
import { MetricItem, SiteItem } from '@/types/dashboard';
import { DashboardMetrics } from '@/services/dashboard';
import { formatCurrency } from '@/lib/finance';
import { Spacing } from '@/constants/theme';

interface OverviewSectionProps {
  metricsData?: DashboardMetrics | null;
  sites?: SiteItem[];
  onCardPress?: (metric: MetricItem) => void;
}

interface CardMeta {
  id: string;
  label: string;
  value: string;
  subtext: string;
  iconName: 'Building2' | 'Package' | 'Users' | 'ReceiptText' | 'IndianRupee';
  accentColor: string;
  iconBg: string;
  iconBorder: string;
  badgeBg: string;
  badgeText: string;
  arrowBg: string;
  arrowBorder: string;
}

export function OverviewSection({
  metricsData,
  sites = [],
  onCardPress,
}: OverviewSectionProps) {
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 17
      ? 'Good afternoon'
      : 'Good evening';

  const getTodayFormatted = () => {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(new Date());
    } catch {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const d = new Date();
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
    }
  };

  const cards: CardMeta[] = [
    {
      id: 'active-sites',
      label: 'Active Sites',
      value: metricsData ? metricsData.activeSites.toString() : '-',
      subtext:
        metricsData && metricsData.activeSites > 0
          ? `${metricsData.activeSites} operational`
          : 'No active sites',
      iconName: 'Building2',
      accentColor: '#0284C7',
      iconBg: '#F0F9FF',
      iconBorder: '#BAE6FD',
      badgeBg: '#F0F9FF',
      badgeText: '#0369A1',
      arrowBg: '#F0F9FF',
      arrowBorder: '#E0F2FE',
    },
    {
      id: 'total-projects',
      label: 'Total Projects',
      value: metricsData ? metricsData.totalProjects.toString() : '-',
      subtext:
        metricsData && metricsData.totalProjects > 0
          ? `${metricsData.totalProjects} in portfolio`
          : '0 projects',
      iconName: 'Package',
      accentColor: '#D97706',
      iconBg: '#FFFBEB',
      iconBorder: '#FDE68A',
      badgeBg: '#FFFBEB',
      badgeText: '#B45309',
      arrowBg: '#FFFBEB',
      arrowBorder: '#FEF3C7',
    },
    {
      id: 'workers-present',
      label: 'Labor Today',
      value: metricsData ? metricsData.totalActiveLabor.toString() : '-',
      subtext:
        metricsData && metricsData.totalActiveLabor > 0
          ? `${metricsData.totalActiveLabor} on site`
          : 'Shift pending',
      iconName: 'Users',
      accentColor: '#059669',
      iconBg: '#ECFDF5',
      iconBorder: '#A7F3D0',
      badgeBg: '#ECFDF5',
      badgeText: '#047857',
      arrowBg: '#ECFDF5',
      arrowBorder: '#D1FAE5',
    },
    {
      id: 'this-month',
      label: 'This Month',
      value: metricsData ? formatCurrency(metricsData.thisMonthExpenses) : '-',
      subtext: 'Expenses logged',
      iconName: 'IndianRupee',
      accentColor: '#6366F1',
      iconBg: '#EEF2FF',
      iconBorder: '#C7D2FE',
      badgeBg: '#EEF2FF',
      badgeText: '#4338CA',
      arrowBg: '#EEF2FF',
      arrowBorder: '#E0E7FF',
    },
  ];

  const renderIcon = (card: CardMeta) => {
    const props = { size: 19, strokeWidth: 2.2, color: card.accentColor };
    switch (card.iconName) {
      case 'Building2':
        return <Building2 {...props} />;
      case 'Package':
        return <Package {...props} />;
      case 'Users':
        return <Users {...props} />;
      case 'IndianRupee':
        return <IndianRupee {...props} />;
      case 'ReceiptText':
        return <ReceiptText {...props} />;
      default:
        return <Building2 {...props} />;
    }
  };

  const handlePress = (card: CardMeta) => {
    onCardPress?.({
      id: card.id,
      label: card.label,
      value: card.value,
      subtext: card.subtext,
      iconName: card.iconName,
    });
  };

  return (
    <View style={styles.container}>
      {/* Greeting Section */}
      <View style={styles.greetingContainer}>
        <View style={styles.greetingHeader}>
          <View style={styles.greetingTopRow}>
            <Text style={styles.greetingTitle}>{greeting},</Text>
            <View style={styles.liveDateBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveDateText}>{getTodayFormatted()}</Text>
            </View>
          </View>
          <Text style={styles.greetingSubtitle}>Here is today&apos;s construction overview</Text>
        </View>
      </View>

      {/* Statistics Grid */}
      <View style={styles.grid}>
        {cards.map((card) => {
          const isCurrency = card.value.startsWith('₹');
          const displayAmount = isCurrency ? card.value.replace('₹', '') : card.value;

          return (
            <Pressable
              key={card.id}
              accessibilityRole="button"
              accessibilityLabel={`${card.label}: ${card.value}, ${card.subtext}`}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() => handlePress(card)}
            >
              {/* Header: Icon badge on left, subtle action pill button on right */}
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: card.iconBg,
                      borderColor: card.iconBorder,
                    },
                  ]}
                >
                  {renderIcon(card)}
                </View>
                <View
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: card.arrowBg,
                      borderColor: card.arrowBorder,
                    },
                  ]}
                >
                  <ArrowUpRight size={13} strokeWidth={2.4} color={card.accentColor} />
                </View>
              </View>

              {/* Metric Details */}
              <View style={styles.metricDetails}>
                <Text style={styles.metricLabel}>{card.label}</Text>
                <View style={styles.valueRow}>
                  {isCurrency && <Text style={styles.currencySymbol}>₹</Text>}
                  <Text
                    style={styles.metricValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {displayAmount}
                  </Text>
                </View>
              </View>

              {/* Footer: Status micro-badge */}
              <View style={styles.cardFooter}>
                <View style={[styles.statusBadge, { backgroundColor: card.badgeBg }]}>
                  <View style={[styles.statusDot, { backgroundColor: card.accentColor }]} />
                  <Text
                    style={[styles.statusBadgeText, { color: card.badgeText }]}
                    numberOfLines={1}
                  >
                    {card.subtext}
                  </Text>
                </View>
              </View>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greetingContainer: {
    marginBottom: Spacing.md,
  },
  greetingHeader: {
    gap: 3,
  },
  greetingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  liveDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48.2%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.07)',
    shadowColor: '#07566A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 144,
    justifyContent: 'space-between',
  },
  cardPressed: {
    transform: [{ scale: 0.975 }],
    backgroundColor: '#FAFCFD',
    borderColor: 'rgba(15, 23, 42, 0.14)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricDetails: {
    marginTop: 10,
    marginBottom: 8,
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
    maxWidth: '100%',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
