import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

export interface NoInternetScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => Promise<void> | void;
  retryLabel?: string;
  fullScreen?: boolean;
}

export function NoInternetScreen({
  title = "You're offline",
  message = 'Check your internet connection and try again to fetch latest data.',
  onRetry,
  retryLabel = 'Retry Connection',
  fullScreen = true,
}: NoInternetScreenProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <WifiOff size={32} color={Colors.light.brand} strokeWidth={2.2} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {onRetry && (
          <View style={styles.buttonContainer}>
            <Button
              title={retryLabel}
              onPress={handleRetry}
              loading={retrying}
              disabled={retrying}
              variant="primary"
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.xl,
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(7, 86, 106, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.sectionTitle,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 220,
  },
});
