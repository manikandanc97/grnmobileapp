import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { DonutChart } from '@/components/ui/DonutChart';
import { Money } from '@/components/ui/Money';
import { formatCurrency } from '@/lib/finance';
import { Colors, Spacing, Radius, TouchTargets } from '@/constants/theme';

interface SiteSpendingChartProps {
  materialCost: number;
  laborCost: number;
  expenseCost: number;
  onSelect: (tab: 'materials' | 'labor' | 'cost') => void;
}

export function SiteSpendingChart({ materialCost, laborCost, expenseCost, onSelect }: SiteSpendingChartProps) {
  const data = [
    { label: 'Materials', tab: 'materials' as const, value: materialCost, color: Colors.light.brand },
    { label: 'Labour', tab: 'labor' as const, value: laborCost, color: Colors.light.accent },
    { label: 'Expenses', tab: 'cost' as const, value: expenseCost, color: Colors.light.textSecondary },
  ].map(item => ({ ...item, value: Number.isFinite(item.value) ? Math.max(0, item.value) : 0 }));
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Spending split</Text>
      <View style={styles.content}>
        <View accessible accessibilityLabel={`Total spent on this site: ${formatCurrency(total)}`} style={styles.chart}>
          <DonutChart data={data} centerValue={formatCurrency(total)} centerLabel="Total spent" size={148} strokeWidth={14} showLegend={false} emptyColor={Colors.light.border} />
        </View>
        <View style={styles.legend}>
          {data.map(item => (
            <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={`View ${item.label.toLowerCase()}, ${formatCurrency(item.value)}`} onPress={() => onSelect(item.tab)} style={({ pressed }) => [styles.legendRow, pressed && styles.pressed]}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <View style={styles.legendText}>
                <Text style={styles.label}>{item.label}</Text>
                <Money amount={item.value} style={styles.amount} />
              </View>
              {total > 0 && <Text style={styles.percent}>{Math.round(item.value / total * 100)}%</Text>}
            </Pressable>
          ))}
        </View>
      </View>
      {total === 0 && <Text style={styles.emptyText}>Your spending breakdown will appear here.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderTopWidth: 1, borderTopColor: Colors.light.border, paddingTop: Spacing.md, gap: Spacing.md },
  heading: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  content: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  chart: { alignItems: 'center', justifyContent: 'center' },
  legend: { flex: 1, minWidth: 130, gap: Spacing.xs },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minHeight: TouchTargets.min, borderRadius: Radius.sm, paddingVertical: 4 },
  pressed: { backgroundColor: Colors.light.surfaceMuted },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { flex: 1, gap: 3 },
  label: { fontSize: 12, color: Colors.light.textSecondary },
  amount: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  percent: { fontSize: 12, color: Colors.light.textSecondary },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center', color: Colors.light.textSecondary },
});
