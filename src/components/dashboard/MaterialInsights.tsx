import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Shadows, Radius } from '@/constants/theme';
import { DonutChart, DonutChartSlice } from '@/components/ui/DonutChart';
import type { MaterialItem } from '@/types/dashboard';

interface MaterialInsightsProps {
  totalCost?: number;
  materials?: MaterialItem[];
}

const PALETTE = [
  '#0F5E5C', // brand teal
  '#0284C7', // sky blue
  '#D97706', // amber
  '#8B5CF6', // purple
  '#16A34A', // green
  '#EC4899', // pink
  '#F97316', // orange
  '#64748B', // slate
];

export function MaterialInsights({ totalCost, materials = [] }: MaterialInsightsProps) {
  // Calculate actual total cost from materials if not provided
  const computedTotal = useMemo(() => {
    if (totalCost !== undefined && totalCost > 0) return totalCost;
    return materials.reduce((sum, m) => sum + (m.totalCost || 0), 0);
  }, [totalCost, materials]);

  // Group materials by name and aggregate cost
  const chartData: DonutChartSlice[] = useMemo(() => {
    if (!materials || materials.length === 0) {
      return [
        {
          label: 'No Materials',
          value: 0,
          color: '#E2E8F0',
          formattedValue: '₹0',
        },
      ];
    }

    const grouped = materials.reduce<Record<string, number>>((acc, m) => {
      const name = m.name?.trim() || 'Other';
      acc[name] = (acc[name] || 0) + (m.totalCost || 0);
      return acc;
    }, {});

    const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]);

    return entries.map(([name, cost], index) => ({
      label: name,
      value: cost,
      color: PALETTE[index % PALETTE.length],
      formattedValue: `₹${cost.toLocaleString('en-IN')}`,
    }));
  }, [materials]);

  const formattedCenterValue = `₹${computedTotal.toLocaleString('en-IN')}`;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Material Breakdown</Text>
      <DonutChart
        data={chartData}
        totalValue={computedTotal}
        centerValue={formattedCenterValue}
        centerLabel="Materials"
        size={130}
        strokeWidth={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
});
