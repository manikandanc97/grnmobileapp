import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: any;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Retry',
  style,
}: ErrorStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <View style={styles.buttonContainer}>
          <Button title={retryLabel} onPress={onRetry} variant="secondary" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.errorBg,
    borderWidth: 1,
    borderColor: Colors.light.error,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadows.sm,
  },
  title: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.error,
    marginBottom: Spacing.xs,
  },
  message: {
    ...Typography.caption,
    color: Colors.light.error,
    marginBottom: Spacing.md,
  },
  buttonContainer: {
    marginTop: Spacing.sm,
  },
});
