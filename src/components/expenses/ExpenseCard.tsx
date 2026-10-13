import { EntityActionMenu } from '@/components/actions/EntityActionMenu';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MapPin, Calendar, FolderOpen } from 'lucide-react-native';
import { ExpenseItem } from '@/types/dashboard';
import { Money } from '@/components/ui/Money';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors, Radius, Shadows } from '@/constants/theme';

export interface ExpenseCardProps {
  expense: ExpenseItem;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExpenseCard({ expense, onPress, onEdit, onDelete }: ExpenseCardProps) {
  const formattedDate = React.useMemo(() => {
    if (!expense.expenseDate) return '';
    const [y, m, d] = expense.expenseDate.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [expense.expenseDate]);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <FolderOpen size={11} color={Colors.light.textSecondary} />
          <Text style={styles.categoryText}>{expense.category}</Text>
        </View>
        <StatusBadge status={expense.paymentStatus} />
      </View>

      <Text style={styles.title} numberOfLines={2}>{expense.title}</Text>

      <View style={styles.subtextRow}>
        <View style={styles.detailItem}>
          <MapPin size={12} color={Colors.light.textSecondary} />
          <Text style={styles.detailText} numberOfLines={1}>{expense.siteName}</Text>
        </View>
        <Text style={styles.bulletSeparator}>•</Text>
        <View style={styles.detailItem}>
          <Calendar size={12} color={Colors.light.textSecondary} />
          <Text style={styles.detailText}>{formattedDate}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Money amount={expense.amount} style={styles.amount} />
        </View>

        {(onEdit || onDelete) && <EntityActionMenu accessibilityLabel={`Actions for ${expense.title}`} onEdit={onEdit} onDelete={onDelete} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 12,
    ...Shadows.sm,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    textTransform: 'none',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  detailText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  bulletSeparator: {
    fontSize: 10,
    color: Colors.light.borderStrong,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 10,
  },
  footerLeft: {
    flex: 1,
    gap: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPill: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surfaceMuted,
  },
  actionPillPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  editPill: {
    backgroundColor: Colors.light.brandBg,
  },
  deletePill: {
    backgroundColor: Colors.light.errorBg,
  },
});
