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
            <Calendar size={12} color={isThisMonthSelected ? Colors.light.brand : '#64748B'} />
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
            <Clock size={12} color={isPendingSelected ? '#EF4444' : '#64748B'} />
            <Text style={[styles.statLabel, isPendingSelected && { color: '#DC2626', fontWeight: '700' }]}>
              Pending
            </Text>
            {isPendingSelected && <View style={[styles.activeDot, { backgroundColor: '#EF4444' }]} />}
          </View>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>
            {formatCurrency(pendingAmount)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
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
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  totalValue: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
  },
  sitesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
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
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.04)',
  },
  statItem: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  statItemActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.brand,
    elevation: 2,
    shadowColor: Colors.light.brand,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItemPendingActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    elevation: 2,
    shadowColor: '#EF4444',
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
    color: '#64748B',
  },
  statLabelActive: {
    color: Colors.light.brand,
    fontWeight: '800',
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
    fontWeight: '800',
    color: '#0F172A',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    marginVertical: 4,
  },
  pressedState: {
    opacity: 0.7,
  },
});
