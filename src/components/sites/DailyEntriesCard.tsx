import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Users, Package, IndianRupee, Plus, Pencil } from 'lucide-react-native';
import { EntityActionMenu } from '@/components/actions/EntityActionMenu';
import { Money } from '@/components/ui/Money';
import { Colors, Spacing, Radius } from '@/constants/theme';

export interface DailyEntryRow {
  id: string;
  title: string;
  detail: string;
  amount: number;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

export interface DailyEntrySection {
  id: 'attendance' | 'materials' | 'expenses';
  detail: string;
  amount: number;
  rows: DailyEntryRow[];
  onAction: () => void;
  actionLabel?: string;
}

const sectionLabels = { attendance: 'Attendance', materials: 'Materials', expenses: 'Expenses' };
const sectionIcons = { attendance: Users, materials: Package, expenses: IndianRupee };

export function DailyEntriesCard({ date, total, sections }: { date: string; total: number; sections: DailyEntrySection[] }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.heading}>
          <Text style={styles.title}>Daily entries</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <View style={styles.total}>
          <Text style={styles.totalLabel}>Daily total</Text>
          <Money amount={total} style={styles.totalAmount} />
        </View>
      </View>

      {sections.map(section => {
        const Icon = sectionIcons[section.id];
        const label = sectionLabels[section.id];
        const isEditAction =
          section.actionLabel === 'Edit' ||
          (section.id === 'attendance' && section.rows.length > 0);
        const actionLabelText = section.actionLabel || (isEditAction ? 'Edit' : 'Add');

        return (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderTitleWrap}>
                <View style={styles.sectionIconBox}>
                  <Icon size={16} color={Colors.light.brand} strokeWidth={2.2} />
                </View>
                <Text style={styles.sectionTitle}>{label}</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${actionLabelText} ${label.toLowerCase()}`}
                onPress={section.onAction}
                style={({ pressed }) => [
                  styles.action,
                  isEditAction && styles.actionEdit,
                  pressed && styles.pressed,
                ]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                {isEditAction ? (
                  <Pencil size={13} color={Colors.light.brand} strokeWidth={2.4} />
                ) : (
                  <Plus size={15} color={Colors.light.brand} strokeWidth={2.4} />
                )}
                <Text style={[styles.actionText, isEditAction && styles.actionEditText]}>
                  {actionLabelText}
                </Text>
              </Pressable>
            </View>

            <View style={styles.summary}>
              <Text style={styles.detail}>{section.detail}</Text>
              <Money amount={section.amount} style={styles.sectionAmount} />
            </View>

            {section.rows.map(row => (
              <View
                key={row.id}
                style={styles.entry}
              >
                <View style={styles.entryText}>
                  <Text style={styles.entryTitle}>{row.title}</Text>
                  <Text style={styles.entryDetail}>{row.detail}</Text>
                </View>
                <View style={styles.entryRight}>
                  <Money amount={row.amount} style={styles.entryAmount} />
                  {(row.onEdit || row.onDelete) && (
                    <EntityActionMenu
                      title={row.title}
                      subtitle={row.detail}
                      onEdit={row.onEdit}
                      onDelete={row.onDelete}
                      editLabel={row.editLabel || (section.id === 'attendance' ? 'Edit Attendance' : 'Edit')}
                      deleteLabel={row.deleteLabel || 'Delete'}
                      accessibilityLabel={`Actions for ${row.title}`}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.light.surfaceMuted,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  heading: {
    flexGrow: 1,
    flexShrink: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  date: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  total: {
    alignItems: 'flex-end',
    gap: 2,
    flexShrink: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 21,
    fontWeight: '700',
    color: Colors.light.brand,
  },
  section: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  sectionHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.xs,
    backgroundColor: Colors.light.brandBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    minHeight: 36,
    minWidth: 64,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.brandBg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionEdit: {
    backgroundColor: Colors.light.brandBg,
    borderColor: Colors.light.borderStrong,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.brand,
  },
  actionEditText: {
    color: Colors.light.brand,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.xs + 2,
  },
  detail: {
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  sectionAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  entry: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
    borderRadius: Radius.sm,
  },

  entryText: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 140,
    gap: 2,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  entryDetail: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    flexShrink: 1,
  },
});
