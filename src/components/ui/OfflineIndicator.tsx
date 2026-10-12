import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CloudOff, RefreshCw } from 'lucide-react-native';
import { Typography, Radius } from '@/constants/theme';

export interface OfflineIndicatorProps {
  lastUpdated?: string | null;
  onRefresh?: () => void;
  onRetry?: () => void;
  isRefreshing?: boolean;
  style?: any;
}

function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return 'Previously saved';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Previously saved';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Previously saved';
  }
}

export function OfflineIndicator({
  lastUpdated,
  onRefresh,
  onRetry,
  isRefreshing = false,
  style,
}: OfflineIndicatorProps) {
  const handleAction = onRetry || onRefresh;
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <CloudOff size={14} color="#D97706" />
        <Text style={styles.text}>
          Offline • Saved at {formatRelativeTime(lastUpdated)}
        </Text>
      </View>
      {handleAction && (
        <Pressable
          onPress={handleAction}
          disabled={isRefreshing}
          style={({ pressed }) => [styles.refreshButton, pressed && styles.refreshPressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Retry syncing"
        >
          <RefreshCw
            size={12}
            color="#D97706"
            style={isRefreshing ? styles.spinning : undefined}
          />
          <Text style={styles.refreshText}>{isRefreshing ? 'Retrying…' : 'Retry'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7', // Amber 100
    borderColor: '#FDE68A',     // Amber 200
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  text: {
    ...Typography.caption,
    fontSize: 12,
    color: '#92400E', // Amber 800
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
  },
  refreshPressed: {
    opacity: 0.7,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  spinning: {
    opacity: 0.6,
  },
});
