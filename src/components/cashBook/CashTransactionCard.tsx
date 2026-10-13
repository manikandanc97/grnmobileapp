import { EntityActionMenu } from '@/components/actions/EntityActionMenu';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { CashTransactionRow, formatDisplayDate } from '@/services/cashBook';
import { formatCurrency } from '@/lib/finance';
import { Colors, Radius, Shadows } from '@/constants/theme';

export interface CashTransactionCardProps {
  transaction: CashTransactionRow & { runningBalance?: number };
  showRunningBalance?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onPress?: () => void;
}

export function CashTransactionCard({
  transaction,
  showRunningBalance = true,
  onEdit,
  onDelete,
  onPress,
}: CashTransactionCardProps) {
  const isInward = transaction.transaction_type === 'INWARD';

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
      accessible
      accessibilityLabel={`${isInward ? 'Inward' : 'Outward'}: ${transaction.particulars}, ${formatCurrency(transaction.amount)}`}
    >
      {/* Left accent bar */}
      <View style={[styles.accent, isInward ? styles.accentInward : styles.accentOutward]} />

      <View style={styles.body}>
        {/* Top row: badge + date */}
        <View style={styles.topRow}>
          <View style={[styles.typeBadge, isInward ? styles.typeBadgeInward : styles.typeBadgeOutward]}>
            {isInward ? (
              <TrendingUp size={11} color={Colors.light.success} strokeWidth={2.5} />
            ) : (
              <TrendingDown size={11} color={Colors.light.error} strokeWidth={2.5} />
            )}
            <Text style={[styles.typeText, isInward ? styles.typeTextInward : styles.typeTextOutward]}>
              {isInward ? 'INWARD' : 'OUTWARD'}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDisplayDate(transaction.transaction_date)}</Text>
        </View>

        {/* Particulars */}
        <Text style={styles.particulars} numberOfLines={2}>
          {transaction.particulars}
        </Text>

        {/* Footer: amount + running balance + actions */}
        <View style={styles.footer}>
          <View style={styles.amountBlock}>
            <Text style={[styles.amount, isInward ? styles.amountInward : styles.amountOutward]}>
              {isInward ? '+ ' : '− '}
              {formatCurrency(transaction.amount)}
            </Text>
            {showRunningBalance && transaction.runningBalance !== undefined && (
              <View style={styles.balancePill}>
                <Text style={styles.runningBalance}>
                  Balance: {formatCurrency(transaction.runningBalance)}
                </Text>
              </View>
            )}
          </View>

          {(onEdit || onDelete) && <EntityActionMenu accessibilityLabel="Transaction actions" onEdit={onEdit} onDelete={onDelete} />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 10,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  accent: {
    width: 4,
    borderRadius: 4,
    marginVertical: 12,
    marginLeft: 6,
  },
  accentInward: {
    backgroundColor: Colors.light.success,
  },
  accentOutward: {
    backgroundColor: Colors.light.error,
  },
  body: {
    flex: 1,
    padding: 14,
    paddingLeft: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  typeBadgeInward: {
    backgroundColor: Colors.light.successBg,
  },
  typeBadgeOutward: {
    backgroundColor: Colors.light.errorBg,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeTextInward: {
    color: Colors.light.success,
  },
  typeTextOutward: {
    color: Colors.light.error,
  },
  dateText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  particulars: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountBlock: {
    flex: 1,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
  },
  amountInward: {
    color: Colors.light.success,
  },
  amountOutward: {
    color: Colors.light.error,
  },
  balancePill: {
    backgroundColor: Colors.light.background,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    marginTop: 4,
  },
  runningBalance: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.brandBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: Colors.light.errorBg,
  },
  actionBtnPressed: {
    opacity: 0.7,
  },
});
