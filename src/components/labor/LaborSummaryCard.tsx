import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LaborSummaryCardProps {
  present: number;
  absent: number;
  notMarked: number;
  total: number;
  attendancePercentage: number;
}

export function LaborSummaryCard({
  present,
  absent,
  notMarked,
  total,
  attendancePercentage,
}: LaborSummaryCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today&apos;s Overview</Text>
          <Text style={styles.subtitle}>Total Workers: {total}</Text>
        </View>
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>{attendancePercentage}%</Text>
          <Text style={styles.percentageLabel}>Attendance</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
          <View>
            <Text style={styles.statValue}>{present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
          <View>
            <Text style={styles.statValue}>{absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#9CA3AF' }]} />
          <View>
            <Text style={styles.statValue}>{notMarked}</Text>
            <Text style={styles.statLabel}>Not Marked</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7A85',
    fontWeight: '500',
  },
  percentageContainer: {
    alignItems: 'flex-end',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F2A619',
    letterSpacing: -0.5,
  },
  percentageLabel: {
    fontSize: 12,
    color: '#6B7A85',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7A85',
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#EEF2F6',
  },
});
