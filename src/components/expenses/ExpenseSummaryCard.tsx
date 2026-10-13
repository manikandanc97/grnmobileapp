import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { formatCurrency } from '@/lib/finance';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { Clock, Building2, Calendar } from 'lucide-react-native';

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
          style={({ pressed }) => [styles.totalPressable, pressed && styles.pressedState]}
        >
          <Text style={styles.title}>TOTAL EXPENSES</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
        </Pressable>
        <View style={styles.sitesBadge}>
          <Building2 size={12} color={Colors.light.brand} />
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
            <Calendar size={12} color={isThisMonthSelected ? Colors.light.brand : Colors.light.textSecondary} />
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
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.md,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  totalPressable: {
    gap: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 0.6,
  },
  totalValue: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: -0.8,
  },
  sitesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.brandBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  sitesBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.brand,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
    borderRadius: Radius.lg,
    padding: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  statItemActive: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.brand,
    elevation: 2,
    shadowColor: Colors.light.brand,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItemPendingActive: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.error,
    elevation: 2,
    shadowColor: Colors.light.error,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
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
    marginLeft: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 4,
  },
  pressedState: {
    opacity: 0.7,
  },
});
