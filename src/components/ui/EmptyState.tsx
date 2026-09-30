import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: any;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button title={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  description: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: Spacing.lg,
    width: '100%',
    maxWidth: 200,
  },
});
