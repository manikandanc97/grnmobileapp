import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Spacing, Radius } from '@/constants/theme';

export interface DonutChartSlice {
  label: string;
  value: number;
  color: string;
  formattedValue?: string;
  sublabel?: string;
}

interface DonutChartProps {
  data: DonutChartSlice[];
  totalValue?: number;
  centerValue?: string;
  centerLabel?: string;
  size?: number;
  strokeWidth?: number;
  emptyColor?: string;
  showLegend?: boolean;
}

export function DonutChart({
  data,
  totalValue,
  centerValue,
  centerLabel,
  size = 140,
  strokeWidth = 18,
  emptyColor = '#F1F5F9',
  showLegend = true,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate actual total
  const computedTotal = useMemo(() => {
    if (totalValue !== undefined) return totalValue;
    return data.reduce((sum, item) => sum + Math.max(0, item.value || 0), 0);
  }, [totalValue, data]);

  // Filter positive slices
  const positiveSlices = useMemo(() => {
    return data.filter((item) => (item.value || 0) > 0);
  }, [data]);

  // If there's only 1 slice with value or total is 0, handle specially to avoid SVG dash bugs
  const isSingleSlice = positiveSlices.length === 1;
  const isNoData = computedTotal <= 0 || positiveSlices.length === 0;

  // Calculate slice layouts purely and immutably
  const slicesWithLayout = useMemo(() => {
    const gap = positiveSlices.length > 1 ? 3 : 0;

    return positiveSlices.map((slice, index) => {
      const fraction = computedTotal > 0 ? slice.value / computedTotal : 0;
      const sliceLength = fraction * circumference;
      const visualLength = Math.max(1, sliceLength - gap);

      const offset = positiveSlices
        .slice(0, index)
        .reduce((sum, prev) => sum + (computedTotal > 0 ? (prev.value / computedTotal) * circumference : 0), 0);

      return {
        ...slice,
        percentage: Math.round(fraction * 100),
        visualLength,
        offset,
      };
    });
  }, [positiveSlices, computedTotal, circumference]);

  return (
    <View style={styles.wrapper}>
      {/* Donut Graphic */}
      <View style={[styles.chartContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background track circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={emptyColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {isSingleSlice ? (
            // Single item: render a seamless, complete ring
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={positiveSlices[0].color}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
          ) : !isNoData ? (
            <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
              {slicesWithLayout.map((slice, index) => (
                <Circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${slice.visualLength} ${circumference}`}
                  strokeDashoffset={-slice.offset}
                  strokeLinecap="butt"
                  fill="transparent"
                />
              ))}
            </G>
          ) : null}
        </Svg>

        {/* Center Content */}
        <View style={styles.centerTextContainer} pointerEvents="none">
          {centerValue ? (
            <Text style={styles.centerValue} numberOfLines={1} adjustsFontSizeToFit>
              {centerValue}
            </Text>
          ) : null}
          {centerLabel ? (
            <Text style={styles.centerLabel} numberOfLines={1}>
              {centerLabel}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Legend */}
      {showLegend && (
        <View style={styles.legendContainer}>
          {data.map((item, index) => {
            const pct =
              computedTotal > 0
                ? Math.round(((item.value || 0) / computedTotal) * 100)
                : 0;
            return (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <View style={styles.legendTextWrap}>
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {item.sublabel ? (
                    <Text style={styles.legendSublabel} numberOfLines={1}>
                      {item.sublabel}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.legendValueWrap}>
                  <Text style={styles.legendValue}>
                    {item.formattedValue ?? `₹${(item.value || 0).toLocaleString('en-IN')}`}
                  </Text>
                  <Text style={styles.legendPercent}>{pct}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  centerValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  centerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  legendContainer: {
    flex: 1,
    marginLeft: Spacing.lg,
    justifyContent: 'center',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    marginRight: 8,
  },
  legendTextWrap: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  legendSublabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  legendValueWrap: {
    alignItems: 'flex-end',
    marginLeft: 6,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  legendPercent: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
});
