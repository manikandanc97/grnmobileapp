import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { WorkerItem, WorkerStatus } from '@/types/dashboard';
import { Colors, Spacing, Typography, Radius, TouchTargets } from '@/constants/theme';

interface WorkerCardProps {
  worker: WorkerItem;
  onPress: () => void;
  onStatusChange: (status: WorkerStatus) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function WorkerCard({
  worker,
  onPress,
  onStatusChange,
}: WorkerCardProps) {
  const status = worker.todayStatus || 'Not Marked';

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [styles.infoArea, pressed && styles.pressed]}
        onPress={onPress}
      >
        <Text style={styles.name} numberOfLines={1}>{worker.name}</Text>
        <View style={styles.subtextRow}>
          <Text style={styles.role}>{worker.role}</Text>
          <Text style={styles.bulletSeparator}>•</Text>
          <Text style={styles.site} numberOfLines={1}>{worker.siteName}</Text>
        </View>
      </Pressable>

      <View style={styles.statusSegmentContainer}>
        <Pressable
          style={[
            styles.segmentButton,
            styles.segmentLeft,
            status === 'Present' && styles.segmentPresentActive,
          ]}
          hitSlop={6}
          onPress={() => onStatusChange('Present')}
        >
          <Text
            style={[
              styles.segmentText,
              status === 'Present' && styles.segmentTextActivePresent,
            ]}
          >
            P
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segmentButton,
            styles.segmentMiddle,
            status === 'Half Day' && styles.segmentHalfDayActive,
          ]}
          hitSlop={6}
          onPress={() => onStatusChange('Half Day')}
        >
          <Text
            style={[
              styles.segmentText,
              status === 'Half Day' && styles.segmentTextActiveHalfDay,
            ]}
          >
            HD
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segmentButton,
            styles.segmentRight,
            status === 'Absent' && styles.segmentAbsentActive,
          ]}
          hitSlop={6}
          onPress={() => onStatusChange('Absent')}
        >
          <Text
            style={[
              styles.segmentText,
              status === 'Absent' && styles.segmentTextActiveAbsent,
            ]}
          >
            A
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  infoArea: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  name: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  subtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  role: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  bulletSeparator: {
    fontSize: 10,
    color: Colors.light.textMuted,
  },
  site: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    flexShrink: 1,
  },
  statusSegmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface,
    overflow: 'hidden',
  },
  segmentButton: {
    paddingHorizontal: 12,
    height: TouchTargets.min,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
  },
  segmentLeft: {
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
  },
  segmentMiddle: {
    borderRightWidth: 1,
    borderRightColor: Colors.light.border,
  },
  segmentRight: {},
  segmentText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  segmentPresentActive: {
    backgroundColor: Colors.light.successBg,
    borderColor: Colors.light.success,
  },
  segmentTextActivePresent: {
    color: Colors.light.success,
  },
  segmentHalfDayActive: {
    backgroundColor: Colors.light.warningBg,
  },
  segmentTextActiveHalfDay: {
    color: Colors.light.warning,
  },
  segmentAbsentActive: {
    backgroundColor: Colors.light.errorBg,
  },
  segmentTextActiveAbsent: {
    color: Colors.light.error,
  },
});
