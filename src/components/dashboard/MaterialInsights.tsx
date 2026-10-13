import { UiStyles } from '@/constants/uiStyles';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Spacing, Shadows, Colors } from '@/constants/theme';
import { DonutChart, DonutChartSlice } from '@/components/ui/DonutChart';
import type { MaterialItem } from '@/types/dashboard';

interface MaterialInsightsProps {
  totalCost?: number;
  materials?: MaterialItem[];
}

const PALETTE = [
  Colors.light.brand, // brand teal
  Colors.light.brand, // sky blue
  Colors.light.warning, // amber
  Colors.light.brand, // purple
  Colors.light.success, // green
  Colors.light.brand, // pink
  Colors.light.accent, // orange
  Colors.light.textSecondary, // slate
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
          color: Colors.light.borderStrong,
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
    ...UiStyles.card,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
});
