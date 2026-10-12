import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff, CheckCircle2, RefreshCw } from 'lucide-react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Colors, Typography, Radius, Shadows } from '@/constants/theme';

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();
  const { isSyncing, pendingCount } = useOfflineSync();

  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  const [translateY] = useState(() => new Animated.Value(-80));
  const [opacity] = useState(() => new Animated.Value(0));
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOffline) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWasOffline(true);
      setShowRestored(false);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (wasOffline) {
      // Just transitioned from offline to online
      setShowRestored(true);

      const delay = pendingCount > 0 || isSyncing ? 3500 : 2500;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -80,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setWasOffline(false);
          setShowRestored(false);
        });
      }, delay);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isOffline, wasOffline, pendingCount, isSyncing, translateY, opacity]);

  if (!isOffline && !showRestored) {
    return null;
  }

  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 44 : 8);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topInset + 4,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View
        style={[
          styles.bannerCard,
          isOffline ? styles.offlineCard : styles.onlineCard,
        ]}
      >
        <View style={styles.iconWrapper}>
          {isOffline ? (
            <WifiOff size={16} color={Colors.light.warning} strokeWidth={2.2} />
          ) : isSyncing ? (
            <ActivityIndicator size="small" color={Colors.light.brand} />
          ) : (
            <CheckCircle2 size={16} color={Colors.light.success} strokeWidth={2.2} />
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {isOffline
              ? 'No internet connection'
              : isSyncing
              ? 'Connection restored'
              : 'Connection restored'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {isOffline
              ? pendingCount > 0
                ? `Using cached data • ${pendingCount} pending change${pendingCount > 1 ? 's' : ''}`
                : 'Your saved data is available where possible.'
              : isSyncing
              ? 'Syncing pending changes with server…'
              : pendingCount > 0
              ? `Sync complete (${pendingCount} pending)`
              : 'All systems online.'}
          </Text>
        </View>

        {isSyncing && (
          <View style={styles.syncTag}>
            <RefreshCw size={12} color={Colors.light.brand} />
            <Text style={styles.syncTagText}>Syncing</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9998,
    alignItems: 'center',
  },
  bannerCard: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    ...Shadows.md,
    elevation: 6,
  },
  offlineCard: {
    backgroundColor: '#FFFBEB', // Light amber background
    borderColor: '#FDE68A',
  },
  onlineCard: {
    backgroundColor: '#ECFDF5', // Light green background
    borderColor: '#A7F3D0',
  },
  iconWrapper: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  syncTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7, 86, 106, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginLeft: 8,
  },
  syncTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.brand,
  },
});
