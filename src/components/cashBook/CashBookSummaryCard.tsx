import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react-native';
import { CashBookSummary, CashBookPeriodSummary } from '@/services/cashBook';
import { formatCurrency } from '@/lib/finance';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';

interface CashBookSummaryCardProps {
  summary: CashBookSummary;
  periodSummary?: CashBookPeriodSummary | null;
  hasDateFilter: boolean;
}

export function CashBookSummaryCard({
  summary,
  periodSummary,
  hasDateFilter,
}: CashBookSummaryCardProps) {
  const cashOnHand = summary.cashOnHand;
  const isPositive = cashOnHand >= 0;

  return (
    <View style={styles.container}>
      {/* Cash On Hand — primary hero metric */}
      <View style={styles.heroRow}>
        <View style={styles.heroIcon}>
          <Wallet size={22} color={Colors.light.brand} strokeWidth={2.3} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroLabel}>CASH ON HAND</Text>
          <Text style={[styles.heroAmount, isPositive ? styles.heroAmountPositive : styles.heroAmountNegative]}>
            {formatCurrency(cashOnHand)}
          </Text>
        </View>
      </View>

      {/* Inward / Outward Side by Side */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <View style={styles.metricIconWrap}>
            <TrendingUp size={16} color={Colors.light.success} strokeWidth={2.5} />
          </View>
          <View style={styles.metricTextWrap}>
            <Text style={styles.metricLabel}>Total Inward</Text>
            <Text style={styles.metricInward}>{formatCurrency(summary.totalInward)}</Text>
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <View style={styles.metricIconWrapOutward}>
            <TrendingDown size={16} color={Colors.light.error} strokeWidth={2.5} />
          </View>
          <View style={styles.metricTextWrap}>
            <Text style={styles.metricLabel}>Total Outward</Text>
            <Text style={styles.metricOutward}>{formatCurrency(summary.totalOutward)}</Text>
          </View>
        </View>
      </View>

      {/* Period summary panel (only when date filter is active) */}
      {hasDateFilter && periodSummary && (
        <View style={styles.periodContainer}>
          <Text style={styles.periodTitle}>PERIOD SUMMARY</Text>
          <View style={styles.periodRow}>
            <Text style={styles.periodLabel}>Opening Balance</Text>
            <Text style={styles.periodValue}>{formatCurrency(periodSummary.openingBalance)}</Text>
          </View>
          <View style={styles.periodRow}>
            <Text style={styles.periodLabel}>Period Inward</Text>
            <Text style={[styles.periodValue, { color: Colors.light.success }]}>
              + {formatCurrency(periodSummary.periodInward)}
            </Text>
          </View>
          <View style={styles.periodRow}>
            <Text style={styles.periodLabel}>Period Outward</Text>
            <Text style={[styles.periodValue, { color: Colors.light.error }]}>
              − {formatCurrency(periodSummary.periodOutward)}
            </Text>
          </View>
          <View style={[styles.periodRow, styles.periodClosingRow]}>
            <Text style={styles.periodClosingLabel}>Closing Balance</Text>
            <Text style={[styles.periodClosingValue, periodSummary.closingBalance >= 0 ? styles.heroAmountPositive : styles.heroAmountNegative]}>
              {formatCurrency(periodSummary.closingBalance)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 20,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.brandBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  heroAmountPositive: {
    color: Colors.light.text,
  },
  heroAmountNegative: {
    color: Colors.light.error,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconWrapOutward: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextWrap: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 34,
    backgroundColor: Colors.light.border,
    marginHorizontal: 12,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  metricInward: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.success,
  },
  metricOutward: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.error,
  },
  periodContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 8,
  },
  periodTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  periodValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  periodClosingRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 8,
    marginTop: 4,
  },
  periodClosingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  periodClosingValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});
