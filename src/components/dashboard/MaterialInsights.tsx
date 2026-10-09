import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors, Spacing, Typography, Shadows, Radius } from '@/constants/theme';
import type { MaterialItem } from '@/types/dashboard';

interface ChartSliceItem {
  label: string;
  percentage: number;
  color: string;
  cost: number;
}

interface MaterialInsightsProps {
  totalCost?: number;
  materials?: MaterialItem[];
}

export function MaterialInsights({ totalCost, materials = [] }: MaterialInsightsProps) {
  const size = 140;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const colors = ['#0F5E5C', '#22C55E', '#86EFAC', '#E79524', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

  // Calculate actual total cost from materials if not provided
  const computedTotal = totalCost ?? materials.reduce((sum, m) => sum + (m.totalCost || 0), 0);

  // Group materials by name
  const groupedMaterials = materials.reduce((acc, m) => {
    const name = m.name || 'Other';
    if (!acc[name]) acc[name] = 0;
    acc[name] += (m.totalCost || 0);
    return acc;
  }, {} as Record<string, number>);

  // Sort by cost and format data
  let data = Object.entries(groupedMaterials)
    .sort((a, b) => b[1] - a[1])
    .map(([name, cost], index) => ({
      label: name,
      percentage: computedTotal > 0 ? Math.round((cost / computedTotal) * 100) : 0,
      color: colors[index % colors.length],
      cost,
    }));

  const chartData: ChartSliceItem[] = data.length === 0
    ? [{ label: 'No Data', percentage: 100, color: '#E5E7EB', cost: 0 }]
    : data;

  const itemsWithOffsets = useMemo(() => {
    const result: Array<ChartSliceItem & { cumulativePercent: number }> = [];
    let current = 0;
    for (let i = 0; i < chartData.length; i++) {
      result.push({
        ...chartData[i],
        cumulativePercent: current,
      });
      current = current + chartData[i].percentage;
    }
    return result;
  }, [chartData]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Material Insights</Text>
      
      <View style={styles.content}>
        <View style={styles.chartContainer}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: [{ rotate: '-90deg' }] }}>
            <G>
              {itemsWithOffsets.map((item, index) => {
                const strokeDashoffset = circumference - (item.cumulativePercent / 100) * circumference;
                
                // Add a small gap by reducing the dasharray slightly
                const visualPercentage = item.percentage > 2 ? item.percentage - 1.5 : item.percentage;
                const visualDasharray = `${(visualPercentage / 100) * circumference} ${circumference}`;

                return (
                  <Circle
                    key={index}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={visualDasharray}
                    strokeDashoffset={strokeDashoffset}
                    fill="transparent"
                    strokeLinecap={Platform.OS === 'ios' ? 'round' : 'butt'}
                  />
                );
              })}
            </G>
          </Svg>
          <View style={styles.centerTextContainer}>
            <Text style={styles.totalAmount}>{formatCurrency(computedTotal)}</Text>
            <Text style={styles.totalLabel}>Total Cost</Text>
          </View>
        </View>

        <View style={styles.legendContainer}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
              <Text style={styles.legendPercentage}>{item.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    elevation: 6,
    shadowColor: '#0F354A',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: Spacing.lg,
    letterSpacing: -0.3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  legendContainer: {
    flex: 1,
    marginLeft: Spacing.xl,
    justifyContent: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendLabel: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '600',
  },
  legendPercentage: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
  },
});
