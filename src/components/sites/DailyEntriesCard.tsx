import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Users, Package, IndianRupee, Plus } from 'lucide-react-native';
import { EntityActionMenu } from '@/components/actions/EntityActionMenu';
import { Money } from '@/components/ui/Money';
import { Colors, Spacing, Radius, TouchTargets } from '@/constants/theme';

export interface DailyEntryRow {
  id: string;
  title: string;
  detail: string;
  amount: number;
  onEdit?: () => void;
  onDelete?: () => void;
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
        return (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon size={18} color={Colors.light.brand} />
              <Text style={styles.sectionTitle}>{label}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add ${label.toLowerCase()}`}
                onPress={section.onAction}
                style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              >
                <Plus size={16} color={Colors.light.brand} />
                <Text style={styles.actionText}>Add</Text>
              </Pressable>
            </View>
            <View style={styles.summary}>
              <Text style={styles.detail}>{section.detail}</Text>
              <Money amount={section.amount} style={styles.sectionAmount} />
            </View>

            {section.rows.map(row => (
              <View key={row.id} style={styles.entry}>
                <View style={styles.entryText}>
                  <Text style={styles.entryTitle}>{row.title}</Text>
                  <Text style={styles.entryDetail}>{row.detail}</Text>
                </View>
                <View style={styles.entryRight}>
                  <Money amount={row.amount} style={styles.entryAmount} />
                  {(row.onEdit || row.onDelete) && <EntityActionMenu
                    onEdit={row.onEdit}
                    onDelete={row.onDelete}
                    accessibilityLabel={`Actions for ${row.title}`}
                  />}
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
  card: { backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.border, borderRadius: Radius.lg, marginBottom: Spacing.md },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, padding: Spacing.md, backgroundColor: Colors.light.surfaceMuted, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  heading: { flexGrow: 1, flexShrink: 1, gap: 4 },
  title: { fontSize: 18, fontWeight: '600', color: Colors.light.text },
  date: { fontSize: 13, color: Colors.light.textSecondary },
  total: { alignItems: 'flex-end', gap: 4, flexShrink: 1 },
  totalLabel: { fontSize: 12, color: Colors.light.textSecondary },
  totalAmount: { fontSize: 21, fontWeight: '700', color: Colors.light.brand },
  section: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.light.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.light.text },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: TouchTargets.min, minWidth: 64, paddingHorizontal: Spacing.sm, borderRadius: Radius.sm, backgroundColor: Colors.light.brandBg },
  actionText: { fontSize: 13, fontWeight: '600', color: Colors.light.brand },
  pressed: { backgroundColor: Colors.light.border },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, marginTop: Spacing.xs },
  detail: { flexGrow: 1, flexShrink: 1, fontSize: 13, color: Colors.light.textSecondary },
  sectionAmount: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  entry: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.sm, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.light.borderSubtle },
  entryText: { flexGrow: 1, flexShrink: 1, flexBasis: 120, gap: 4 },
  entryTitle: { fontSize: 14, fontWeight: '500', color: Colors.light.text },
  entryDetail: { fontSize: 12, lineHeight: 18, color: Colors.light.textSecondary },
  entryRight: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, maxWidth: '100%' },
  entryAmount: { fontSize: 14, fontWeight: '600', color: Colors.light.text, flexShrink: 1 },
});
