import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MapPin, Calendar, CreditCard, Pencil, Trash2, FolderOpen } from 'lucide-react-native';
import { ExpenseItem } from '@/types/dashboard';
import { Money } from '@/components/ui/Money';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors, Spacing, Typography, Radius, Shadows, IconSizes } from '@/constants/theme';

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
          <FolderOpen size={10} color={Colors.light.textSecondary} />
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
          <View style={styles.paymentMethodPill}>
            <CreditCard size={12} color={Colors.light.textSecondary} />
            <Text style={styles.paymentMethodText}>{expense.paymentMethod}</Text>
          </View>
        </View>

        {(onEdit || onDelete) && (
          <View style={styles.cardActions}>
            {onEdit && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${expense.title}`}
                style={({ pressed }) => [
                  styles.actionPill,
                  styles.editPill,
                  pressed && styles.actionPillPressed,
                ]}
                hitSlop={6}
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil size={IconSizes.sm} color={Colors.light.primary} />
              </Pressable>
            )}

            {onDelete && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${expense.title}`}
                style={({ pressed }) => [
                  styles.actionPill,
                  styles.deletePill,
                  pressed && styles.actionPillPressed,
                ]}
                hitSlop={6}
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 size={IconSizes.sm} color={Colors.light.error} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    gap: 4,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.light.text,
    marginBottom: 4,
  },
  subtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  detailText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  bulletSeparator: {
    fontSize: 10,
    color: Colors.light.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    paddingTop: Spacing.sm,
  },
  footerLeft: {
    flex: 1,
  },
  amount: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
    marginBottom: 4,
  },
  paymentMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMethodText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionPill: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  actionPillPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  editPill: {
    backgroundColor: Colors.light.primaryBg,
    borderColor: 'transparent',
  },
  deletePill: {
    backgroundColor: Colors.light.errorBg,
    borderColor: 'transparent',
  },
});
