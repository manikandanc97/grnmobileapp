import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ExpenseSummaryCardProps {
  totalAmount: number;
  thisMonthAmount: number;
  pendingAmount: number;
  activeSites: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export function ExpenseSummaryCard({
  totalAmount,
  thisMonthAmount,
  pendingAmount,
  activeSites,
}: ExpenseSummaryCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Total Expenses</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
        </View>
        <View style={styles.sitesBadge}>
          <Text style={styles.sitesBadgeText}>{activeSites} Sites</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statValue}>{formatCurrency(thisMonthAmount)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{formatCurrency(pendingAmount)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7A85',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F354A',
    letterSpacing: -0.5,
  },
  sitesBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  sitesBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7A85',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7A85',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F354A',
  },
  divider: {
    width: 1,
    backgroundColor: '#EEF2F6',
    marginHorizontal: 16,
  },
});
