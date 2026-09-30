import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';

interface LaborSummaryCardProps {
  present: number;
  halfDay: number;
  absent: number;
  notMarked: number;
  total: number;
}

export function LaborSummaryCard({
  present,
  halfDay,
  absent,
  notMarked,
  total,
}: LaborSummaryCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Summary</Text>
        <Text style={styles.totalBadge}>{total} Workers</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.light.success }]} />
          <View>
            <Text style={styles.statValue}>{present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.light.warning }]} />
          <View>
            <Text style={styles.statValue}>{halfDay}</Text>
            <Text style={styles.statLabel}>Half Day</Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.light.error }]} />
          <View>
            <Text style={styles.statValue}>{absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.light.textMuted }]} />
          <View>
            <Text style={styles.statValue}>{notMarked}</Text>
            <Text style={styles.statLabel}>Unmarked</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
  },
  totalBadge: {
    ...Typography.caption,
    fontWeight: '600',
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    color: Colors.light.textSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statValue: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 0,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
});
