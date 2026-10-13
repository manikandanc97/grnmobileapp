import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, TouchTargets } from '@/constants/theme';
import { EXTRA_SHIFTS, ExtraShiftDraft, getDraftRoleTotals } from '@/lib/laborShifts';
import { Money } from '@/components/ui/Money';
import { formatCurrency } from '@/lib/finance';

interface Props {
  roleLabel: string;
  count: string;
  extras?: ExtraShiftDraft;
  rate: number;
  onCountChange: (count: string) => void;
  onExtrasChange: (extras: ExtraShiftDraft) => void;
  disabled?: boolean;
}

const SHIFTS = ['0.5', '1', '1.5', '2'] as const;
type Shift = typeof SHIFTS[number];
const shiftLabel = (shift: Shift) => `${shift} ${shift === '1' || shift === '0.5' ? 'shift' : 'shifts'}`;

export function LaborShiftInput({ roleLabel, count, extras = {}, rate, onCountChange, onExtrasChange, disabled }: Props) {
  // Saved groups may arrive asynchronously. A manual choice stays selected.
  const [selection, setSelection] = useState<Shift | null>(null);
  const selectedShift = selection ?? (Number(count) > 0 ? '1' : EXTRA_SHIFTS.find(shift => Number(extras[shift]) > 0) ?? '1');
  const selectedCount = selectedShift === '1' ? count : extras[selectedShift] ?? '0';
  const safeRate = Number.isFinite(rate) && rate >= 0 ? rate : 0;
  const perWorker = Number(selectedShift) * safeRate;
  const totals = getDraftRoleTotals(count, extras);
  const groups = SHIFTS.map(shift => ({ shift, workers: Number(shift === '1' ? count : extras[shift]) || 0 })).filter(group => group.workers > 0);

  const updateCount = (value: string) => {
    setSelection(selectedShift);
    if (selectedShift === '1') onCountChange(value);
    else onExtrasChange({ ...extras, [selectedShift]: value });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Shift worked</Text>
      <View style={styles.shiftOptions}>
        {SHIFTS.map(shift => (
          <Pressable key={shift} accessibilityRole="button" accessibilityLabel={`${roleLabel}: ${shiftLabel(shift)}`} accessibilityState={{ selected: selectedShift === shift, disabled: Boolean(disabled) }} onPress={() => setSelection(shift)} disabled={disabled} style={({ pressed }) => [styles.shiftOption, selectedShift === shift && styles.shiftSelected, pressed && styles.pressed, disabled && styles.disabled]}>
            <Text style={[styles.shiftText, selectedShift === shift && styles.shiftTextSelected]}>{shiftLabel(shift)}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.perWorker}>
        {formatCurrency(safeRate)} × {selectedShift} = <Text style={styles.perWorkerAmount}>{formatCurrency(perWorker)} per worker</Text>
      </Text>

      <Text style={styles.label}>Workers on {shiftLabel(selectedShift)}</Text>
      <View style={styles.counter}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Remove one ${roleLabel} worker on ${shiftLabel(selectedShift)}`} disabled={disabled || Number(selectedCount) <= 0} onPress={() => updateCount(String(Math.max(0, Number(selectedCount || '0') - 1)))} style={({ pressed }) => [styles.stepper, pressed && styles.pressed, (disabled || Number(selectedCount) <= 0) && styles.disabled]}><Text style={styles.stepperText}>−</Text></Pressable>
        <TextInput accessibilityLabel={`${roleLabel}: number of workers on ${shiftLabel(selectedShift)}`} style={styles.input} keyboardType="number-pad" value={selectedCount} onChangeText={value => { if (/^\d*$/.test(value)) updateCount(value); }} editable={!disabled} selectTextOnFocus placeholder="0" placeholderTextColor={Colors.light.textMuted} />
        <Pressable accessibilityRole="button" accessibilityLabel={`Add one ${roleLabel} worker on ${shiftLabel(selectedShift)}`} disabled={disabled} onPress={() => updateCount(String(Number(selectedCount || '0') + 1))} style={({ pressed }) => [styles.stepper, pressed && styles.pressed, disabled && styles.disabled]}><Text style={styles.stepperText}>+</Text></Pressable>
      </View>
      <Text style={styles.hint}>Different shifts? Select another shift and enter those workers.</Text>

      {groups.length > 0 && (
        <View style={styles.breakdown}>
          {groups.map(group => (
            <Pressable key={group.shift} accessibilityRole="button" accessibilityLabel={`Edit ${group.workers} workers on ${shiftLabel(group.shift)}`} disabled={disabled} onPress={() => setSelection(group.shift)} style={({ pressed }) => [styles.group, pressed && styles.pressed]}>
              <View style={styles.groupText}>
                <Text style={styles.groupTitle}>{shiftLabel(group.shift)} · {group.workers} {group.workers === 1 ? 'worker' : 'workers'}</Text>
                <Text style={styles.formula}>{group.workers} × {formatCurrency(Number(group.shift) * safeRate)}</Text>
              </View>
              <Money amount={group.workers * Number(group.shift) * safeRate} style={styles.groupAmount} />
            </Pressable>
          ))}
        </View>
      )}
      <View style={styles.totalRow}>
        <View style={styles.groupText}>
          <Text style={styles.totalLabel}>Total wages</Text>
          <Text style={styles.hint}>{totals.workers} {totals.workers === 1 ? 'worker' : 'workers'}</Text>
        </View>
        <Money amount={totals.shifts * safeRate} style={styles.totalAmount} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: Spacing.md, width: '100%' },
  label: { fontSize: 13, fontWeight: '500', color: Colors.light.text, marginBottom: Spacing.sm },
  shiftOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  shiftOption: { flexGrow: 1, flexBasis: 64, minHeight: TouchTargets.min, paddingHorizontal: 6, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.light.border, borderRadius: Radius.sm, backgroundColor: Colors.light.surface, justifyContent: 'center', alignItems: 'center' },
  shiftSelected: { borderColor: Colors.light.brand, backgroundColor: Colors.light.brandBg },
  shiftText: { fontSize: 12, color: Colors.light.textSecondary, textAlign: 'center' },
  shiftTextSelected: { fontWeight: '600', color: Colors.light.brand },
  perWorker: { fontSize: 12, lineHeight: 19, color: Colors.light.textSecondary, marginTop: Spacing.sm, marginBottom: Spacing.md },
  perWorkerAmount: { color: Colors.light.brand, fontWeight: '600' },
  counter: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  input: { flex: 1, minWidth: 0, borderWidth: 1, borderColor: Colors.light.borderStrong, borderRadius: Radius.sm, minHeight: 48, paddingHorizontal: 12, paddingVertical: 10, textAlign: 'center', backgroundColor: Colors.light.surface, fontSize: 18, fontWeight: '600', color: Colors.light.text },
  stepper: { width: 48, minHeight: 48, borderRadius: Radius.sm, backgroundColor: Colors.light.brandBg, alignItems: 'center', justifyContent: 'center' },
  stepperText: { color: Colors.light.brand, fontSize: 22 },
  hint: { fontSize: 12, lineHeight: 18, color: Colors.light.textSecondary },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
  breakdown: { marginTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.light.border },
  group: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm, minHeight: TouchTargets.min, paddingVertical: Spacing.sm },
  groupText: { flexGrow: 1, flexShrink: 1, gap: 3 },
  groupTitle: { fontSize: 12, fontWeight: '500', color: Colors.light.text },
  formula: { fontSize: 12, color: Colors.light.textSecondary },
  groupAmount: { fontSize: 14, fontWeight: '500', color: Colors.light.text, flexShrink: 1 },
  totalRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.light.border, paddingTop: Spacing.sm, marginTop: Spacing.sm },
  totalLabel: { fontSize: 13, fontWeight: '600', color: Colors.light.text },
  totalAmount: { fontSize: 18, fontWeight: '700', color: Colors.light.brand, flexShrink: 1 },
});
