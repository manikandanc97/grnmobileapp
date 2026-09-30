import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { formatCurrency } from '@/lib/finance';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';
import { Clock, Building2 } from 'lucide-react-native';

interface ExpenseSummaryCardProps {
  totalAmount: number;
  thisMonthAmount: number;
  pendingAmount: number;
  activeSites: number;
  isThisMonthSelected?: boolean;
  isPendingSelected?: boolean;
  onPressThisMonth?: () => void;
  onPressPending?: () => void;
  onPressTotal?: () => void;
}

export function ExpenseSummaryCard({
  totalAmount,
  thisMonthAmount,
  pendingAmount,
  activeSites,
  isThisMonthSelected,
  isPendingSelected,
  onPressThisMonth,
  onPressPending,
  onPressTotal,
}: ExpenseSummaryCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onPressTotal}
          style={({ pressed }) => [pressed && styles.pressedState]}
        >
          <Text style={styles.title}>Total Expenses</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
        </Pressable>
        <View style={styles.sitesBadge}>
          <Building2 size={12} color={Colors.light.textSecondary} />
          <Text style={styles.sitesBadgeText}>{activeSites} Sites</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.statItem,
            isThisMonthSelected && styles.statItemActive,
            pressed && styles.pressedState,
          ]}
          onPress={onPressThisMonth}
        >
          <View style={styles.statLabelRow}>
            <Text style={[styles.statLabel, isThisMonthSelected && styles.statLabelActive]}>
              This Month
            </Text>
            {isThisMonthSelected && <View style={styles.activeDot} />}
          </View>
          <Text style={[styles.statValue, isThisMonthSelected && { color: Colors.light.brand }]}>
            {formatCurrency(thisMonthAmount)}
          </Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [
            styles.statItem,
            isPendingSelected && styles.statItemPendingActive,
            pressed && styles.pressedState,
          ]}
          onPress={onPressPending}
        >
          <View style={styles.statLabelRow}>
            <Clock size={12} color={isPendingSelected ? Colors.light.error : Colors.light.textSecondary} />
            <Text style={[styles.statLabel, isPendingSelected && { color: Colors.light.error, fontWeight: '700' }]}>
              Pending
            </Text>
            {isPendingSelected && <View style={[styles.activeDot, { backgroundColor: Colors.light.error }]} />}
          </View>
          <Text style={[styles.statValue, { color: Colors.light.error }]}>
            {formatCurrency(pendingAmount)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  totalValue: {
    ...Typography.display,
    color: Colors.light.text,
  },
  sitesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  sitesBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    padding: 6,
  },
  statItem: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  statItemActive: {
    backgroundColor: Colors.light.warningBg,
    borderWidth: 1,
    borderColor: Colors.light.warning,
  },
  statItemPendingActive: {
    backgroundColor: Colors.light.errorBg,
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  statLabelActive: {
    color: Colors.light.brand,
    fontWeight: '700',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.brand,
    marginLeft: 4,
  },
  statValue: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.light.borderSubtle,
    marginVertical: Spacing.xs,
  },
  pressedState: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
